#!/bin/bash

# MCP Platform - 停止脚本

echo "=========================================="
echo "  停止 MCP Platform 服务"
echo "=========================================="
echo ""

# 读取PID
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    echo "停止后端服务 (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
    rm logs/backend.pid
    echo "✓ 后端服务已停止"
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    echo "停止前端服务 (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null
    rm logs/frontend.pid
    echo "✓ 前端服务已停止"
fi

echo ""
echo "✅ 所有服务已停止"
