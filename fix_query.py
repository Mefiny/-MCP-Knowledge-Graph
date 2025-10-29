#!/usr/bin/env python3
"""
修复知识图谱查询的脚本
自动替换 neo4j_manager.py 中的 get_document_graph 方法
"""
import re

file_path = 'backend/app/kg/neo4j_manager.py'

# 读取文件
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 旧的查询（需要被替换的部分）
old_query = r'''        query = """
        MATCH \(d:Document \{id: \$document_id\}\)-\[:MENTIONS\]->\(e:Entity\)
        OPTIONAL MATCH \(e\)-\[r\]-\(other:Entity\)
        WITH e, other, r
        WITH
            collect\(DISTINCT \{
                id: e\.id,
                text: e\.text,
                label: e\.label,
                confidence: e\.confidence
            \}\) \+ collect\(DISTINCT CASE WHEN other IS NOT NULL THEN \{
                id: other\.id,
                text: other\.text,
                label: other\.label,
                confidence: other\.confidence
            \} ELSE null END\) as nodes,
            collect\(DISTINCT CASE WHEN r IS NOT NULL THEN \{
                source: startNode\(r\)\.text,
                target: endNode\(r\)\.text,
                type: type\(r\),
                confidence: r\.confidence
            \} ELSE null END\) as edges
        RETURN nodes, edges
        """'''

# 新的查询（修复后的版本）
new_query = '''        query = """
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
        """'''

# 执行替换
new_content = re.sub(old_query, new_query, content, flags=re.DOTALL)

if new_content == content:
    print("❌ 未找到匹配的代码，尝试手动查找...")

    # 显示当前的query部分
    match = re.search(r'def get_document_graph.*?query = """.*?"""', content, re.DOTALL)
    if match:
        print("\n当前的查询代码:")
        print("=" * 60)
        print(match.group(0)[:500])
        print("=" * 60)
else:
    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print("✅ 修复成功！")
    print(f"已更新文件: {file_path}")
    print("\n请重启后端服务:")
    print("  1. 停止当前服务 (Ctrl+C)")
    print("  2. 重新运行: cd backend && uvicorn app.main:app --reload")
