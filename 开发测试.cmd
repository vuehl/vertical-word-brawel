@echo off
setlocal
pushd "%~dp0"
powershell.exe -NoLogo -NoProfile -Command "$env:Path=[Environment]::GetEnvironmentVariable('Path','Machine')+';'+[Environment]::GetEnvironmentVariable('Path','User'); foreach($name in @('WECHAT_DEVTOOLS_CLI','POKEBONK_PYTHON')) { $value=[Environment]::GetEnvironmentVariable($name,'User'); if($value) { [Environment]::SetEnvironmentVariable($name,$value,'Process') } }; & npm.cmd run preview:dev; exit $LASTEXITCODE"
if errorlevel 1 (
  echo Preview failed. Check the message above and WeChat DevTools login.
) else (
  echo Developer QR code is ready. See the output path above.
)
popd
pause
