import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import requests

# 查询所有文档
response = requests.get('http://localhost:8000/api/kg/stats')
print("知识图谱统计:")
print(response.json())
print()

# 查询ORG类型的实体（可能包含铠图电子商务）
response = requests.get('http://localhost:8000/api/kg/search', params={'label': 'ORG', 'limit': 100})
data = response.json()

print("=" * 60)
print(f"找到 {len(data['entities'])} 个组织实体:")
print("=" * 60)

for i, ent in enumerate(data['entities'][:30], 1):
    # 尝试安全解码
    text = ent['text']
    print(f"{i}. {repr(text)} - {ent['label']} (置信度: {ent['confidence']})")

# 检查文件名
import os
uploads_dir = 'backend/uploads'
files = os.listdir(uploads_dir)

print(f"\n上传的文件数量: {len(files)}")
print("最近上传的5个文件:")
files_with_time = [(f, os.path.getmtime(os.path.join(uploads_dir, f))) for f in files]
files_with_time.sort(key=lambda x: x[1], reverse=True)

for fname, _ in files_with_time[:5]:
    print(f"  - {fname}")
