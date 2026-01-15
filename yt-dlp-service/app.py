import os
import time
import uuid
import asyncio
import logging
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Header
from fastapi.responses import FileResponse
from pydantic import BaseModel
from starlette.background import BackgroundTasks

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TOKEN = os.getenv('YTDLP_TOKEN')
COOKIE_PATH = os.getenv('COOKIE_PATH', '/config/cookies.txt')
DATA_DIR = Path(os.getenv('DATA_DIR', '/data'))
PUBLIC_BASE_URL = os.getenv('PUBLIC_BASE_URL', 'https://yt.micr.dev').rstrip('/')
TOKEN_TTL_SECONDS = int(os.getenv('TOKEN_TTL_SECONDS', '900'))

app = FastAPI()
DATA_DIR.mkdir(parents=True, exist_ok=True)

class SegmentRequest(BaseModel):
    start: int
    end: Optional[int] = None
    title: Optional[str] = None

class DownloadRequest(BaseModel):
    url: str
    format: str = 'best'
    segments: Optional[list[SegmentRequest]] = None

class DownloadResponse(BaseModel):
    status: str
    url: Optional[str] = None
    filename: Optional[str] = None
    quality: Optional[str] = None
    error: Optional[str] = None

_downloads = {}


def _require_auth(authorization: Optional[str]) -> None:
    if not TOKEN:
        # Fail closed: If token is not configured, deny access
        logger.error("YTDLP_TOKEN not set in environment")
        raise HTTPException(status_code=500, detail="Server authentication misconfigured")

    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Missing token')
    if authorization.split(' ', 1)[1] != TOKEN:
        raise HTTPException(status_code=401, detail='Invalid token')


def _cleanup_expired() -> None:
    now = time.time()
    expired = [token for token, meta in _downloads.items() if meta['expires'] <= now]
    for token in expired:
        path = _downloads[token]['path']
        try:
            Path(path).unlink(missing_ok=True)
            logger.info(f"Cleaned up expired file: {path}")
        except Exception as e:
            logger.error(f"Error cleaning up {path}: {e}")
        _downloads.pop(token, None)


async def _cleanup_loop():
    logger.info("Starting cleanup loop")
    while True:
        try:
            _cleanup_expired()
        except Exception as e:
            logger.error(f"Error in cleanup loop: {e}")
        await asyncio.sleep(60)


def _startup_cleanup():
    logger.info("Running startup cleanup")
    try:
        # Scan DATA_DIR for leftover files
        for path in DATA_DIR.glob('*'):
            if path.is_file():
                try:
                    path.unlink()
                    logger.info(f"Deleted orphan file: {path}")
                except Exception as e:
                    logger.error(f"Failed to delete {path}: {e}")
    except Exception as e:
        logger.error(f"Startup cleanup failed: {e}")


@app.on_event("startup")
async def startup_event():
    _startup_cleanup()
    asyncio.create_task(_cleanup_loop())


def _format_timestamp(seconds: int) -> str:
    total_seconds = max(0, int(seconds))
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    remaining = total_seconds % 60

    if hours > 0:
        return f"{hours}:{minutes:02d}:{remaining:02d}"
    return f"{minutes}:{remaining:02d}"


def _segment_value(segment: SegmentRequest | dict, key: str) -> Optional[int]:
    if isinstance(segment, dict):
        return segment.get(key)
    return getattr(segment, key)


def _format_section(segment: SegmentRequest | dict) -> str:
    start_value = _segment_value(segment, 'start') or 0
    end_value = _segment_value(segment, 'end')
    start = _format_timestamp(start_value)
    if end_value is None:
        return f"*{start}-"
    end = _format_timestamp(end_value)
    return f"*{start}-{end}"


def build_ytdlp_args(url: str, fmt: str, output_prefix: str, segments: Optional[list[SegmentRequest]]) -> list[str]:
    output_template = f"{output_prefix}.%(ext)s"
    args = [
        'yt-dlp',
        '--no-playlist', '--remote-components', 'ejs:github',
        '--no-part',
        '--cookies', COOKIE_PATH,
        '--add-metadata',
        '--embed-thumbnail',
        '--parse-metadata', 'title:%(title)s',
    ]

    if segments:
        output_template = f"{output_prefix}.%(section_start)s-%(section_end)s.%(ext)s"
        for segment in segments:
            args.extend(['--download-sections', _format_section(segment)])
        args.append('--force-keyframes-at-cuts')

    args.extend(['--output', output_template])

    if fmt == 'best':
        args.extend(['-f', 'bestaudio'])
    else:
        args.extend(['-f', 'bestaudio', '--extract-audio', '--audio-format', fmt, '--audio-quality', '0'])

    args.append(url)
    return args


async def _run_ytdlp(url: str, fmt: str, output_prefix: str, segments: Optional[list[SegmentRequest]]) -> Path:
    args = build_ytdlp_args(url, fmt, output_prefix, segments)

    logger.info(f"Starting yt-dlp for {url}")
    process = await asyncio.create_subprocess_exec(
        *args,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    stdout, stderr = await process.communicate()

    if process.returncode != 0:
        error_msg = stderr.decode().strip() or 'yt-dlp failed'
        logger.error(f"yt-dlp failed: {error_msg}")
        raise RuntimeError(error_msg)

    matches = sorted(DATA_DIR.glob(f'{Path(output_prefix).name}.*'))
    if not matches:
        raise RuntimeError('Download file missing')
    return matches[0]


@app.get('/health')
def health():
    return {'status': 'ok'}

@app.get('/healthz')
def healthz():
    return {'status': 'ok'}


@app.post('/download', response_model=DownloadResponse)
async def download(request: DownloadRequest, authorization: Optional[str] = Header(default=None)):
    _require_auth(authorization)
    # Cleanup is now handled by background loop

    fmt = request.format.lower()
    if fmt not in {'best', 'mp3', 'ogg', 'wav'}:
        raise HTTPException(status_code=400, detail='Unsupported format')

    download_id = uuid.uuid4().hex
    output_prefix = str(DATA_DIR / download_id)

    try:
        file_path = await _run_ytdlp(request.url, fmt, output_prefix, request.segments)
    except Exception as exc:
        return DownloadResponse(status='error', error=str(exc))

    token = uuid.uuid4().hex
    _downloads[token] = {
        'path': str(file_path),
        'expires': time.time() + TOKEN_TTL_SECONDS
    }

    return DownloadResponse(
        status='ok',
        url=f'{PUBLIC_BASE_URL}/file/{token}',
        filename=file_path.name,
        quality=fmt.upper() if fmt != 'best' else 'BEST'
    )


@app.get('/file/{token}')
def get_file(token: str, background_tasks: BackgroundTasks):
    meta = _downloads.get(token)
    if not meta:
        raise HTTPException(status_code=404, detail='File not found')

    path = Path(meta['path'])
    if not path.exists():
        _downloads.pop(token, None)
        raise HTTPException(status_code=404, detail='File not found')

    def cleanup():
        try:
            path.unlink(missing_ok=True)
        finally:
            _downloads.pop(token, None)

    background_tasks.add_task(cleanup)
    return FileResponse(path, filename=path.name, media_type='application/octet-stream')
