#!/usr/bin/env bash
# Build the Windows desktop application.
#
# Prerequisites (run once):
#   pip install pyinstaller
#   cd electron && npm install
#
# Run from the project root:
#   bash scripts/build-windows.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> [1/4] Building frontend..."
cd frontend
npm ci
npm run build
cd "$ROOT"

echo "==> [2/4] Packaging Python backend with PyInstaller..."
# Install backend deps if needed
pip install -e ./backend --quiet
pyinstaller backend.spec --noconfirm

echo "==> [3/4] Copying frontend dist into backend bundle resource path..."
# electron-builder will pick this up via extraResources in electron/package.json
# (nothing to do here; the builder reads frontend/dist directly)

echo "==> [4/4] Building Electron installer..."
cd electron
# ELECTRON_SKIP_BINARY_DOWNLOAD=1 skips the standalone binary download during
# npm ci — electron-builder fetches the correct platform binary itself later.
ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci
npm run dist
cd "$ROOT"

echo ""
echo "Done! Installer is in dist-electron/"
