@echo off
chcp 65001 >nul
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  where py >nul 2>nul
  if errorlevel 1 (
    echo 未找到 Python。请安装 Python 或改用其他静态服务器。
    pause
    exit /b 1
  )
  set "PYCMD=py"
) else (
  set "PYCMD=python"
)

start "" http://localhost:8000
%PYCMD% -m http.server 8000
