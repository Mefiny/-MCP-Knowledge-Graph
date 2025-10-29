#!/bin/bash

# MCP Platform - 项目完整性检查脚本

echo "=========================================="
echo "  MCP Platform - 项目检查"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# 检查函数
check_file() {
    if [ -f "$1" ]; then
        echo "✓ $1"
        return 0
    else
        echo "✗ $1 (缺失)"
        ((ERRORS++))
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo "✓ $1/"
        return 0
    else
        echo "✗ $1/ (缺失)"
        ((ERRORS++))
        return 1
    fi
}

# 1. 检查根目录文件
echo "1️⃣  检查根目录文件..."
check_file "README.md"
check_file "COMPLETION_SUMMARY.md"
check_file "TESTING_GUIDE.md"
check_file "start.sh"
check_file "start.bat"
check_file "stop.sh"
check_file "stop.bat"
echo ""

# 2. 检查后端文件
echo "2️⃣  检查后端文件..."
check_dir "backend"
check_dir "backend/app"
check_file "backend/requirements.txt"
check_file "backend/.env"
check_file "backend/app/main.py"
check_file "backend/app/__init__.py"
echo ""

# 3. 检查后端模块
echo "3️⃣  检查后端模块..."
check_dir "backend/app/kg"
check_file "backend/app/kg/neo4j_manager.py"
check_file "backend/app/kg/__init__.py"

check_dir "backend/app/vector"
check_file "backend/app/vector/vector_store.py"
check_file "backend/app/vector/__init__.py"

check_dir "backend/app/rag"
check_file "backend/app/rag/rag_engine.py"
check_file "backend/app/rag/__init__.py"

check_dir "backend/app/parsers"
check_file "backend/app/parsers/pdf_parser.py"
check_file "backend/app/parsers/word_parser.py"

check_dir "backend/app/nlp"
check_file "backend/app/nlp/ner.py"
check_file "backend/app/nlp/segmenter.py"

check_dir "backend/app/models"
check_file "backend/app/models/schemas.py"
echo ""

# 4. 检查前端文件
echo "4️⃣  检查前端文件..."
check_dir "frontend"
check_dir "frontend/src"
check_file "frontend/package.json"
check_file "frontend/vite.config.js"
check_file "frontend/index.html"
check_file "frontend/.env.local"
check_file "frontend/README.md"
check_file "frontend/src/main.jsx"
check_file "frontend/src/App.jsx"
check_file "frontend/src/index.css"
echo ""

# 5. 检查前端页面
echo "5️⃣  检查前端页面..."
check_dir "frontend/src/pages"
check_file "frontend/src/pages/HomePage.jsx"
check_file "frontend/src/pages/DocumentsPage.jsx"
check_file "frontend/src/pages/KnowledgeGraphPage.jsx"
check_file "frontend/src/pages/SearchPage.jsx"
check_file "frontend/src/pages/QAPage.jsx"
echo ""

# 6. 检查前端服务
echo "6️⃣  检查前端服务..."
check_dir "frontend/src/services"
check_file "frontend/src/services/api.js"
echo ""

# 7. 检查数据目录
echo "7️⃣  检查数据目录..."
check_dir "data"
check_dir "uploads"
echo ""

# 8. 检查Python环境
echo "8️⃣  检查Python环境..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
    echo "✓ Python $PYTHON_VERSION"
else
    echo "✗ Python3 未安装"
    ((ERRORS++))
fi
echo ""

# 9. 检查Node.js环境
echo "9️⃣  检查Node.js环境..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js $NODE_VERSION"
else
    echo "✗ Node.js 未安装"
    ((ERRORS++))
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✓ npm $NPM_VERSION"
else
    echo "✗ npm 未安装"
    ((ERRORS++))
fi
echo ""

# 10. 检查Python依赖
echo "🔟 检查Python依赖..."
if [ -f "backend/requirements.txt" ]; then
    TOTAL_DEPS=$(wc -l < backend/requirements.txt | tr -d ' ')
    echo "📦 requirements.txt: $TOTAL_DEPS 个依赖"

    # 关键依赖检查
    CRITICAL_DEPS=("fastapi" "uvicorn" "neo4j" "chromadb" "sentence-transformers" "openai")
    for dep in "${CRITICAL_DEPS[@]}"; do
        if grep -q "^$dep" backend/requirements.txt; then
            echo "  ✓ $dep"
        else
            echo "  ✗ $dep (缺失)"
            ((WARNINGS++))
        fi
    done
fi
echo ""

# 11. 检查前端依赖
echo "1️⃣1️⃣  检查前端依赖..."
if [ -f "frontend/package.json" ]; then
    if command -v jq &> /dev/null; then
        DEPS_COUNT=$(jq '.dependencies | length' frontend/package.json)
        echo "📦 package.json: $DEPS_COUNT 个依赖"
    else
        echo "📦 package.json 存在 (需要jq工具查看详情)"
    fi

    # 关键依赖检查
    CRITICAL_DEPS=("react" "antd" "cytoscape" "axios")
    for dep in "${CRITICAL_DEPS[@]}"; do
        if grep -q "\"$dep\"" frontend/package.json; then
            echo "  ✓ $dep"
        else
            echo "  ✗ $dep (缺失)"
            ((WARNINGS++))
        fi
    done
fi
echo ""

# 12. 检查环境配置
echo "1️⃣2️⃣  检查环境配置..."
if [ -f "backend/.env" ]; then
    if grep -q "OPENAI_API_KEY" backend/.env; then
        VALUE=$(grep "OPENAI_API_KEY" backend/.env | cut -d'=' -f2)
        if [ "$VALUE" == "your_openai_api_key_here" ]; then
            echo "⚠ OPENAI_API_KEY 未配置 (RAG问答将不可用)"
            ((WARNINGS++))
        else
            echo "✓ OPENAI_API_KEY 已配置"
        fi
    fi

    if grep -q "NEO4J_URI" backend/.env; then
        echo "✓ NEO4J_URI 已配置"
    fi
else
    echo "⚠ backend/.env 不存在 (请从 .env.example 复制)"
    ((WARNINGS++))
fi
echo ""

# 总结
echo "=========================================="
echo "  检查完成"
echo "=========================================="
echo ""
echo "错误: $ERRORS"
echo "警告: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ 项目结构完整！"
    echo ""
    echo "下一步:"
    echo "1. 配置环境变量 (backend/.env)"
    echo "2. 安装依赖:"
    echo "   cd backend && pip install -r requirements.txt"
    echo "   cd frontend && npm install"
    echo "3. 启动服务:"
    echo "   ./start.sh (Linux/Mac)"
    echo "   start.bat (Windows)"
    exit 0
else
    echo "❌ 发现 $ERRORS 个错误，请修复后再继续"
    exit 1
fi
