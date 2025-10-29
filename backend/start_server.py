"""
MCP 服务器启动脚本
带完整的错误检查和友好提示
"""
import os
import sys
import subprocess
from pathlib import Path

# 设置UTF-8编码，避免Windows控制台编码问题
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


def check_environment():
    """检查环境配置"""
    print("=" * 60)
    print("检查环境...")
    print("=" * 60)

    # 检查Python版本
    print(f"\n✓ Python版本: {sys.version.split()[0]}")

    # 检查关键依赖
    dependencies = [
        "fastapi",
        "uvicorn",
        "chromadb",
        "sentence_transformers",
        "loguru"
    ]

    missing = []
    for dep in dependencies:
        try:
            __import__(dep.replace("-", "_"))
            print(f"✓ {dep}")
        except ImportError:
            print(f"✗ {dep} (未安装)")
            missing.append(dep)

    if missing:
        print(f"\n缺少依赖: {', '.join(missing)}")
        print("请运行: pip install -r requirements.txt")
        return False

    return True


def check_models():
    """检查模型是否已下载"""
    print("\n" + "=" * 60)
    print("检查模型...")
    print("=" * 60)

    try:
        from sentence_transformers import SentenceTransformer
        print("\n正在验证 Embedding 模型...")

        # 尝试加载模型
        try:
            model = SentenceTransformer("all-MiniLM-L6-v2")
            print("✓ all-MiniLM-L6-v2 可用")
            return True
        except Exception as e:
            print(f"✗ 模型未下载或加载失败")
            print(f"  错误: {str(e)}")
            print("\n请先运行: python download_models.py")
            return False

    except ImportError:
        print("✗ sentence-transformers 未安装")
        return False


def check_directories():
    """检查目录"""
    print("\n" + "=" * 60)
    print("检查目录...")
    print("=" * 60)

    dirs = {
        "./data/chroma": "向量数据库目录",
        "./uploads": "文件上传目录",
        "./app": "应用代码目录"
    }

    all_exist = True
    for dir_path, description in dirs.items():
        if Path(dir_path).exists():
            print(f"✓ {dir_path} - {description}")
        else:
            print(f"✗ {dir_path} - {description} (不存在)")
            if dir_path != "./app":
                Path(dir_path).mkdir(parents=True, exist_ok=True)
                print(f"  已创建: {dir_path}")
            else:
                all_exist = False

    return all_exist


def check_env_file():
    """检查环境变量文件"""
    env_file = Path(".env")
    if not env_file.exists():
        print("\n⚠ 警告: .env 文件不存在")
        print("  某些功能可能无法使用（如RAG问答需要OpenAI API Key）")
        return False
    else:
        print("\n✓ .env 文件存在")
        return True


def start_server():
    """启动服务器"""
    print("\n" + "=" * 60)
    print("启动 MCP 服务器...")
    print("=" * 60)

    print("\n服务器信息:")
    print("  地址: http://localhost:8000")
    print("  文档: http://localhost:8000/docs")
    print("  健康检查: http://localhost:8000/health")
    print("\n按 Ctrl+C 停止服务器\n")
    print("=" * 60)
    print()

    try:
        # 启动uvicorn服务器
        subprocess.run([
            "uvicorn",
            "app.main:app",
            "--reload",
            "--host", "0.0.0.0",
            "--port", "8000"
        ])
    except KeyboardInterrupt:
        print("\n\n服务器已停止")
    except FileNotFoundError:
        print("\n✗ uvicorn 未安装")
        print("请运行: pip install uvicorn[standard]")
        sys.exit(1)


def main():
    """主函数"""
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 18 + "MCP 平台启动" + " " * 18 + "║")
    print("╚" + "=" * 58 + "╝")
    print()

    # 1. 检查环境
    if not check_environment():
        print("\n请先安装依赖后再启动服务器")
        sys.exit(1)

    # 2. 检查目录
    if not check_directories():
        print("\n✗ 目录检查失败，请确认在正确的项目目录下")
        sys.exit(1)

    # 3. 检查模型
    if not check_models():
        answer = input("\n是否现在下载模型? (y/n): ").strip().lower()
        if answer == 'y':
            print("\n运行: python download_models.py")
            subprocess.run([sys.executable, "download_models.py"])
        else:
            print("\n取消启动")
            sys.exit(0)

    # 4. 检查环境变量
    check_env_file()

    # 5. 启动服务器
    input("\n按回车键启动服务器...")
    start_server()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n用户中断")
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ 错误: {str(e)}")
        import traceback

        traceback.print_exc()
        sys.exit(1)