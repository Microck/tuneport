import os
import time
import uuid
import asyncio
import logging
import shlex
from pathlib import Path
from typing import Optional, Literal

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
    segment_mode: Optional[Literal['single', 'multiple']] = None
    title: Optional[str] = None
    artist: Optional[str] = None

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


def _clean_metadata(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    trimmed = value.strip()
    return trimmed if trimmed else None


def _build_metadata_args(title: Optional[str], artist: Optional[str]) -> Optional[str]:
    parts = []
    clean_title = _clean_metadata(title)
    clean_artist = _clean_metadata(artist)
    if clean_title:
        parts.extend(['-metadata', f'title={clean_title}'])
    if clean_artist:
        parts.extend(['-metadata', f'artist={clean_artist}'])
    if not parts:
        return None
    return 'ffmpeg:' + ' '.join(shlex.quote(part) for part in parts)


def build_ytdlp_args(url: str, fmt: str, output_prefix: str, segments: Optional[list[SegmentRequest]], title: Optional[str], artist: Optional[str], write_thumbnail: bool = False) -> list[str]:
    output_template = f"{output_prefix}.%(ext)s"
    args = [
        'yt-dlp',
        '--no-playlist', '--remote-components', 'ejs:github',
        '--no-part',
        '--cookies', COOKIE_PATH,
        '--add-metadata',
        '--embed-thumbnail',
        '--convert-thumbnails', 'jpg',
        '--parse-metadata', 'title:%(title)s',
    ]

    if write_thumbnail:
        args.append('--write-thumbnail')

    if segments:
        output_template = f"{output_prefix}.%(section_start)s-%(section_end)s.%(ext)s"
        for segment in segments:
            args.extend(['--download-sections', _format_section(segment)])
        args.append('--force-keyframes-at-cuts')

    metadata_args = _build_metadata_args(title, artist)
    if metadata_args:
        args.extend(['--postprocessor-args', metadata_args])

    args.extend(['--output', output_template])

    if fmt == 'best':
        args.extend(['-f', 'bestaudio', '--extract-audio', '--audio-format', 'opus', '--audio-quality', '0'])
    else:
        args.extend(['-f', 'bestaudio', '--extract-audio', '--audio-format', fmt, '--audio-quality', '0'])

    args.append(url)
    return args


def _is_thumbnail(path: Path) -> bool:
    return path.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}


def _escape_concat_path(path: Path) -> str:
    return str(path).replace("'", "'\\''")


def _find_thumbnail(output_prefix: str) -> Optional[Path]:
    base = Path(output_prefix).name
    for ext in ('*.jpg', '*.jpeg', '*.png', '*.webp'):
        matches = sorted(DATA_DIR.glob(f"{base}*{ext}"))
        if matches:
            return matches[0]
    return None


async def _merge_segments(output_prefix: str, segment_files: list[Path], title: Optional[str], artist: Optional[str]) -> Path:
    if not segment_files:
        raise RuntimeError('Segment files missing')

    sorted_segments = sorted(segment_files, key=lambda path: path.stat().st_mtime)
    concat_list = DATA_DIR / f"{Path(output_prefix).name}_concat.txt"

    with concat_list.open('w', encoding='utf-8') as handle:
        for path in sorted_segments:
            handle.write(f"file '{_escape_concat_path(path)}'\n")

    merged_path = DATA_DIR / f"{Path(output_prefix).name}_merged{sorted_segments[0].suffix}"
    thumbnail = _find_thumbnail(output_prefix)
    include_cover = thumbnail is not None and sorted_segments[0].suffix.lower() == '.mp3'

    args = ['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', str(concat_list)]

    if include_cover:
        args.extend([
            '-i', str(thumbnail),
            '-map', '0:a',
            '-map', '1:v',
            '-c:a', 'copy',
            '-c:v', 'mjpeg',
            '-disposition:v:0', 'attached_pic'
        ])
    else:
        args.extend(['-c', 'copy'])

    clean_title = _clean_metadata(title)
    clean_artist = _clean_metadata(artist)
    if clean_title:
        args.extend(['-metadata', f'title={clean_title}'])
    if clean_artist:
        args.extend(['-metadata', f'artist={clean_artist}'])

    args.append(str(merged_path))

    process = await asyncio.create_subprocess_exec(
        *args,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    stdout, stderr = await process.communicate()

    if process.returncode != 0:
        error_msg = stderr.decode().strip() or stdout.decode().strip() or 'ffmpeg concat failed'
        raise RuntimeError(error_msg)

    concat_list.unlink(missing_ok=True)
    for path in segment_files:
        path.unlink(missing_ok=True)
    if thumbnail:
        thumbnail.unlink(missing_ok=True)

    return merged_path


async def _run_ytdlp(
    url: str,
    fmt: str,
    output_prefix: str,
    segments: Optional[list[SegmentRequest]],
    title: Optional[str],
    artist: Optional[str],
    segment_mode: Optional[str]
) -> Path:
    args = build_ytdlp_args(
        url,
        fmt,
        output_prefix,
        segments,
        title,
        artist,
        write_thumbnail=segment_mode == 'single'
    )

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

    audio_matches = [path for path in matches if not _is_thumbnail(path)]
    if not audio_matches:
        raise RuntimeError('Download file missing')

    if segments and segment_mode == 'single':
        return await _merge_segments(output_prefix, audio_matches, title, artist)

    return audio_matches[0]


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
        file_path = await _run_ytdlp(
            request.url,
            fmt,
            output_prefix,
            request.segments,
            request.title,
            request.artist,
            request.segment_mode
        )
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
