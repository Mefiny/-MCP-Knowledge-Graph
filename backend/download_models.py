"""
模型预下载脚本
在启动服务器前先下载所需模型
"""
import os
import sys
from pathlib import Path


def download_embedding_models():
    """下载Embedding模型"""
    print("=" * 60)
    print("正在下载 Sentence Transformers 模型...")
    print("=" * 60)

    # 可选：使用国内镜像（如果下载慢）
    use_mirror = input("\n是否使用国内镜像加速下载? (y/n，默认n): ").strip().lower()
    if use_mirror == 'y':
        os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'
        print("✓ 已设置国内镜像")

    # 尝试下载多个模型
    models = [
        "all-MiniLM-L6-v2",  # 推荐：小而快
        "paraphrase-MiniLM-L6-v2",  # 备选
    ]

    success_count = 0

    for model_name in models:
        print(f"\n正在下载: {model_name}")
        print("-" * 60)
        try:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer(model_name)
            print(f"✓ {model_name} 下载成功！")
            success_count += 1
        except Exception as e:
            print(f"✗ {model_name} 下载失败: {str(e)}")

    return success_count > 0


def download_spacy_model():
    """下载SpaCy中文模型"""
    print("\n" + "=" * 60)
    print("正在下载 SpaCy 中文模型...")
    print("=" * 60)

    try:
        import spacy
        from spacy.cli import download

        print("\n正在下载: zh_core_web_sm")
        print("-" * 60)
        download("zh_core_web_sm")
        print("✓ SpaCy 中文模型下载成功！")
        return True
    except Exception as e:
        print(f"✗ SpaCy 模型下载失败: {str(e)}")
        print("提示: 你仍然可以使用 SimpleNER (基于规则)")
        return False


def check_directories():
    """检查并创建必要的目录"""
    print("\n" + "=" * 60)
    print("检查目录结构...")
    print("=" * 60)

    dirs = [
        "./data/chroma",
        "./uploads",
        "./logs"
    ]

    for dir_path in dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
        print(f"✓ {dir_path}")

    return True


def main():
    """主函数"""
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 15 + "MCP 平台模型下载工具" + " " * 15 + "║")
    print("╚" + "=" * 58 + "╝")

    # 1. 检查目录
    check_directories()

    # 2. 下载 Embedding 模型
    embedding_success = download_embedding_models()

    # 3. 下载 SpaCy 模型（可选）
    download_spacy = input("\n是否下载 SpaCy 中文模型? (y/n，默认n): ").strip().lower()
    if download_spacy == 'y':
        download_spacy_model()
    else:
        print("已跳过 SpaCy 模型，将使用 SimpleNER")

    # 总结
    print("\n" + "=" * 60)
    print("下载完成！")
    print("=" * 60)

    if embedding_success:
        print("\n✓ 可以启动服务器了！")
        print("\n运行命令:")
        print("  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        print("\n或使用启动脚本:")
        print("  python start_server.py")
    else:
        print("\n✗ Embedding 模型下载失败，请检查网络连接")
        print("建议:")
        print("  1. 检查网络连接")
        print("  2. 尝试使用国内镜像")
        print("  3. 手动设置代理")
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n用户中断")
        sys.exit(0)
    except Exception as e:
        print(f"\n错误: {str(e)}")
        sys.exit(1)