# 🚀 CalendarX Backend 部署指南

本指南将帮助您在阿里云 ECS 实例上部署 CalendarX 后端 API 服务。

## 📋 部署前准备

### 阿里云 ECS 要求
- **操作系统**: Ubuntu 20.04 LTS 或更高版本
- **配置**: 最低 1核2GB，推荐 2核4GB
- **存储**: 至少 20GB 系统盘
- **网络**: 配置安全组开放 80、443、8000 端口

### 域名和SSL（可选但推荐）
- 准备域名并解析到 ECS 公网 IP
- 申请 SSL 证书（推荐使用 Let's Encrypt）

## 🛠️ 方式一：直接部署

### 1. 连接到 ECS 实例

```bash
# 使用 SSH 连接到您的 ECS 实例
ssh ubuntu@your-ecs-ip
```

### 2. 系统环境准备

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装必要的系统依赖
sudo apt install -y python3.12 python3.12-venv python3-pip git nginx supervisor

# 安装 Node.js（用于前端构建，可选）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. 部署应用代码

```bash
# 创建应用目录
sudo mkdir -p /opt/calendarx
sudo chown $USER:$USER /opt/calendarx
cd /opt/calendarx

# 克隆代码（替换为您的仓库地址）
git clone https://github.com/your-username/calendarx.git .

# 进入后端目录
cd backend

# 创建 Python 虚拟环境
python3.12 -m venv venv
source venv/bin/activate

# 安装 Python 依赖
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量（重要：设置强密码）
nano .env
```

在 `.env` 文件中设置：
```bash
# 生成强随机密钥（重要！）
JWT_SECRET=your-super-secure-random-key-at-least-32-characters-long
JWT_ALGORITHM=HS256

# 可选配置
HOST=0.0.0.0
PORT=8000
```

### 5. 测试应用

```bash
# 启动应用测试
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 在另一个终端测试
curl http://localhost:8000/health
```

### 6. 配置 Supervisor（进程管理）

创建 Supervisor 配置文件：
```bash
sudo nano /etc/supervisor/conf.d/calendarx.conf
```

添加以下内容：
```ini
[program:calendarx]
command=/opt/calendarx/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
directory=/opt/calendarx/backend
user=ubuntu
autostart=true
autorestart=true
stderr_logfile=/var/log/calendarx.err.log
stdout_logfile=/var/log/calendarx.out.log
environment=PATH="/opt/calendarx/backend/venv/bin"
```

启动服务：
```bash
# 重新加载 Supervisor 配置
sudo supervisorctl reread
sudo supervisorctl update

# 启动 CalendarX 服务
sudo supervisorctl start calendarx

# 检查状态
sudo supervisorctl status calendarx
```

### 7. 配置 Nginx 反向代理

创建 Nginx 站点配置：
```bash
sudo nano /etc/nginx/sites-available/calendarx
```

添加以下内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # API 代理
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态文件缓存
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启用站点：
```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/calendarx /etc/nginx/sites-enabled/

# 删除默认站点
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 8. 配置 SSL（推荐）

使用 Certbot 申请免费 SSL 证书：
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🐳 方式二：Docker 部署

### 1. 安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 将用户添加到 docker 组
sudo usermod -aG docker $USER
# 重新登录以生效
```

### 2. 部署应用

```bash
# 克隆代码
git clone https://github.com/your-username/calendarx.git
cd calendarx/backend

# 配置环境变量
cp .env.example .env
nano .env  # 设置 JWT_SECRET

# 创建数据目录
mkdir -p data

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 3. 生产环境部署

```bash
# 使用生产配置启动（包含 Nginx）
docker-compose --profile production up -d
```

## 🔧 维护和监控

### 日志管理

```bash
# 查看应用日志
sudo tail -f /var/log/calendarx.out.log
sudo tail -f /var/log/calendarx.err.log

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 数据备份

```bash
# 创建备份脚本
sudo nano /opt/backup-calendarx.sh
```

添加以下内容：
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/calendarx"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
cp /opt/calendarx/backend/calendarx.db $BACKUP_DIR/calendarx_$DATE.db

# 保留最近 30 天的备份
find $BACKUP_DIR -name "calendarx_*.db" -mtime +30 -delete

echo "Backup completed: calendarx_$DATE.db"
```

设置定时备份：
```bash
sudo chmod +x /opt/backup-calendarx.sh
sudo crontab -e
# 添加每日备份任务
0 2 * * * /opt/backup-calendarx.sh
```

### 性能监控

安装监控工具：
```bash
# 安装 htop 和 iotop
sudo apt install htop iotop

# 监控系统资源
htop

# 监控磁盘 I/O
sudo iotop
```

### 应用更新

```bash
# 拉取最新代码
cd /opt/calendarx
git pull origin main

# 更新依赖（如果有变化）
cd backend
source venv/bin/activate
pip install -r requirements.txt

# 重启应用
sudo supervisorctl restart calendarx
```

## 🔒 安全建议

### 1. 防火墙配置

```bash
# 启用 UFW 防火墙
sudo ufw enable

# 允许必要端口
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# 查看状态
sudo ufw status
```

### 2. 系统安全

```bash
# 禁用 root 登录
sudo nano /etc/ssh/sshd_config
# 设置 PermitRootLogin no

# 重启 SSH 服务
sudo systemctl restart ssh

# 设置自动安全更新
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

### 3. 应用安全

- 定期更新依赖包
- 使用强密码和密钥
- 启用 HTTPS
- 定期备份数据
- 监控异常访问

## 🚨 故障排除

### 常见问题

1. **服务无法启动**
   ```bash
   # 检查日志
   sudo supervisorctl tail calendarx stderr
   
   # 检查端口占用
   sudo netstat -tlnp | grep 8000
   ```

2. **数据库权限问题**
   ```bash
   # 检查文件权限
   ls -la /opt/calendarx/backend/calendarx.db
   
   # 修复权限
   sudo chown ubuntu:ubuntu /opt/calendarx/backend/calendarx.db
   ```

3. **Nginx 配置错误**
   ```bash
   # 测试配置
   sudo nginx -t
   
   # 查看错误日志
   sudo tail -f /var/log/nginx/error.log
   ```

### 性能优化

1. **数据库优化**
   - 定期清理过期数据
   - 考虑使用 PostgreSQL（大量用户时）

2. **缓存策略**
   - 配置 Nginx 静态文件缓存
   - 考虑使用 Redis 缓存

3. **负载均衡**
   - 多实例部署
   - 使用阿里云 SLB

## 📞 技术支持

如果在部署过程中遇到问题，请：

1. 检查日志文件
2. 确认配置文件正确
3. 验证网络和防火墙设置
4. 提交 Issue 到项目仓库

---

**🎉 恭喜！您的 CalendarX 后端服务已成功部署！**

访问 `https://your-domain.com/docs` 查看 API 文档。