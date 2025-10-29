# 知识图谱显示问题的修复方案

## 问题诊断

**问题**：知识图谱可视化页面会固定显示"铠途电子商务有限公司"，即使当前文档没有提到它。

**根本原因**：
在 `backend/app/kg/neo4j_manager.py` 的 `get_document_graph` 函数（第474-497行）中，Cypher查询逻辑有误：

```cypher
MATCH (d:Document {id: $document_id})-[:MENTIONS]->(e:Entity)
OPTIONAL MATCH (e)-[r]-(other:Entity)  # ← 问题在这里！
```

这个查询会返回：
1. ✅ 当前文档提到的实体 (e)
2. ❌ 这些实体的所有相关实体 (other)，**包括其他文档的实体**

**举例**：
- 文档A提到："前端"、"算法"
- 文档B提到："铠途电子商务"、"前端"
- 系统发现"前端"在两个文档都出现，创建了关系
- 查询文档A时，会找到"前端"，然后找到所有与"前端"相关的实体
- **结果："铠途电子商务"也被包含了，即使文档A从未提到它**

---

## 修复步骤

### 1. 停止后端服务
在运行后端的终端按 `Ctrl + C` 停止服务

### 2. 修改代码

打开文件：`backend/app/kg/neo4j_manager.py`

找到第474-497行的 `query` 变量，将其替换为：

```python
        query = """
        // 1. 找到文档提到的所有实体
        MATCH (d:Document {id: $document_id})-[:MENTIONS]->(e:Entity)
        WITH d, collect(e) as doc_entities

        // 2. 只找这些实体之间的关系（不包括其他文档的实体）
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

同时修改返回值部分（第504-506行）：

```python
            return {
                "nodes": data.get("nodes", []),
                "edges": data.get("edges", [])
            }
```

### 3. 重启后端服务

```bash
cd backend
uvicorn app.main:app --reload
```

### 4. 刷新前端页面

重新选择不同的文档，现在每个文档应该只显示它自己提到的实体了。

---

## 新查询的工作原理

1. **第一步**：获取文档直接提到的所有实体
   ```cypher
   MATCH (d:Document {id: $document_id})-[:MENTIONS]->(e:Entity)
   WITH d, collect(e) as doc_entities
   ```

2. **第二步**：只查找这些实体之间的关系
   ```cypher
   UNWIND doc_entities as e1
   OPTIONAL MATCH (e1)-[r]-(e2:Entity)
   WHERE e2 IN doc_entities  # ← 关键：只匹配文档内的实体
   ```

3. **第三步**：返回节点和边
   - 节点：只包含文档提到的实体
   - 边：只包含这些实体之间的关系

这样就确保了每个文档的知识图谱只显示该文档相关的内容。

---

## 验证修复

修复后，测试以下情况：
- 文档A应该只显示文档A提到的实体
- 切换到文档B时，应该显示完全不同的实体集合
- "铠途电子商务"只应该出现在包含它的文档中
