#!/bin/bash
# 简单部署脚本 - 使用tar+scp避免rsync多连接问题

set -e

SERVER="root@114.55.117.20"
BACKEND_PATH="/opt/wechat-editor"
FRONTEND_PATH="/var/www/html"
PM2_APP="wechat-editor"

echo "🚀 开始简单部署到生产环境..."

# 1. 确认dist和server/dist存在
if [ ! -d "dist" ]; then
    echo "❌ dist目录不存在，请先构建前端"
    exit 1
fi

if [ ! -d "server/dist" ]; then
    echo "❌ server/dist目录不存在，请先构建后端"
    exit 1
fi

# 2. 打包前端文件
echo "📦 打包前端文件..."
cd dist
tar -czf ../frontend.tar.gz .
cd ..

# 3. 打包后端文件
echo "📦 打包后端文件..."
cd server
tar -czf ../backend.tar.gz dist package.json package-lock.json prisma
cd ..

# 4. 上传前端包（单一连接）
echo "📤 上传前端包..."
scp -o "ServerAliveInterval=60" frontend.tar.gz $SERVER:/tmp/

# 5. 上传后端包（单一连接）
echo "📤 上传后端包..."
scp -o "ServerAliveInterval=60" backend.tar.gz $SERVER:/tmp/

# 6. 上传环境文件
echo "📤 上传环境配置..."
scp -o "ServerAliveInterval=60" .env.production $SERVER:/tmp/

# 7. 在服务器上执行部署
echo "🔧 服务器端部署..."
ssh -o "ServerAliveInterval=60" $SERVER 'bash -s' << 'ENDSSH'
set -e

echo "  清空前端目录..."
rm -rf /var/www/html/*

echo "  解压前端文件..."
cd /var/www/html
tar -xzf /tmp/frontend.tar.gz

echo "  备份后端..."
cp -r /opt/wechat-editor/server/dist /opt/wechat-editor/server/dist.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

echo "  解压后端文件..."
cd /opt/wechat-editor/server
tar -xzf /tmp/backend.tar.gz

echo "  更新环境配置..."
cp /tmp/.env.production /opt/wechat-editor/server/.env

echo "  安装依赖..."
npm install --production

echo "  运行数据库迁移..."
npx prisma generate
npx prisma db push --accept-data-loss

echo "  重启PM2服务..."
pm2 restart wechat-editor

echo "  清理临时文件..."
rm -f /tmp/frontend.tar.gz /tmp/backend.tar.gz /tmp/.env.production

echo "✅ 服务器端部署完成！"
ENDSSH

# 8. 清理本地临时文件
echo "🧹 清理本地临时文件..."
rm -f frontend.tar.gz backend.tar.gz

echo ""
echo "🎉 部署完成！"
echo "📊 查看服务状态："
ssh -o "ServerAliveInterval=60" $SERVER "pm2 status"

