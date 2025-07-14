#!/usr/bin/env python3
"""
CalendarX Backend Startup Script
快速启动脚本，用于开发和生产环境
"""

import os
import sys
import subprocess
from pathlib import Path


def check_python_version():
    """检查Python版本"""
    if sys.version_info < (3, 8):
        print("❌ 错误: 需要 Python 3.8 或更高版本")
        print(f"当前版本: {sys.version}")
        sys.exit(1)
    print(f"✅ Python 版本: {sys.version.split()[0]}")


def check_dependencies():
    """检查依赖是否安装"""
    try:
        import fastapi
        import sqlmodel
        import uvicorn
        print("✅ 依赖检查通过")
    except ImportError as e:
        print(f"❌ 缺少依赖: {e}")
        print("请运行: pip install -r requirements.txt")
        sys.exit(1)


def check_env_file():
    """检查环境变量文件"""
    env_file = Path(".env")
    if not env_file.exists():
        print("⚠️  警告: .env 文件不存在")
        print("建议复制 .env.example 到 .env 并配置 JWT_SECRET")
        
        # 自动创建基础 .env 文件
        with open(".env", "w", encoding="utf-8") as f:
            f.write("JWT_SECRET=dev-secret-key-change-in-production-12345678\n")
            f.write("JWT_ALGORITHM=HS256\n")
        print("✅ 已创建基础 .env 文件")
    else:
        print("✅ .env 文件存在")


def start_server(host="0.0.0.0", port=8000, reload=True):
    """启动服务器"""
    print(f"🚀 启动 CalendarX API 服务器...")
    print(f"📍 地址: http://{host}:{port}")
    print(f"📖 API 文档: http://{host}:{port}/docs")
    print(f"🔄 热重载: {'开启' if reload else '关闭'}")
    print("-" * 50)
    
    cmd = [
        "uvicorn",
        "app.main:app",
        "--host", host,
        "--port", str(port)
    ]
    
    if reload:
        cmd.append("--reload")
    
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
    except FileNotFoundError:
        print("❌ 错误: 找不到 uvicorn 命令")
        print("请确保已安装依赖: pip install -r requirements.txt")
        sys.exit(1)


def main():
    """主函数"""
    print("🌟 CalendarX Backend API")
    print("=" * 30)
    
    # 检查环境
    check_python_version()
    check_dependencies()
    check_env_file()
    
    # 解析命令行参数
    import argparse
    parser = argparse.ArgumentParser(description="CalendarX Backend API 启动器")
    parser.add_argument("--host", default="0.0.0.0", help="服务器地址 (默认: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="端口号 (默认: 8000)")
    parser.add_argument("--no-reload", action="store_true", help="禁用热重载")
    
    args = parser.parse_args()
    
    # 启动服务器
    start_server(
        host=args.host,
        port=args.port,
        reload=not args.no_reload
    )


if __name__ == "__main__":
    main()