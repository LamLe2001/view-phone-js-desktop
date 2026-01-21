@echo off
echo ===================================================
echo   BUILDING INSTALLER (REQUIRES ADMIN PRIVILEGES)
echo ===================================================
echo.
echo NOTE: If this fails with "Cannot create symbolic link", 
echo please run this file as Administrator.
echo.
pause
cd electron
set ELECTRON_RUN_AS_NODE=
call npm run build
pause
