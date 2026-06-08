"""Entry point for PyInstaller bundle and direct execution.

Usage (dev):
    python backend/run.py [--port 8000]

Usage (PyInstaller):
    backend.exe [--port 18432]
"""
import argparse
import os
import sys

# Import app directly so PyInstaller can detect the dependency via static analysis.
# (Passing "app.main:app" as a string to uvicorn.run() hides the import from PyInstaller.)
from app.main import app as fastapi_app  # noqa: E402

import uvicorn


def main() -> None:
    parser = argparse.ArgumentParser(description="Tank Flow Estimator backend")
    parser.add_argument("--port", type=int, default=int(os.environ.get("BACKEND_PORT", 8000)))
    parser.add_argument("--host", default="127.0.0.1")
    args = parser.parse_args()

    uvicorn.run(
        fastapi_app,
        host=args.host,
        port=args.port,
        log_level="warning",
    )


if __name__ == "__main__":
    main()
