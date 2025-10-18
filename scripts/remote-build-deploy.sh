#!/bin/bash
# 远程构建部署 - 在服务器上直接拉取代码并构建

SERVER="root@114.55.117.20"

echo "🚀 开始远程构建部署..."
echo ""

# 一次性SSH连接，执行所有操作
ssh -o "ServerAliveInterval=60" -o "ServerAliveCountMax=3" $SERVER 'bash -s' << 'ENDSSH'
set -e

echo "📍 当前位置: $(pwd)"
echo ""

# 1. 进入项目目录
cd /opt/wechat-editor
echo "✅ 进入项目目录: /opt/wechat-editor"

# 2. 拉取最新代码
echo "🔄 拉取最新代码..."
git fetch origin
git reset --hard origin/main
echo "✅ 代码已更新"
echo ""

# 3. 安装前端依赖
echo "📦 安装前端依赖..."
npm install
echo "✅ 前端依赖安装完成"
echo ""

# 4. 构建前端
echo "🔨 构建前端..."
npm run build
echo "✅ 前端构建完成"
echo ""

# 5. 部署前端文件
echo "📂 部署前端文件..."
rm -rf /var/www/html/*
cp -r dist/* /var/www/html/
echo "✅ 前端文件部署完成"
echo ""

# 6. 安装后端依赖
echo "📦 安装后端依赖..."
cd server
npm install
echo "✅ 后端依赖安装完成"
echo ""

# 7. 构建后端
echo "🔨 构建后端..."
npm run build
echo "✅ 后端构建完成"
echo ""

# 8. 数据库迁移
echo "🗄️  运行数据库迁移..."
npx prisma generate
npx prisma db push --accept-data-loss
echo "✅ 数据库迁移完成"
echo ""

# 9. 重启PM2服务
echo "🔄 重启PM2服务..."
pm2 restart wechat-editor
echo "✅ 服务重启完成"
echo ""

# 10. 查看服务状态
echo "📊 服务状态："
pm2 status
echo ""

# 11. 检查服务健康
echo "🏥 健康检查..."
sleep 2
if curl -f http://localhost:3002/api/auth/status > /dev/null 2>&1; then
    echo "✅ 后端服务正常"
else
    echo "⚠️  后端服务可能有问题，请检查日志"
    pm2 logs wechat-editor --lines 20
fi

echo ""
echo "🎉 远程部署完成！"
ENDSSH

echo ""
echo "✅ 所有操作已完成！"

