@echo off
REM MCP Platform - 停止脚本 (Windows)

echo ==========================================
echo   停止 MCP Platform 服务
echo ==========================================
echo.

echo 查找并停止服务进程...

REM 停止后端
taskkill /FI "WINDOWTITLE eq MCP Backend*" /T /F >nul 2>&1
if errorlevel 1 (
    echo ⚠ 后端服务未运行
) else (
    echo ✓ 后端服务已停止
)

REM 停止前端
taskkill /FI "WINDOWTITLE eq MCP Frontend*" /T /F >nul 2>&1
if errorlevel 1 (
    echo ⚠ 前端服务未运行
) else (
    echo ✓ 前端服务已停止
)

echo.
echo ✅ 所有服务已停止
echo.
pause
