import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import requests
import json

# 获取文档列表
print("=" * 60)
print("1. 获取文档列表")
print("=" * 60)

response = requests.get('http://localhost:8000/api/documents')
docs = response.json()
print(f"文档总数: {docs['total']}")

if docs['documents']:
    doc = docs['documents'][0]
    doc_id = doc['document_id']
    print(f"\n选择第一个文档:")
    print(f"  ID: {doc_id}")
    print(f"  文件名: {doc['file_name']}")
    print(f"  实体数: {doc['entities_count']}")

    # 查询这个文档的知识图谱
    print("\n" + "=" * 60)
    print("2. 查询文档知识图谱")
    print("=" * 60)

    response = requests.get(f'http://localhost:8000/api/kg/graph/{doc_id}')
    graph_data = response.json()

    print(f"节点数: {len(graph_data.get('nodes', []))}")
    print(f"边数: {len(graph_data.get('edges', []))}")

    # 显示前10个节点的详细信息
    print("\n前10个节点:")
    for i, node in enumerate(graph_data.get('nodes', [])[:10], 1):
        print(f"\n  节点 {i}:")
        print(f"    id: {node.get('id')}")
        print(f"    text: {node.get('text')}")
        print(f"    label: {node.get('label')}")
        print(f"    confidence: {node.get('confidence')}")

    # 检查是否包含"铠途电子商务"
    nodes = graph_data.get('nodes', [])
    kaitu_nodes = [n for n in nodes if '铠途' in n.get('text', '')]

    print("\n" + "=" * 60)
    print("3. 检查是否包含'铠途电子商务'")
    print("=" * 60)

    if kaitu_nodes:
        print(f"❌ 错误！找到 {len(kaitu_nodes)} 个包含'铠途'的节点:")
        for node in kaitu_nodes:
            print(f"  - {node.get('text')} ({node.get('label')})")
    else:
        print("✓ 正确！没有找到'铠途电子商务'相关节点")

    # 检查是否包含"开发团队"
    kaifa_nodes = [n for n in nodes if '开发' in n.get('text', '')]

    print("\n检查是否包含'开发团队':")
    if kaifa_nodes:
        print(f"✓ 找到 {len(kaifa_nodes)} 个包含'开发'的节点:")
        for node in kaifa_nodes:
            print(f"  - {node.get('text')} ({node.get('label')})")
    else:
        print("未找到'开发团队'相关节点")

else:
    print("\n❌ 没有找到文档")
    print("\n尝试使用已知的文档ID测试...")

    test_doc_id = '4dde750c-68ee-4e2a-8e35-0b997807d83f'
    print(f"\n测试文档ID: {test_doc_id}")

    response = requests.get(f'http://localhost:8000/api/kg/graph/{test_doc_id}')
    graph_data = response.json()

    print(f"节点数: {len(graph_data.get('nodes', []))}")
    print(f"边数: {len(graph_data.get('edges', []))}")

    # 显示所有节点的text
    print("\n所有节点的名称:")
    for node in graph_data.get('nodes', []):
        print(f"  - {node.get('text')}")
