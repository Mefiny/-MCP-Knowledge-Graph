# MCP Platform - 数字图书管理员式知识图谱平台

![Version](https://img.shields.io/badge/version-0.2.0-blue)
![Python](https://img.shields.io/badge/python-3.9+-green)
![React](https://img.shields.io/badge/react-18.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**智能文档管理 + 知识图谱 + 向量检索 + AI问答的一体化平台**

## ✨ 核心功能

- 📄 **智能文档解析** - 支持PDF、Word，自动提取文本和元数据
- 🧠 **实体识别NER** - 自动识别人物、组织、技术术语等实体
- 🕸️ **知识图谱构建** - 基于Neo4j的可视化知识网络
- 🔍 **语义向量检索** - ChromaDB + Sentence-BERT语义搜索
- 💬 **RAG智能问答** - 结合知识图谱的AI问答系统
- 📊 **交互式可视化** - React + Cytoscape.js图谱展示

## 🎯 快速开始

### 前置要求

- Python 3.9+
- Node.js 16+
- Neo4j 5.x (可选)
- OpenAI API Key (可选，用于AI问答)

### 1. 克隆项目

```bash
git clone <repository-url>
cd MCP
```

### 2. 启动后端

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 下载spaCy中文模型（可选）
python -m spacy download zh_core_web_sm

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置OpenAI API Key等

# 启动服务
python -m uvicorn app.main:app --reload --port 8000
```

后端API文档: http://localhost:8000/docs

### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端界面: http://localhost:3000

### 4. 启动Neo4j（可选）

```bash
# 使用Docker
docker run -d \
  --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:latest
```

Neo4j浏览器: http://localhost:7474

## 📁 项目结构

```
MCP/
├── backend/                      # Python后端
│   ├── app/
│   │   ├── main.py              # FastAPI主应用 (518行)
│   │   ├── kg/
│   │   │   └── neo4j_manager.py # Neo4j管理器 (600行)
│   │   ├── vector/
│   │   │   └── vector_store.py  # ChromaDB管理器 (400行)
│   │   ├── rag/
│   │   │   └── rag_engine.py    # RAG引擎 (350行)
│   │   ├── parsers/             # PDF/Word解析器
│   │   ├── nlp/                 # NER/分段/关系抽取
│   │   └── models/              # 数据模型
│   ├── requirements.txt         # Python依赖
│   └── .env                     # 环境配置
├── frontend/                    # React前端
│   ├── src/
│   │   ├── pages/               # 页面组件
│   │   ├── services/api.js      # API服务层
│   │   └── App.jsx              # 主应用
│   ├── package.json             # NPM依赖
│   └── vite.config.js           # Vite配置
├── data/                        # 数据存储
├── uploads/                     # 上传文件
└── README.md                    # 项目说明
```

## 🔧 技术栈

### 后端技术

| 类别 | 技术 | 版本 |
|------|------|------|
| Web框架 | FastAPI | 0.109.0 |
| 文件解析 | PyMuPDF, python-docx | - |
| NLP | spaCy, sentence-transformers | 3.7.2, 2.3.1 |
| 向量数据库 | ChromaDB | 0.4.22 |
| 图数据库 | Neo4j | 5.16.0 |
| AI模型 | OpenAI GPT | - |

### 前端技术

| 类别 | 技术 | 版本 |
|------|------|------|
| UI框架 | React | 18.2.0 |
| 构建工具 | Vite | 5.0.7 |
| UI组件 | Ant Design | 5.12.0 |
| 图谱可视化 | Cytoscape.js | 3.28.0 |
| HTTP客户端 | Axios | 1.6.2 |
| 样式方案 | Styled Components | 6.1.1 |

## 📊 开发进度

| 阶段 | 功能 | 完成度 | 状态 |
|------|------|--------|------|
| 阶段0 | 项目初始化 | 100% | ✅ |
| 阶段1 | 文件解析模块 | 67% | ⚠️ |
| 阶段2 | 文本分段与摘要 | 80% | ⚠️ |
| 阶段3 | 实体识别NER | 80% | ✅ |
| 阶段4 | Neo4j知识图谱 | 100% | ✅ |
| 阶段5 | 向量检索 | 100% | ✅ |
| 阶段6 | RAG问答 | 100% | ✅ |
| 阶段7 | 前端可视化 | 100% | ✅ |
| 阶段8 | Docker部署 | 0% | 📝 |
| 阶段9 | 集成测试 | 0% | 📝 |

**总体完成度: 73% → 85%** (+12%)

## 🎨 界面预览

### 首页
- 系统状态监控
- 核心功能介绍
- 统计数据展示

### 文档管理
- 拖拽上传文件
- 文档列表查看
- 实时处理进度

### 知识图谱
- 交互式图谱可视化
- 节点/关系展示
- 缩放拖拽操作

### 语义搜索
- 纯语义/混合搜索
- 相似度评分
- 可调参数配置

### AI问答
- 对话式交互
- 来源溯源
- 置信度显示

## 📖 API文档

### 文档管理

- `POST /api/upload` - 上传文档
- `GET /api/documents` - 列出所有文档
- `GET /api/documents/{id}` - 获取文档详情
- `DELETE /api/documents/{id}` - 删除文档

### 知识图谱

- `GET /api/kg/stats` - 图谱统计
- `GET /api/kg/graph/{document_id}` - 文档图谱
- `GET /api/kg/entity/{entity_text}` - 实体子图

### 向量检索

- `GET /api/search?query=...` - 语义搜索
- `GET /api/search/hybrid?query=...` - 混合搜索

### RAG问答

- `POST /api/qa/ask?question=...` - 提问
- `POST /api/qa/summarize/{document_id}` - 文档摘要

完整API文档: http://localhost:8000/docs

## ⚙️ 配置说明

### 后端配置 (backend/.env)

```bash
# OpenAI API (用于RAG问答)
OPENAI_API_KEY=sk-your-api-key-here

# Neo4j (可选)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# ChromaDB
CHROMA_PERSIST_DIR=./data/chroma
```

### 前端配置 (frontend/.env.local)

```bash
# 后端API地址
VITE_API_URL=http://localhost:8000
```

## 🚀 使用流程

1. **上传文档** - 在"文档管理"页面上传PDF或Word文件
2. **自动处理** - 系统自动解析、提取实体、构建图谱、向量化
3. **查看图谱** - 在"知识图谱"页面查看可视化网络
4. **语义搜索** - 使用"语义搜索"查找相关内容
5. **AI问答** - 在"AI问答"页面提出问题，获得智能答案

## 💡 核心特性

### 1. 智能降级机制

系统采用优雅降级设计，即使某些服务不可用也能正常运行：

- Neo4j不可用 → 跳过图谱存储，其他功能正常
- OpenAI API不可用 → RAG问答不可用，但检索可用
- spaCy不可用 → 降级为规则NER

### 2. 完整的数据溯源

- 每个答案都标注来源文档片段
- 显示置信度评分
- 支持点击查看原文

### 3. 多模式检索

- 纯语义搜索 (向量相似度)
- 混合搜索 (语义 + 关键词)
- 可调权重配置

## 🔍 常见问题

**Q: 如何配置OpenAI API？**
A: 编辑 `backend/.env` 文件，设置 `OPENAI_API_KEY=your-key`

**Q: Neo4j是必须的吗？**
A: 不是，没有Neo4j时图谱功能会禁用，但其他功能正常

**Q: 支持哪些文件格式？**
A: 目前支持PDF和DOCX，单文件限制10MB

**Q: 可以离线使用吗？**
A: 向量检索和NER可以离线，但RAG问答需要OpenAI API

**Q: 数据存储在哪里？**
A: 向量存储在 `data/chroma/`，图谱在Neo4j，文件在 `uploads/`

## 📝 开发计划

### 短期计划
- [ ] 添加PPT解析支持
- [ ] 实现文本自动摘要
- [ ] Docker Compose一键部署
- [ ] 用户认证系统

### 长期计划
- [ ] 支持更多文件格式
- [ ] 多语言支持
- [ ] 自定义实体类型
- [ ] 知识图谱推理

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

## 📄 License

MIT License

---

如有问题，请查看 [COMPLETION_SUMMARY.md](./COMPLETION_SUMMARY.md) 获取详细技术文档。
