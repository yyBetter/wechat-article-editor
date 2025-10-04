#!/bin/bash

# 阿里云自动部署脚本 - 微信公众号排版工具
# 使用方法: chmod +x aliyun-auto-deploy.sh && ./aliyun-auto-deploy.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 微信公众号排版工具 - 阿里云自动部署${NC}"
echo "================================================"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用root用户运行此脚本${NC}"
    echo "使用命令: sudo ./aliyun-auto-deploy.sh"
    exit 1
fi

# 获取用户输入
echo -e "${YELLOW}📋 请提供以下信息:${NC}"
read -p "你的域名 (如: gzh-paiban.com，没有请按Enter跳过): " DOMAIN_NAME
read -p "管理员邮箱 (用于查看统计数据): " ADMIN_EMAIL
read -p "是否安装SSL证书? (y/n): " INSTALL_SSL

# 验证邮箱格式
if [[ ! "$ADMIN_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
    echo -e "${RED}❌ 邮箱格式不正确${NC}"
    exit 1
fi

# 1. 系统更新
echo -e "${GREEN}🔄 步骤 1/8: 更新系统...${NC}"
apt update && apt upgrade -y

# 2. 安装必要软件
echo -e "${GREEN}🔧 步骤 2/8: 安装必要软件...${NC}"

# 安装Docker
if ! command -v docker &> /dev/null; then
    echo "安装Docker..."
    curl -fsSL https://get.docker.com | bash
    usermod -aG docker root
    systemctl start docker
    systemctl enable docker
fi

# 安装Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "安装Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 安装其他工具
apt install -y git nginx certbot python3-certbot-nginx htop curl wget unzip

# 3. 创建项目目录
echo -e "${GREEN}📁 步骤 3/8: 创建项目目录...${NC}"
PROJECT_DIR="/opt/wechat-editor"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 4. 创建Docker配置文件
echo -e "${GREEN}🐳 步骤 4/8: 创建Docker配置...${NC}"

# 生成强密码
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 32)

# 创建环境变量文件
cat > .env.production << EOF
# 数据库配置
DATABASE_URL="postgresql://wechat_user:${DB_PASSWORD}@postgres:5432/wechat_editor_prod"

# JWT密钥
JWT_SECRET="${JWT_SECRET}"
JWT_EXPIRES_IN="7d"

# 服务器配置
PORT=3002
NODE_ENV="production"

# 域名配置
FRONTEND_URL="${DOMAIN_NAME:+https://$DOMAIN_NAME}"

# 管理员配置
ADMIN_EMAIL="${ADMIN_EMAIL}"

# 数据库密码
DB_PASSWORD="${DB_PASSWORD}"

# 安全配置
BCRYPT_ROUNDS="12"
SESSION_SECRET="${SESSION_SECRET}"

# 文件上传配置
UPLOAD_PATH="/app/uploads"
MAX_FILE_SIZE="10485760"

# 日志配置
LOG_LEVEL="info"
LOG_FILE="/app/logs/app.log"
EOF

echo -e "${YELLOW}🔐 安全信息已生成 (请妥善保存):${NC}"
echo "数据库密码: ${DB_PASSWORD}"
echo "JWT密钥: ${JWT_SECRET:0:20}..."

# 创建docker-compose文件
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:15-alpine
    container_name: wechat-editor-db
    environment:
      POSTGRES_DB: wechat_editor_prod
      POSTGRES_USER: wechat_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wechat_user -d wechat_editor_prod"]
      interval: 30s
      timeout: 10s
      retries: 5

  # 后端API服务
  backend:
    build: 
      context: .
      target: backend
      dockerfile: Dockerfile
    container_name: wechat-editor-backend
    environment:
      DATABASE_URL: postgresql://wechat_user:${DB_PASSWORD}@postgres:5432/wechat_editor_prod
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
      NODE_ENV: production
      FRONTEND_URL: ${FRONTEND_URL}
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      PORT: 3002
    volumes:
      - uploads_data:/app/uploads
      - logs_data:/app/logs
    ports:
      - "127.0.0.1:3002:3002"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
    driver: local
  uploads_data:
    driver: local
  logs_data:
    driver: local
EOF

# 5. 创建Dockerfile (如果不存在)
if [ ! -f "Dockerfile" ]; then
    echo -e "${GREEN}🏗️ 创建Dockerfile...${NC}"
    cat > Dockerfile << 'EOF'
# 多阶段构建 - 后端服务
FROM node:18-alpine as backend

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 复制源码
COPY . .

# 创建必要目录
RUN mkdir -p uploads/images logs

# 构建应用 (如果有构建步骤)
# RUN npm run build

# 设置权限
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3002

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

CMD ["node", "src/index.js"]
EOF
fi

# 6. 配置Nginx
echo -e "${GREEN}🌐 步骤 5/8: 配置Nginx反向代理...${NC}"

if [ -n "$DOMAIN_NAME" ]; then
    # 有域名的配置
    cat > /etc/nginx/sites-available/wechat-editor << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME};
    
    # 临时重定向到HTTPS (SSL配置完成后取消注释)
    # return 301 https://\$server_name\$request_uri;
    
    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # 静态文件
    location / {
        root /opt/wechat-editor/dist;
        try_files \$uri \$uri/ /index.html;
        
        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF
else
    # 仅IP访问的配置
    cat > /etc/nginx/sites-available/wechat-editor << EOF
server {
    listen 80 default_server;
    
    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # 静态文件
    location / {
        root /opt/wechat-editor/dist;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
fi

# 启用站点
ln -sf /etc/nginx/sites-available/wechat-editor /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
nginx -t

# 7. 启动服务
echo -e "${GREEN}🚀 步骤 6/8: 启动服务...${NC}"

# 确保项目文件存在并构建前端 (这里需要你的源代码)
echo -e "${YELLOW}⚠️ 注意: 请确保项目源代码已上传到 $PROJECT_DIR${NC}"
echo "如果还没有上传代码，请现在上传，然后按任意键继续..."
read -n 1 -s -r

# 启动Docker服务
docker-compose --env-file .env.production up -d --build

# 启动Nginx
systemctl restart nginx
systemctl enable nginx

# 8. 配置SSL证书
if [ "$INSTALL_SSL" = "y" ] && [ -n "$DOMAIN_NAME" ]; then
    echo -e "${GREEN}🔒 步骤 7/8: 配置SSL证书...${NC}"
    
    echo "等待DNS解析生效..."
    sleep 30
    
    # 申请SSL证书
    if certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email $ADMIN_EMAIL; then
        echo -e "${GREEN}✅ SSL证书申请成功${NC}"
        
        # 设置自动续期
        echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
    else
        echo -e "${YELLOW}⚠️ SSL证书申请失败，可能是DNS还未生效，稍后可手动执行:${NC}"
        echo "certbot --nginx -d $DOMAIN_NAME"
    fi
fi

# 9. 配置防火墙
echo -e "${GREEN}🛡️ 步骤 8/8: 配置安全设置...${NC}"

# 安装UFW防火墙
apt install -y ufw

# 配置防火墙规则
ufw --force reset
ufw allow 22      # SSH
ufw allow 80      # HTTP
ufw allow 443     # HTTPS
ufw --force enable

# 10. 创建监控脚本
cat > /opt/monitor.sh << 'EOF'
#!/bin/bash
# 服务监控脚本

LOG_FILE="/var/log/wechat-editor-monitor.log"

# 检查Docker服务
if ! docker-compose ps | grep -q "Up"; then
    echo "$(date): Docker services not running, restarting..." >> $LOG_FILE
    cd /opt/wechat-editor && docker-compose restart
fi

# 检查Nginx服务
if ! systemctl is-active --quiet nginx; then
    echo "$(date): Nginx not running, restarting..." >> $LOG_FILE
    systemctl restart nginx
fi

# 检查磁盘空间
DISK_USAGE=$(df /opt | awk 'END{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): Disk usage high: ${DISK_USAGE}%" >> $LOG_FILE
fi
EOF

chmod +x /opt/monitor.sh

# 添加定时任务
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/monitor.sh") | crontab -

# 最终检查
echo -e "${GREEN}🔍 最终检查...${NC}"
sleep 10

# 检查服务状态
echo "Docker服务状态:"
docker-compose ps

echo "Nginx状态:"
systemctl status nginx --no-pager -l

# 检查端口监听
echo "端口监听状态:"
ss -tlnp | grep -E ":80|:443|:3002"

# 完成
echo ""
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "================================================"

if [ -n "$DOMAIN_NAME" ]; then
    if [ "$INSTALL_SSL" = "y" ]; then
        echo -e "${GREEN}🌐 访问地址: https://$DOMAIN_NAME${NC}"
    else
        echo -e "${GREEN}🌐 访问地址: http://$DOMAIN_NAME${NC}"
    fi
else
    SERVER_IP=$(curl -s ifconfig.me)
    echo -e "${GREEN}🌐 访问地址: http://$SERVER_IP${NC}"
fi

echo -e "${GREEN}📊 统计API: /api/analytics/public-stats${NC}"
echo -e "${GREEN}📧 管理员邮箱: $ADMIN_EMAIL${NC}"
echo ""
echo -e "${YELLOW}📋 重要信息:${NC}"
echo "• 数据库密码: $DB_PASSWORD"
echo "• 配置文件: $PROJECT_DIR/.env.production"
echo "• 日志目录: /var/log/wechat-editor-monitor.log"
echo "• 监控脚本: /opt/monitor.sh"
echo ""
echo -e "${BLUE}🔧 常用管理命令:${NC}"
echo "• 查看服务状态: docker-compose ps"
echo "• 查看日志: docker-compose logs -f"
echo "• 重启服务: docker-compose restart"
echo "• 更新SSL证书: certbot renew"
echo ""
echo -e "${GREEN}✅ 部署完成，请测试访问功能！${NC}"