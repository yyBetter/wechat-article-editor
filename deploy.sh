#!/bin/bash

# 🚀 一键部署脚本 - 微信公众号排版工具
# 作者：AI Assistant
# 用法：./deploy.sh

set -e  # 遇到错误立即退出

# ========== 配置区域 ==========
SERVER_IP="47.55.117.20"
SERVER_USER="root"
SERVER_PATH="/opt/wechat-editor"
FRONTEND_PATH="/var/www/html"

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

# ========== 步骤1：构建前端 ==========
log_info "开始构建前端..."
npm run build

if [ ! -d "dist" ]; then
    log_error "前端构建失败：dist目录不存在"
    exit 1
fi
log_success "前端构建完成"

# ========== 步骤2：构建后端 ==========
log_info "开始构建后端..."
cd server
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
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude 'dev.db' \
    --exclude 'dev.db-journal' \
    --exclude 'uploads' \
    server/dist/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/dist/

# 上传 package.json 和 prisma 目录
rsync -avz server/package*.json ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
rsync -avz server/prisma/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/prisma/

# 上传Nginx配置
log_info "上传Nginx配置..."
scp nginx-server.conf ${SERVER_USER}@${SERVER_IP}:/tmp/nginx-wechat-editor.conf

log_success "后端文件上传完成"

# ========== 步骤5：服务器端操作 ==========
log_info "在服务器上安装依赖并重启服务..."

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

echo "📦 安装后端依赖..."
cd /opt/wechat-editor
npm install --production

echo "🗄️  同步数据库..."
npx prisma generate
npx prisma db push --accept-data-loss

echo "🔧 配置Nginx..."
# 检查Nginx配置是否需要更新
if [ ! -f /etc/nginx/sites-available/wechat-editor ]; then
    echo "  创建新的Nginx配置..."
    sudo cp /tmp/nginx-wechat-editor.conf /etc/nginx/sites-available/wechat-editor
    sudo ln -sf /etc/nginx/sites-available/wechat-editor /etc/nginx/sites-enabled/wechat-editor
    sudo nginx -t && sudo systemctl reload nginx
    echo "  ✅ Nginx配置已更新"
else
    echo "  Nginx配置已存在，跳过"
fi

echo "🔄 重启后端服务..."
pm2 restart wechat-editor || pm2 start dist/index.js --name wechat-editor

echo "📊 查看服务状态..."
pm2 status

echo "🧪 测试API..."
sleep 2
curl -s http://localhost:3002/health || echo "⚠️  健康检查失败"

echo "✅ 部署完成！"
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
log_success "🎉 部署完成！"
log_success "========================================="
echo ""
log_info "前端地址: http://${SERVER_IP}"
log_info "后端API: http://${SERVER_IP}/api"
echo ""
log_info "查看服务器日志："
echo "  ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs wechat-editor --lines 50'"
echo ""

