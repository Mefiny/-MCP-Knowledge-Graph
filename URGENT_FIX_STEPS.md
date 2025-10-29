# 🔧 修复"铠途电子商务"一直显示的问题

## 问题确认

测试结果显示：
- ❌ 选择文档"数字人项目书.docx"（ID: 8b865530-8d4c-451f-bc6b-d7c0278be924）
- ❌ 文档有69个节点，包含："前端"、"算法"、"开发团队"等
- ❌ **同时还包含"铠途电子商务有限公司"** - 这是错误的！

**原因**：后端Cypher查询有bug，会把其他文档的实体也包含进来。

---

## 📋 修复步骤（必须按顺序执行）

### 第1步：停止后端服务

在运行后端服务的终端窗口中按 **`Ctrl + C`** 停止服务。

看到类似这样的提示说明已停止：
```
^C
INFO:     Shutting down
```

---

### 第2步：修改代码

打开文件：`C:\Users\32847\Desktop\MCP\backend\app\kg\neo4j_manager.py`

找到第474-497行，将这段代码：

```python
        query = """
        MATCH (d:Document {id: $document_id})-[:MENTIONS]->(e:Entity)
        OPTIONAL MATCH (e)-[r]-(other:Entity)
        WITH e, other, r
        WITH
            collect(DISTINCT {
                id: e.id,
                text: e.text,
                label: e.label,
                confidence: e.confidence
            }) + collect(DISTINCT CASE WHEN other IS NOT NULL THEN {
                id: other.id,
                text: other.text,
                label: other.label,
                confidence: other.confidence
            } ELSE null END) as nodes,
            collect(DISTINCT CASE WHEN r IS NOT NULL THEN {
                source: startNode(r).text,
                target: endNode(r).text,
                type: type(r),
                confidence: r.confidence
            } ELSE null END) as edges
        RETURN nodes, edges
        """
```

**完整替换为**：

```python
        query = """
        // 1. 找到文档提到的所有实体
        MATCH (d:Document {id: $document_id})-[:MENTIONS]->(e:Entity)
        WITH d, collect(e) as doc_entities

        // 2. 只找这些实体之间的关系（限定在当前文档的实体内）
        UNWIND doc_entities as e1
        OPTIONAL MATCH (e1)-[r]-(e2:Entity)
        WHERE e2 IN doc_entities

        // 3. 收集节点和边
        WITH doc_entities, collect(DISTINCT r) as relationships

        RETURN
            [e IN doc_entities | {
                id: e.id,
                text: e.text,
                label: e.label,
                confidence: e.confidence
            }] as nodes,
            [r IN relationships WHERE r IS NOT NULL | {
                source: startNode(r).text,
                target: endNode(r).text,
                type: type(r),
                confidence: r.confidence
            }] as edges
        """
```

**同时修改返回值部分**（第504-506行），将：

```python
            return {
                "nodes": [n for n in data.get("nodes", []) if n is not None],
                "edges": [e for e in data.get("edges", []) if e is not None]
            }
```

替换为：

```python
            return {
                "nodes": data.get("nodes", []),
                "edges": data.get("edges", [])
            }
```

保存文件（Ctrl+S）。

---

### 第3步：重启后端服务

在后端目录打开终端，重新运行：

```bash
cd C:\Users\32847\Desktop\MCP\backend
uvicorn app.main:app --reload
```

看到类似这样的输出说明启动成功：
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

---

### 第4步：验证修复

1. **刷新浏览器**前端页面

2. **重新选择文档**"数字人项目书.docx"

3. **检查知识图谱**：
   - ✅ 应该只显示该文档的实体："前端"、"算法"、"开发团队"等
   - ✅ **不应该**显示"铠途电子商务有限公司"

4. **切换到其他文档**，每个文档应该显示不同的实体集合

---

## 🔍 修复原理

### 旧查询的问题：
```cypher
OPTIONAL MATCH (e)-[r]-(other:Entity)  # ❌ 会匹配所有相关实体
```
这会返回与文档实体有关系的**所有**实体，包括其他文档的！

### 新查询的正确做法：
```cypher
UNWIND doc_entities as e1
OPTIONAL MATCH (e1)-[r]-(e2:Entity)
WHERE e2 IN doc_entities  # ✅ 只匹配当前文档的实体
```
限定关系的两端都必须在当前文档的实体列表中。

---

## ❓ 需要帮助？

如果遇到任何问题，请告诉我：
- 修改代码时遇到困难
- 服务启动失败
- 修复后还是有问题

我会继续协助您！
