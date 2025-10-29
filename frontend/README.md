# MCP Platform Frontend

React前端应用 - 数字图书管理员式知识图谱平台

## 🚀 快速启动

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问: http://localhost:3000

### 3. 构建生产版本

```bash
npm run build
```

## 📦 技术栈

- **React 18** - UI框架
- **Vite** - 构建工具
- **Ant Design 5** - UI组件库
- **React Router 6** - 路由管理
- **Cytoscape.js** - 知识图谱可视化
- **Axios** - HTTP客户端
- **Styled Components** - CSS-in-JS
- **React Markdown** - Markdown渲染

## 📁 项目结构

```
frontend/
├── src/
│   ├── pages/              # 页面组件
│   │   ├── HomePage.jsx           # 首页
│   │   ├── DocumentsPage.jsx      # 文档管理
│   │   ├── KnowledgeGraphPage.jsx # 知识图谱
│   │   ├── SearchPage.jsx         # 语义搜索
│   │   └── QAPage.jsx             # AI问答
│   ├── services/           # API服务
│   │   └── api.js                 # 后端API封装
│   ├── App.jsx             # 主应用组件
│   ├── main.jsx            # 应用入口
│   └── index.css           # 全局样式
├── index.html              # HTML模板
├── vite.config.js          # Vite配置
└── package.json            # 项目配置
```

## 🎨 功能模块

### 1. 首页 (HomePage)
- 系统状态概览
- 核心功能介绍
- 统计数据展示

### 2. 文档管理 (DocumentsPage)
- 文件上传（PDF/DOCX）
- 文档列表查看
- 文档详情展示
- 文档删除

### 3. 知识图谱 (KnowledgeGraphPage)
- 交互式图谱可视化
- 节点点击查看详情
- 图谱缩放拖拽
- 多种布局算法

### 4. 语义搜索 (SearchPage)
- 纯语义搜索
- 混合搜索（语义+关键词）
- 相似度评分
- 可调参数

### 5. AI问答 (QAPage)
- 对话式问答
- 来源溯源
- 置信度显示
- Markdown渲染

## ⚙️ 配置说明

### 环境变量

创建 `.env.local` 文件：

```bash
# 后端API地址
VITE_API_URL=http://localhost:8000
```

### 代理配置

`vite.config.js` 中已配置API代理：

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  }
}
```

## 📱 响应式设计

- 使用Ant Design的Grid系统
- 支持移动端、平板、桌面端
- 自适应布局

## 🎯 开发建议

### 代码规范

- 使用函数组件和Hooks
- 使用styled-components处理样式
- API调用统一在services层
- 保持组件单一职责

### 调试

```bash
# 开启ESLint检查
npm run lint
```

## 🔗 API对接

所有API请求通过 `src/services/api.js` 处理：

```javascript
import { documentAPI, searchAPI, qaAPI } from './services/api';

// 上传文档
await documentAPI.upload(file, (progress) => {
  console.log(progress);
});

// 语义搜索
const results = await searchAPI.semantic('query', 5);

// AI问答
const answer = await qaAPI.ask('question');
```

## 🚨 常见问题

### Q: 启动失败？
A: 确保Node.js版本 >= 16，运行 `npm install` 重新安装依赖

### Q: API请求失败？
A: 检查后端服务是否启动在 http://localhost:8000

### Q: 图谱不显示？
A: 确保Neo4j服务已启动，且文档已上传处理

## 📄 License

MIT
