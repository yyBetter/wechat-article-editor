#!/bin/bash

# 🚀 多环境部署脚本 - 支持 staging/production
# 用法：
#   ./deploy-multi-env.sh staging    # 部署到测试环境
#   ./deploy-multi-env.sh production # 部署到生产环境

set -e  # 遇到错误立即退出

# ========== 参数检查 ==========
if [ $# -eq 0 ]; then
    echo "❌ 错误：请指定部署环境"
    echo ""
    echo "用法："
    echo "  ./deploy-multi-env.sh staging     # 部署到测试环境"
    echo "  ./deploy-multi-env.sh production  # 部署到生产环境"
    echo ""
    exit 1
fi

ENV=$1

# 验证环境参数
if [ "$ENV" != "staging" ] && [ "$ENV" != "production" ]; then
    echo "❌ 错误：无效的环境名称 '$ENV'"
    echo "支持的环境: staging, production"
    exit 1
fi

# ========== 环境配置 ==========
if [ "$ENV" = "staging" ]; then
    # 测试环境配置
    SERVER_IP="47.55.117.20"  # 可以是同一台服务器
    SERVER_USER="root"
    SERVER_PATH="/opt/wechat-editor-staging"
    FRONTEND_PATH="/var/www/staging"
    PM2_APP_NAME="wechat-editor-staging"
    NGINX_CONFIG_NAME="wechat-editor-staging"
    ENV_FILE=".env.staging"
    COLOR="\033[1;33m"  # 黄色
elif [ "$ENV" = "production" ]; then
    # 生产环境配置
    SERVER_IP="47.55.117.20"
    SERVER_USER="root"
    SERVER_PATH="/opt/wechat-editor"
    FRONTEND_PATH="/var/www/html"
    PM2_APP_NAME="wechat-editor"
    NGINX_CONFIG_NAME="wechat-editor"
    ENV_FILE=".env.production"
    COLOR="\033[0;32m"  # 绿色
fi

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========== 辅助函数 ==========
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_env() {
    echo -e "${COLOR}🌍 [$ENV] $1${NC}"
}

# ========== 确认部署 ==========
echo ""
ENV_UPPER=$(echo "$ENV" | tr '[:lower:]' '[:upper:]')
log_env "准备部署到 ${ENV_UPPER} 环境"
echo ""
echo "📋 部署配置："
echo "  服务器: ${SERVER_USER}@${SERVER_IP}"
echo "  后端路径: ${SERVER_PATH}"
echo "  前端路径: ${FRONTEND_PATH}"
echo "  PM2应用名: ${PM2_APP_NAME}"
echo "  环境文件: ${ENV_FILE}"
echo ""

# 生产环境需要二次确认
if [ "$ENV" = "production" ]; then
    log_warning "⚠️  你正在部署到生产环境！"
    read -p "确认继续？(输入 yes 继续): " confirm
    if [ "$confirm" != "yes" ]; then
        log_info "已取消部署"
        exit 0
    fi
fi

# ========== 检查环境文件 ==========
if [ ! -f "$ENV_FILE" ]; then
    log_error "环境配置文件不存在: $ENV_FILE"
    exit 1
fi

# ========== 步骤1：构建前端 ==========
log_info "开始构建前端 (${ENV} 模式)..."

# 使用对应环境的配置文件
cp $ENV_FILE .env
npm run build

if [ ! -d "dist" ]; then
    log_error "前端构建失败：dist目录不存在"
    exit 1
fi
log_success "前端构建完成"

# ========== 步骤2：构建后端 ==========
log_info "开始构建后端..."
cd server

# 复制环境配置
cp ../$ENV_FILE .env

npm run build

if [ ! -d "dist" ]; then
    log_error "后端构建失败：dist目录不存在"
    exit 1
fi
cd ..
log_success "后端构建完成"

# ========== 步骤3：上传前端文件 ==========
log_info "上传前端文件到服务器..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    dist/ ${SERVER_USER}@${SERVER_IP}:${FRONTEND_PATH}/

log_success "前端文件上传完成"

# ========== 步骤4：上传后端文件 ==========
log_info "上传后端文件到服务器..."

# 创建服务器目录（如果不存在）
ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ${SERVER_PATH}"

# 上传后端代码
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '*.db' \
    --exclude '*.db-journal' \
    --exclude 'uploads' \
    server/dist/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/dist/

# 上传必要文件
rsync -avz server/package*.json ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
rsync -avz server/prisma/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/prisma/
scp $ENV_FILE ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/.env

# 上传Nginx配置
log_info "生成并上传Nginx配置..."

# 根据环境生成不同的Nginx配置
cat > /tmp/nginx-${ENV}.conf << EOF
# Nginx配置 - ${ENV} 环境

server {
    listen 80;
    server_name ${ENV}.yourdomain.com _;

    root ${FRONTEND_PATH};
    index index.html;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # API请求代理到后端
    location /api/ {
        proxy_pass http://localhost:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:3002/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # SPA路由支持
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # 安全头设置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # 错误页面
    error_page 404 /index.html;
    error_page 500 502 503 504 /index.html;

    # 最大上传文件大小
    client_max_body_size 10M;
}
EOF

scp /tmp/nginx-${ENV}.conf ${SERVER_USER}@${SERVER_IP}:/tmp/

log_success "后端文件上传完成"

# ========== 步骤5：服务器端操作 ==========
log_info "在服务器上安装依赖并重启服务..."

ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
set -e

echo "📦 安装后端依赖..."
cd ${SERVER_PATH}
npm install --production

echo "🗄️  同步数据库..."
npx prisma generate
npx prisma db push --accept-data-loss

echo "🔧 配置Nginx..."
if [ ! -f /etc/nginx/sites-available/${NGINX_CONFIG_NAME} ]; then
    echo "  创建新的Nginx配置..."
    sudo cp /tmp/nginx-${ENV}.conf /etc/nginx/sites-available/${NGINX_CONFIG_NAME}
    sudo ln -sf /etc/nginx/sites-available/${NGINX_CONFIG_NAME} /etc/nginx/sites-enabled/${NGINX_CONFIG_NAME}
    sudo nginx -t && sudo systemctl reload nginx
    echo "  ✅ Nginx配置已创建"
else
    echo "  更新Nginx配置..."
    sudo cp /tmp/nginx-${ENV}.conf /etc/nginx/sites-available/${NGINX_CONFIG_NAME}
    sudo nginx -t && sudo systemctl reload nginx
    echo "  ✅ Nginx配置已更新"
fi

echo "🔄 重启后端服务..."
pm2 delete ${PM2_APP_NAME} 2>/dev/null || true
pm2 start dist/index.js --name ${PM2_APP_NAME}
pm2 save

echo "📊 查看服务状态..."
pm2 status

echo "🧪 测试API..."
sleep 2
curl -s http://localhost:3002/health || echo "⚠️  健康检查失败"

echo "✅ 服务器操作完成！"
ENDSSH

log_success "服务器操作完成"

# ========== 步骤6：验证部署 ==========
log_info "验证部署结果..."

# 测试前端
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${SERVER_IP}/)
if [ "$HTTP_CODE" = "200" ]; then
    log_success "前端部署成功 (HTTP $HTTP_CODE)"
else
    log_warning "前端响应异常 (HTTP $HTTP_CODE)"
fi

# 测试后端API
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${SERVER_IP}/api/status)
if [ "$API_CODE" = "200" ]; then
    log_success "后端API部署成功 (HTTP $API_CODE)"
else
    log_warning "后端API响应异常 (HTTP $API_CODE)"
fi

# ========== 完成 ==========
echo ""
log_success "========================================="
ENV_UPPER=$(echo "$ENV" | tr '[:lower:]' '[:upper:]')
log_env "🎉 ${ENV_UPPER} 环境部署完成！"
log_success "========================================="
echo ""
log_info "访问地址: http://${SERVER_IP}"
log_info "后端API: http://${SERVER_IP}/api"
log_info "PM2应用名: ${PM2_APP_NAME}"
echo ""
log_info "查看日志："
echo "  ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs ${PM2_APP_NAME} --lines 50'"
echo ""
log_info "管理服务："
echo "  ssh ${SERVER_USER}@${SERVER_IP} 'pm2 restart ${PM2_APP_NAME}'"
echo "  ssh ${SERVER_USER}@${SERVER_IP} 'pm2 stop ${PM2_APP_NAME}'"
echo "  ssh ${SERVER_USER}@${SERVER_IP} 'pm2 status'"
echo ""

