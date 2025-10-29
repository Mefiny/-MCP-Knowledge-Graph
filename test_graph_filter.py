import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import requests

# 1. 先获取所有文档列表
print("=" * 60)
print("获取文档列表...")
print("=" * 60)

response = requests.get('http://localhost:8000/api/documents')
docs_data = response.json()

print(f"找到 {docs_data['total']} 个文档")

# 由于文档列表为空，让我们直接查询Neo4j中的文档
print("\n" + "=" * 60)
print("从Neo4j查询文档...")
print("=" * 60)

# 手动构造一个查询来获取文档ID
# 我们知道有26个上传的文件，让我们查询Neo4j中的文档节点

import requests

# 使用后端的health检查来验证
response = requests.get('http://localhost:8000/health')
health = response.json()
print(f"\n知识图谱状态: {health['services']['knowledge_graph']['status']}")
print(f"节点数: {health['services']['knowledge_graph']['nodes']}")
print(f"关系数: {health['services']['knowledge_graph']['relationships']}")

# 尝试查询一个特定文档的图谱
# 我们需要找到一个真实的文档ID
print("\n" + "=" * 60)
print("测试：查询铠途电子商务实体所属的文档...")
print("=" * 60)

# 先搜索这个实体
response = requests.get('http://localhost:8000/api/kg/search', params={'label': 'ORG', 'limit': 10})
entities = response.json()['entities']

print("找到的组织实体:")
for ent in entities:
    print(f"  - {ent['text']}")

# 现在我们需要找出哪个文档ID包含这个实体
# 但我们没有直接的API...让我直接测试图谱查询

print("\n" + "=" * 60)
print("测试不同的文档ID查询...")
print("=" * 60)

# 测试几个已知的文档ID（从uploads目录的文件名）
test_doc_ids = [
    '4dde750c-68ee-4e2a-8e35-0b997807d83f',
    '84ce0817-c86a-4082-84cf-ee8e1ae89a3d',
    '5730718d-88de-4d46-94cd-5f032f21dfaf'
]

for doc_id in test_doc_ids:
    try:
        response = requests.get(f'http://localhost:8000/api/kg/graph/{doc_id}')
        graph_data = response.json()

        print(f"\n文档 {doc_id}:")
        print(f"  节点数: {len(graph_data.get('nodes', []))}")
        print(f"  边数: {len(graph_data.get('edges', []))}")

        # 显示前5个节点
        nodes = graph_data.get('nodes', [])
        if nodes:
            print(f"  前5个实体:")
            for node in nodes[:5]:
                print(f"    - {node.get('text', 'N/A')} ({node.get('label', 'N/A')})")

        # 检查是否包含"铠途电子商务"
        kaitu_found = any('铠途' in node.get('text', '') for node in nodes)
        print(f"  包含'铠途电子商务': {'是' if kaitu_found else '否'}")

    except Exception as e:
        print(f"\n文档 {doc_id}: 查询失败 - {e}")

