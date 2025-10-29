#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""自动修复 neo4j_manager.py 中的 get_document_graph 查询"""

import os
import shutil
from datetime import datetime

file_path = 'backend/app/kg/neo4j_manager.py'

# 1. 创建备份
backup_path = f'{file_path}.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
shutil.copy2(file_path, backup_path)
print(f"[OK] Created backup: {backup_path}")

# 2. 读取文件
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 3. 找到需要替换的行
start_line = None
end_line = None

for i, line in enumerate(lines):
    if 'query = """' in line and i > 460 and i < 480:
        start_line = i
    if start_line is not None and '"""' in line and i > start_line:
        end_line = i
        break

if start_line is None or end_line is None:
    print(f"[ERROR] Not found query definition (start: {start_line}, end: {end_line})")
    exit(1)

print(f"[OK] Found query at line {start_line + 1} to {end_line + 1}")

# 4. 新的query代码
new_query = '''        query = """
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
'''

# 5. 替换query部分
new_lines = lines[:start_line] + [new_query + '\n'] + lines[end_line + 1:]

# 6. 同时修改返回值部分（去掉null值过滤，因为新查询不会产生null）
for i, line in enumerate(new_lines):
    if i > start_line and '"nodes": [n for n in data.get("nodes", []) if n is not None]' in line:
        # 找到return语句的开始
        indent = len(line) - len(line.lstrip())
        new_lines[i] = ' ' * indent + '"nodes": data.get("nodes", []),\n'
        print(f"[OK] Modified line {i + 1} (nodes return value)")
    elif i > start_line and '"edges": [e for e in data.get("edges", []) if e is not None]' in line:
        indent = len(line) - len(line.lstrip())
        new_lines[i] = ' ' * indent + '"edges": data.get("edges", [])\n'
        print(f"[OK] Modified line {i + 1} (edges return value)")

# 7. 写回文件
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"\n========================================")
print(f"[SUCCESS] Fix applied!")
print(f"File updated: {file_path}")
print(f"Backup file: {backup_path}")
print(f"\nNext steps:")
print(f"  1. Backend service will auto-reload (if running)")
print(f"  2. Refresh frontend page")
print(f"  3. Select document and check if 'Kaitu E-commerce' still appears")
print(f"========================================")
