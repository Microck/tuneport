# PROJECT KNOWLEDGE BASE

**Generated:** 2025-01-18
**Context:** yt-dlp Service

## OVERVIEW
Self-hosted Python API wrapper for `yt-dlp`.
Provides authenticated download endpoints and file management for the extension.
Uses FastAPI and Docker.

## STRUCTURE
```
yt-dlp-service/
├── app.py              # Main FastAPI application
├── Dockerfile          # Container definition
├── requirements.txt    # Python dependencies
└── test_*.py           # Unit tests
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **API Endpoints** | `app.py` | `/download`, `/file/{token}` |
| **Args Building** | `app.py` -> `build_ytdlp_args` | yt-dlp command construction |
| **Cleanup** | `app.py` -> `_cleanup_loop` | Auto-deletion of files |
| **Auth** | `app.py` -> `_require_auth` | Bearer token validation |

## CONVENTIONS
- **Async**: Uses `asyncio` for non-blocking subprocess calls (ffmpeg, yt-dlp).
- **Validation**: Pydantic models for request/response bodies.
- **Config**: Environment variables for tokens and paths.
- **Logging**: Standard Python logging.

## ANTI-PATTERNS
- **Blocking**: Do not use blocking I/O in route handlers.
- **Shell Injection**: Always use list arguments for subprocess (no `shell=True`).

## COMMANDS
```bash
docker-compose up       # Run service
python -m unittest      # Run tests
```
