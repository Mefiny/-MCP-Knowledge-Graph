#!/usr/bin/env python3
"""检查Neo4j中铠图电子商务实体的来源"""
import sys
sys.path.insert(0, 'backend')

from app.kg.neo4j_manager import Neo4jManager

# 创建Neo4j连接
kg = Neo4jManager()

if not kg.connected:
    print("❌ Neo4j未连接")
    exit(1)

print("✓ Neo4j已连接\n")

# 1. 查询所有包含"铠图"或"电子商务"的实体
query1 = """
MATCH (e:Entity)
WHERE e.text CONTAINS '铠图' OR e.text CONTAINS '电子商务'
RETURN e.text as entity_text, e.label as entity_type, e.id as entity_id
LIMIT 20
"""

print("=" * 60)
print("包含'铠图'或'电子商务'的实体:")
print("=" * 60)
entities = kg.execute_query(query1)
for ent in entities:
    print(f"  - {ent['entity_text']} (类型: {ent['entity_type']}, ID: {ent['entity_id']})")

print(f"\n共找到 {len(entities)} 个相关实体\n")

# 2. 查询这些实体来自哪些文档
if entities:
    entity_text = entities[0]['entity_text']
    query2 = """
    MATCH (d:Document)-[:MENTIONS]->(e:Entity)
    WHERE e.text = $entity_text
    RETURN d.id as doc_id,
           d.file_name as file_name,
           d.title as title,
           d.created_at as created_at
    """

    print("=" * 60)
    print(f"'{entity_text}' 出现在以下文档中:")
    print("=" * 60)
    docs = kg.execute_query(query2, {"entity_text": entity_text})
    for doc in docs:
        print(f"  文档ID: {doc['doc_id']}")
        print(f"  文件名: {doc['file_name']}")
        print(f"  标题: {doc['title']}")
        print(f"  创建时间: {doc['created_at']}")
        print()

# 3. 查询所有文档
query3 = """
MATCH (d:Document)
RETURN d.id as doc_id,
       d.file_name as file_name,
       d.title as title,
       d.author as author,
       d.created_at as created_at
ORDER BY d.created_at DESC
"""

print("=" * 60)
print("Neo4j中的所有文档:")
print("=" * 60)
all_docs = kg.execute_query(query3)
for i, doc in enumerate(all_docs, 1):
    print(f"{i}. 文件名: {doc['file_name']}")
    print(f"   文档ID: {doc['doc_id']}")
    print(f"   标题: {doc['title']}")
    print(f"   作者: {doc['author']}")
    print(f"   创建时间: {doc['created_at']}")
    print()

print(f"总共 {len(all_docs)} 个文档")

# 4. 统计信息
stats = kg.get_stats()
print("\n" + "=" * 60)
print("知识图谱统计:")
print("=" * 60)
print(f"  节点总数: {stats['nodes']}")
print(f"  关系总数: {stats['relationships']}")

kg.close()
