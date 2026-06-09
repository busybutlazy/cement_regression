"""Entry point for PyInstaller bundle and direct execution.

Usage (dev):
    python backend/run.py [--port 8000]

Usage (PyInstaller):
    backend.exe [--port 18432] [--static-dir <path>]
"""
import argparse
import os
import sys


def main() -> None:
    parser = argparse.ArgumentParser(description="Tank Flow Estimator backend")
    parser.add_argument("--port", type=int, default=int(os.environ.get("BACKEND_PORT", 8000)))
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--static-dir", default=None,
                        help="Absolute path to frontend dist folder (set by Electron)")
    args = parser.parse_args()

    # Set env var BEFORE importing app so get_static_dir() sees it at module load time
    if args.static_dir:
        os.environ["FRONTEND_DIST"] = args.static_dir

    # Import after env var is set
    import uvicorn
    from app.main import app as fastapi_app  # noqa: E402 (intentional late import)

    uvicorn.run(
        fastapi_app,
        host=args.host,
        port=args.port,
        log_level="warning",
    )


if __name__ == "__main__":
    main()
