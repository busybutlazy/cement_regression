import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.api.analyze import router as analyze_router


def get_static_dir() -> str | None:
    """Locate the frontend dist folder whether running from source or PyInstaller bundle."""
    if getattr(sys, "frozen", False):
        # PyInstaller bundle: files are extracted to sys._MEIPASS
        base = sys._MEIPASS  # type: ignore[attr-defined]
    else:
        # Running from source: dist is two levels up from this file
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


# Mount frontend static files if the dist folder exists (desktop / production mode)
_static_dir = get_static_dir()
if _static_dir:
    app.mount("/assets", StaticFiles(directory=os.path.join(_static_dir, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str) -> FileResponse:
        return FileResponse(os.path.join(_static_dir, "index.html"))
