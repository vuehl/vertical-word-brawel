@echo off
setlocal EnableExtensions
pushd "%~dp0" || exit /b 1

set "BUILD_NODE="
for %%N in (node.exe) do if not "%%~$PATH:N"=="" set "BUILD_NODE=%%~$PATH:N"
if defined BUILD_NODE call :checkNode
if not defined BUILD_NODE (
  set "BUILD_NODE=%ProgramFiles%\nodejs\node.exe"
  call :checkNode
)
if not defined BUILD_NODE (
  set "BUILD_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  call :checkNode
)
if not defined BUILD_NODE (
  echo Node.js 22 or newer could not be found. 1>&2
  popd
  exit /b 1
)
if not defined POKEBONK_PYTHON if exist "%ProgramData%\anaconda3\python.exe" set "POKEBONK_PYTHON=%ProgramData%\anaconda3\python.exe"
echo Building with "%BUILD_NODE%"
"%BUILD_NODE%" tools\build.mjs %*
set "BUILD_RESULT=%ERRORLEVEL%"
popd
exit /b %BUILD_RESULT%

:checkNode
if not exist "%BUILD_NODE%" (
  set "BUILD_NODE="
  exit /b 0
)
"%BUILD_NODE%" -e "process.exit(Number(process.versions.node.split('.')[0]) >= 22 ? 0 : 1)" >nul 2>&1
if errorlevel 1 set "BUILD_NODE="
exit /b 0
