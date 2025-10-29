@echo off
REM MCP Platform - 快速启动脚本 (Windows)

echo ==========================================
echo   MCP Platform - 快速启动
echo ==========================================
echo.

REM 检查Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 未安装，请先安装 Python 3.9+
    pause
    exit /b 1
)

REM 检查Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装，请先安装 Node.js 16+
    pause
    exit /b 1
)

echo ✓ 环境检查通过
echo.

REM 创建日志目录
if not exist "logs" mkdir logs

echo 📦 检查依赖...
echo.

REM 后端依赖
cd backend
if not exist "venv" (
    echo 创建Python虚拟环境...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -q -r requirements.txt
echo ✓ 后端依赖安装完成

REM 前端依赖
cd ..\frontend
if not exist "node_modules" (
    echo 安装前端依赖（这可能需要几分钟）...
    call npm install
)
echo ✓ 前端依赖安装完成
echo.

echo 🚀 启动服务...
echo.

REM 启动后端
cd ..\backend
echo 启动后端服务 (http://localhost:8000)...
start "MCP Backend" /MIN cmd /c "venv\Scripts\activate.bat && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ..\logs\backend.log 2>&1"

REM 等待后端启动
timeout /t 3 /nobreak >nul

REM 启动前端
cd ..\frontend
echo 启动前端服务 (http://localhost:3000)...
start "MCP Frontend" /MIN cmd /c "npm run dev > ..\logs\frontend.log 2>&1"

echo.
echo ==========================================
echo    所有服务已启动！
echo ==========================================
echo.
echo 访问地址:
echo   - 前端界面: http://localhost:3000
echo   - 后端API:  http://localhost:8000
echo   - API文档:  http://localhost:8000/docs
echo.
echo 查看日志:
echo   - 后端: type logs\backend.log
echo   - 前端: type logs\frontend.log
echo.
echo 停止服务: 运行 stop.bat
echo ==========================================
echo.
echo 按任意键打开浏览器...
pause >nul

start http://localhost:3000

cd ..
