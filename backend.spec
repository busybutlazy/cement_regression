# PyInstaller spec for the FastAPI backend
# Build with:  pyinstaller backend.spec
# Output:      backend_dist/backend.exe  (Windows)

import sys
from pathlib import Path

block_cipher = None
root = Path(SPECPATH)  # noqa: F821 — injected by PyInstaller

a = Analysis(
    [str(root / 'backend' / 'run.py')],
    pathex=[str(root / 'backend')],
    binaries=[],
    datas=[],
    hiddenimports=[
        # app package (uvicorn string-import is invisible to static analysis)
        'app',
        'app.main',
        'app.api',
        'app.api.analyze',
        'app.schemas',
        'app.services',
        'app.services.solvers',
        'app.utils',
        # uvicorn internals not always auto-detected
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.loops.asyncio',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.http.h11_impl',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        # scipy / numpy compiled extensions
        'scipy.special._cdflib',
        'scipy.sparse.csgraph._flow',
        'scipy._lib.messagestream',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)  # noqa: F821

exe = EXE(  # noqa: F821
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,       # no console window on Windows
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
