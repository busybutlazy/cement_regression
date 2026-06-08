"""Entry point for PyInstaller bundle and direct execution.

Usage (dev):
    python backend/run.py [--port 8000]

Usage (PyInstaller):
    backend.exe [--port 18432]
"""
import argparse
import os
import sys

import uvicorn


def main() -> None:
    parser = argparse.ArgumentParser(description="Tank Flow Estimator backend")
    parser.add_argument("--port", type=int, default=int(os.environ.get("BACKEND_PORT", 8000)))
    parser.add_argument("--host", default="127.0.0.1")
    args = parser.parse_args()

    # When running as a PyInstaller bundle, sys.path needs the extracted dir
    if getattr(sys, "frozen", False):
        sys.path.insert(0, sys._MEIPASS)  # type: ignore[attr-defined]

    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        log_level="warning",
    )


if __name__ == "__main__":
    main()
