@echo off
REM ===========================================================================
REM  JobNest - MERN Job Portal
REM
REM  Double-click this file to run the whole project:
REM    - verifies Node/npm are installed
REM    - creates .env from .env.example on first run
REM    - installs missing dependencies (root, backend, frontend)
REM    - starts the API and the web app together
REM    - opens the app in your browser
REM
REM  Optional arguments:
REM    start.bat --check   validate the setup and exit (changes nothing)
REM    start.bat --seed    load the demo data into the database, then exit
REM    start.bat --build   make a production frontend build, then exit
REM
REM  Stop the project with Ctrl+C in this window.
REM ===========================================================================

setlocal EnableExtensions EnableDelayedExpansion
title JobNest - MERN Job Portal

REM Always work from the folder this script lives in, so double-clicking works
REM from anywhere.
cd /d "%~dp0"

set "MODE=%~1"

echo ============================================================
echo   JobNest - MERN Job Portal
echo ============================================================
echo.

REM --------------------------------------------------------------- Node / npm
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js was not found on your PATH.
  echo         Install Node 20 or newer from https://nodejs.org and try again.
  goto :fail
)
for /f "delims=" %%v in ('node -v') do set "NODE_VERSION=%%v"
echo [ok] Node !NODE_VERSION! detected

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm was not found on your PATH.
  goto :fail
)

REM ------------------------------------------------------------------ .env file
REM NOTE: delayed expansion is enabled, so a bare "!" inside echo is consumed.
REM       Status markers are therefore written as [ok] / [info] / [WARN] / [ERROR].
set "WARNED=0"
if not exist ".env" (
  if not exist ".env.example" (
    echo [ERROR] Neither .env nor .env.example was found.
    goto :fail
  )
  set "WARNED=1"
  if /i "%MODE%"=="--check" (
    echo [WARN] .env is missing. A normal run will create it from .env.example.
  ) else (
    echo [..] No .env found - creating one from .env.example
    copy /y ".env.example" ".env" >nul
    echo.
    echo [WARN] Edit .env and set MONGODB_URI and JWT_SECRET, then re-run start.bat.
    echo      MONGODB_URI: create a free cluster at https://cloud.mongodb.com
    echo.
    start "" notepad ".env"
    goto :fail
  )
)

REM A copied .env still contains the placeholder connection string. Catch it now
REM rather than letting the API fail with a cryptic 503 later.
if exist ".env" (
  findstr /l /c:"mongodb+srv://<user>" ".env" >nul 2>&1
  if not errorlevel 1 (
    set "WARNED=1"
    echo [WARN] MONGODB_URI in .env is still the placeholder value.
    if /i "%MODE%"=="--check" (
      echo        Set it to your real MongoDB connection string before running.
    ) else (
      echo        Set it to your real MongoDB connection string, then re-run start.bat.
      start "" notepad ".env"
      goto :fail
    )
  ) else (
    echo [ok] .env found and MONGODB_URI looks configured
  )
)

REM ---------------------------------------------------------------- Dependencies
if not exist "node_modules\" (
  echo [..] Installing root dependencies...
  call npm install --no-audit --no-fund
  if errorlevel 1 goto :fail
)
if not exist "backend\node_modules\" (
  echo [..] Installing backend dependencies...
  call npm --prefix backend install --no-audit --no-fund
  if errorlevel 1 goto :fail
)
if not exist "frontend\node_modules\" (
  echo [..] Installing frontend dependencies...
  call npm --prefix frontend install --no-audit --no-fund
  if errorlevel 1 goto :fail
)
echo [ok] Dependencies installed

REM ------------------------------------------------------------------- Modes
if /i "%MODE%"=="--check" (
  echo.
  if "!WARNED!"=="1" (
    echo [WARN] Setup check finished with warnings - see the [WARN] lines above.
  ) else (
    echo [ok] All checks passed. Run start.bat to launch the project.
  )
  goto :done
)

if /i "%MODE%"=="--seed" (
  echo.
  echo [..] Seeding the database with demo data...
  call npm run seed
  if errorlevel 1 goto :fail
  echo [ok] Seed complete. Run start.bat to launch the project.
  goto :done
)

if /i "%MODE%"=="--build" (
  echo.
  echo [..] Building the frontend for production...
  call npm run build
  if errorlevel 1 goto :fail
  echo [ok] Build written to frontend\dist
  goto :done
)

REM -------------------------------------------------------------------- Launch
echo.
echo ============================================================
echo   API   http://localhost:5000/api
echo   Web   http://localhost:5173
echo.
echo   Press Ctrl+C in this window to stop everything.
echo ============================================================
echo.

REM Open the browser in a separate window once Vite has had time to boot.
start "" /min cmd /c "timeout /t 12 /nobreak >nul && start http://localhost:5173"

REM Start the API and the web app together. This is the same command you would
REM type by hand - it uses concurrently to run both npm scripts at once, so this
REM window shows the interleaved [api] and [web] logs.
echo [run] npm run dev
call npm run dev

echo.
echo Stopped.
goto :done

:done
echo.
pause
exit /b 0

:fail
echo.
echo Startup aborted - fix the issue above and re-run start.bat.
echo.
pause
exit /b 1
