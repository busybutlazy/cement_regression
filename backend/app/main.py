import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.api.analyze import router as analyze_router


def get_static_dir() -> str | None:
    """Locate the frontend dist folder.

    Priority:
    1. FRONTEND_DIST env var — set by Electron when spawning backend.exe.
    2. Relative to the exe when frozen — backend.exe lives at
       resources/backend/backend.exe, so frontend_dist is one level up.
    3. Source-relative fallback for dev / Docker.
    """
    # 1. Explicit env var
    env_path = os.environ.get("FRONTEND_DIST")
    if env_path and os.path.isdir(env_path):
        return env_path

    # 2. PyInstaller bundle: look next to the exe
    if getattr(sys, "frozen", False):
        exe_dir = os.path.dirname(sys.executable)
        candidate = os.path.normpath(os.path.join(exe_dir, "..", "frontend_dist"))
        if os.path.isdir(candidate):
            return candidate

    # 3. Source fallback
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    candidate = os.path.join(base, "frontend_dist")
    return candidate if os.path.isdir(candidate) else None


app = FastAPI(title="Tank Flow Estimator API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix="/api")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/debug-info", include_in_schema=False)
def debug_info() -> dict:
    """Temporary endpoint to diagnose static file path issues."""
    import glob as _glob
    static = get_static_dir()
    exe_dir = os.path.dirname(sys.executable) if getattr(sys, "frozen", False) else "not frozen"
    return {
        "frontend_dist_env": os.environ.get("FRONTEND_DIST"),
        "resolved_static_dir": static,
        "static_dir_exists": os.path.isdir(static) if static else False,
        "frozen": getattr(sys, "frozen", False),
        "exe_dir": exe_dir,
        "meipass": getattr(sys, "_MEIPASS", None),
    }


# Mount frontend static files if the dist folder exists (desktop / production mode)
_static_dir = get_static_dir()
if _static_dir:
    _assets_dir = os.path.join(_static_dir, "assets")
    if os.path.isdir(_assets_dir):
        app.mount("/assets", StaticFiles(directory=_assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str) -> FileResponse:
        return FileResponse(os.path.join(_static_dir, "index.html"))
