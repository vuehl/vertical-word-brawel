@echo off
setlocal
pushd "%~dp0"
call npm run preview:dev
if errorlevel 1 (
  echo Preview failed. Check the message above and WeChat DevTools login.
) else (
  echo Developer QR code is ready. See the output path above.
)
popd
pause
