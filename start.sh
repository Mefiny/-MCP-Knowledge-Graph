#!/bin/bash

# MCP Platform - 快速启动脚本 (Linux/Mac)

echo "=========================================="
echo "  MCP Platform - 快速启动"
echo "=========================================="
echo ""

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装 Python 3.9+"
    exit 1
fi

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 16+"
    exit 1
fi

echo "✓ Python 版本: $(python3 --version)"
echo "✓ Node.js 版本: $(node --version)"
echo ""

# 检查后端依赖
echo "📦 检查后端依赖..."
cd backend
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt
echo "✓ 后端依赖安装完成"
echo ""

# 检查前端依赖
echo "📦 检查前端依赖..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖（这可能需要几分钟）..."
    npm install
fi
echo "✓ 前端依赖安装完成"
echo ""

# 启动服务
echo "🚀 启动服务..."
echo ""

# 在后台启动后端
cd ../backend
echo "启动后端服务 (http://localhost:8000)..."
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "✓ 后端服务已启动 (PID: $BACKEND_PID)"

# 等待后端启动
sleep 3

# 启动前端
cd ../frontend
echo "启动前端服务 (http://localhost:3000)..."
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✓ 前端服务已启动 (PID: $FRONTEND_PID)"

echo ""
echo "=========================================="
echo "  ✅ 所有服务已启动！"
echo "=========================================="
echo ""
echo "访问地址:"
echo "  - 前端界面: http://localhost:3000"
echo "  - 后端API:  http://localhost:8000"
echo "  - API文档:  http://localhost:8000/docs"
echo ""
echo "进程ID:"
echo "  - 后端 PID: $BACKEND_PID"
echo "  - 前端 PID: $FRONTEND_PID"
echo ""
echo "查看日志:"
echo "  - 后端: tail -f logs/backend.log"
echo "  - 前端: tail -f logs/frontend.log"
echo ""
echo "停止服务:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "或者运行: ./stop.sh"
echo "=========================================="

# 保存PID到文件
mkdir -p ../logs
echo $BACKEND_PID > ../logs/backend.pid
echo $FRONTEND_PID > ../logs/frontend.pid
