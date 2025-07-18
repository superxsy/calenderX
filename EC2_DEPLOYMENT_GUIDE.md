# CalendarX EC2 部署完整指南

## 📋 目录

- [概述](#概述)
- [环境准备](#环境准备)
- [后端部署](#后端部署)
- [前端部署](#前端部署)
- [Nginx配置](#nginx配置)
- [安全组配置](#安全组配置)
- [故障排除](#故障排除)
- [维护指南](#维护指南)

## 概述

本文档详细描述了如何将CalendarX全栈应用部署到AWS EC2实例的完整过程。

### 技术栈
- **前端**: Vue 3 + Vite
- **后端**: FastAPI + Docker
- **数据库**: PostgreSQL (Docker)
- **Web服务器**: Nginx
- **服务器**: Ubuntu 22.04 LTS

### 部署架构
```
用户浏览器
    ↓ (HTTP:80)
Nginx反向代理服务器
    ├── 静态文件服务 → 前端Vue.js应用
    └── API代理 → Docker后端服务 (FastAPI:8000)
```

## 环境准备

### 1. EC2实例要求
- **实例类型**: t2.micro 或更高
- **操作系统**: Ubuntu 22.04 LTS
- **存储**: 至少20GB
- **安全组**: 开放22(SSH), 80(HTTP), 8000(API)端口

### 2. 连接EC2实例

使用FinalShell或其他SSH客户端连接：
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-ip
```

### 3. 系统更新
```bash
sudo apt update
sudo apt upgrade -y
```

## 后端部署

### 1. 克隆项目代码
```bash
# 克隆仓库
git clone https://github.com/your-username/calenderX.git
cd calenderX

# 切换到后端分支
git checkout backend-development
cd backend
```

### 2. 安装Docker和docker-compose
```bash
# 安装Docker
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker

# 将用户添加到docker组
sudo usermod -aG docker $USER

# 安装docker-compose
sudo apt install docker-compose -y

# 验证安装
docker --version
docker-compose --version
```

### 3. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

**重要配置项**：
```env
# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# 数据库配置
DATABASE_URL=postgresql://calendarx:your-db-password@db:5432/calendarx_db
POSTGRES_USER=calendarx
POSTGRES_PASSWORD=your-db-password
POSTGRES_DB=calendarx_db

# 服务器配置
HOST=0.0.0.0
PORT=8000

# CORS配置
ALLOWED_ORIGINS=http://localhost:3000,http://your-ec2-ip
```

### 4. 启动后端服务
```bash
# 构建并启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 5. 验证后端服务
```bash
# 健康检查
curl http://localhost:8000/health
# 预期输出: {"status":"healthy"}

# API文档
curl http://localhost:8000/docs
# 应返回Swagger UI页面
```

## 前端部署

### 1. 本地构建前端

**在本地Windows电脑上**：

```powershell
# 进入项目目录
cd c:\code\calenderX

# 修改API配置
# 编辑 src/services/apiService.js
# 将 baseURL 改为: 'http://your-ec2-ip:8000/api/v1'

# 安装依赖（如果还没安装）
npm install

# 构建生产版本
npm run build
```

### 2. 上传前端文件到EC2

**方法A: 使用FinalShell**
1. 选择本地 `c:\code\calenderX\dist\` 目录下的所有文件
2. 上传到EC2的 `/home/ubuntu/frontend/` 目录

**方法B: 使用SCP命令**
```powershell
scp -i "your-key.pem" -r c:\code\calenderX\dist\* ubuntu@your-ec2-ip:/home/ubuntu/frontend/
```

### 3. 安装Nginx
```bash
# 安装Nginx
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# 验证安装
sudo systemctl status nginx
```

### 4. 部署前端文件
```bash
# 清理nginx默认目录
sudo rm -rf /var/www/html/*

# 复制前端文件
sudo cp -r ~/frontend/* /var/www/html/

# 设置权限
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/

# 验证文件
ls -la /var/www/html/
```

## Nginx配置

### 1. 编辑Nginx配置
```bash
sudo nano /etc/nginx/sites-available/default
```

### 2. 配置内容
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html index.htm;
    
    server_name _;
    
    # 静态文件缓存和MIME类型
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API代理到后端
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 健康检查代理
    location /health {
        proxy_pass http://localhost:8000;
    }
    
    # API文档代理
    location /docs {
        proxy_pass http://localhost:8000;
    }
    
    location /openapi.json {
        proxy_pass http://localhost:8000;
    }
}
```

### 3. 测试和重启Nginx
```bash
# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx

# 检查状态
sudo systemctl status nginx
```

## 安全组配置

在AWS控制台配置EC2安全组，添加以下入站规则：

| 类型 | 端口 | 源 | 描述 |
|------|------|----|---------|
| SSH | 22 | 您的IP | SSH访问 |
| HTTP | 80 | 0.0.0.0/0 | 前端访问 |
| Custom TCP | 8000 | 0.0.0.0/0 | 后端API |

## 故障排除

### 1. 前端空白页面问题

**症状**: 访问前端显示空白页面，控制台显示MIME类型错误

**解决方案**:
```bash
# 检查文件是否存在
ls -la /var/www/html/
ls -la /var/www/html/assets/

# 检查权限
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/

# 检查Nginx配置
sudo nginx -t
sudo systemctl restart nginx
```

### 2. API连接问题

**症状**: 前端无法连接后端API

**解决方案**:
```bash
# 检查后端服务状态
docker-compose ps
docker-compose logs -f

# 检查端口监听
sudo netstat -tlnp | grep :8000

# 测试API连接
curl http://localhost:8000/health
```

### 3. Docker服务问题

**症状**: Docker容器无法启动

**解决方案**:
```bash
# 查看详细日志
docker-compose logs api
docker-compose logs db

# 重新构建
docker-compose down
docker-compose up --build -d

# 检查磁盘空间
df -h
```

### 4. 数据库连接问题

**症状**: 后端无法连接数据库

**解决方案**:
```bash
# 检查数据库容器
docker-compose exec db psql -U calendarx -d calendarx_db

# 检查环境变量
cat .env

# 重启数据库服务
docker-compose restart db
```

## 维护指南

### 1. 日常监控
```bash
# 检查服务状态
sudo systemctl status nginx
docker-compose ps

# 查看日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
docker-compose logs -f --tail=50
```

### 2. 更新部署

**后端更新**:
```bash
cd ~/calenderX/backend
git pull origin backend-development
docker-compose down
docker-compose up --build -d
```

**前端更新**:
```bash
# 本地重新构建
npm run build

# 上传新的dist文件
# 然后在EC2上:
sudo rm -rf /var/www/html/*
sudo cp -r ~/frontend/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
sudo systemctl restart nginx
```

### 3. 备份策略
```bash
# 备份数据库
docker-compose exec db pg_dump -U calendarx calendarx_db > backup_$(date +%Y%m%d).sql

# 备份配置文件
cp .env .env.backup
sudo cp /etc/nginx/sites-available/default nginx.conf.backup
```

### 4. 性能优化

**Nginx优化**:
```nginx
# 在nginx.conf中添加
gzip on;
gzip_types text/plain text/css application/json application/javascript;
client_max_body_size 10M;
```

**Docker优化**:
```bash
# 清理未使用的镜像
docker system prune -f

# 查看资源使用
docker stats
```

## 访问地址

部署完成后，应用可通过以下地址访问：

- **前端应用**: `http://your-ec2-ip/`
- **API文档**: `http://your-ec2-ip/docs`
- **健康检查**: `http://your-ec2-ip/health`
- **后端API**: `http://your-ec2-ip/api/v1/`

## 安全建议

1. **定期更新系统**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **配置防火墙**:
   ```bash
   sudo ufw enable
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 8000
   ```

3. **使用HTTPS** (生产环境):
   - 申请SSL证书
   - 配置Nginx SSL
   - 重定向HTTP到HTTPS

4. **环境变量安全**:
   - 使用强密码
   - 定期更换JWT密钥
   - 不要将.env文件提交到版本控制

## 总结

本文档涵盖了CalendarX应用在AWS EC2上的完整部署流程，包括：
- 后端Docker化部署
- 前端静态文件部署
- Nginx反向代理配置
- 常见问题排查
- 维护和优化建议

遵循本指南可以成功部署一个生产就绪的CalendarX应用实例。