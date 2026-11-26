@echo off
setlocal
pushd "%~dp0" || exit /b 1
rem Prefer the bundled runtime when available; otherwise use installed Node.js.
set "PREVIEW_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%PREVIEW_NODE%" set "PREVIEW_NODE=node.exe"
"%PREVIEW_NODE%" tools\preview.mjs
set "PREVIEW_RESULT=%ERRORLEVEL%"
if not "%PREVIEW_RESULT%"=="0" (
  echo Preview failed. See the error above.
) else (
  echo Preview is ready. See the QR code path above.
)
popd
pause
exit /b %PREVIEW_RESULT%
