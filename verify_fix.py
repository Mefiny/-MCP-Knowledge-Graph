import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import requests
import time

# 等待后端服务重新加载
print("Waiting for backend to reload...")
time.sleep(3)

# 测试文档ID
doc_id = '8b865530-8d4c-451f-bc6b-d7c0278be924'

print(f"\n{'='*60}")
print(f"Testing document graph query")
print(f"{'='*60}")
print(f"Document ID: {doc_id}")

try:
    response = requests.get(f'http://localhost:8000/api/kg/graph/{doc_id}')
    graph_data = response.json()

    print(f"\nNodes count: {len(graph_data.get('nodes', []))}")
    print(f"Edges count: {len(graph_data.get('edges', []))}")

    # 检查是否包含"铠途电子商务"
    nodes = graph_data.get('nodes', [])
    kaitu_nodes = [n for n in nodes if '铠途' in n.get('text', '')]

    print(f"\n{'='*60}")
    print(f"Checking for 'Kaitu E-commerce'")
    print(f"{'='*60}")

    if kaitu_nodes:
        print(f"[ERROR] Still found {len(kaitu_nodes)} nodes containing 'Kaitu':")
        for node in kaitu_nodes:
            print(f"  - {node.get('text')} ({node.get('label')})")
        print(f"\n[FAILED] The fix did not work!")
    else:
        print(f"[SUCCESS] No 'Kaitu E-commerce' found!")
        print(f"[SUCCESS] The fix worked correctly!")

    # 显示前10个节点
    print(f"\n{'='*60}")
    print(f"First 10 nodes in the graph:")
    print(f"{'='*60}")
    for i, node in enumerate(nodes[:10], 1):
        print(f"  {i}. {node.get('text')} ({node.get('label')})")

except Exception as e:
    print(f"[ERROR] Failed to query API: {e}")
