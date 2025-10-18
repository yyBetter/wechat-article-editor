#!/bin/bash
# 这些命令直接在服务器上执行
# 已经SSH登录后，复制粘贴以下内容

set -e

echo "🚀 开始部署..."
echo ""

# 1. 进入项目目录
cd /opt/wechat-editor
echo "✅ 当前目录: $(pwd)"
echo ""

# 2. 拉取最新代码
echo "📥 拉取最新代码..."
git fetch origin
git reset --hard origin/main
echo "✅ 代码已更新到最新版本"
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
echo "📂 部署前端到 /var/www/html ..."
rm -rf /var/www/html/*
cp -r dist/* /var/www/html/
echo "✅ 前端文件部署完成"
echo ""

# 6. 进入后端目录
cd server
echo "📍 进入后端目录"
echo ""

# 7. 安装后端依赖
echo "📦 安装后端依赖..."
npm install
echo "✅ 后端依赖安装完成"
echo ""

# 8. 构建后端
echo "🔨 构建后端..."
npm run build
echo "✅ 后端构建完成"
echo ""

# 9. 数据库迁移
echo "🗄️  运行数据库迁移..."
npx prisma generate
npx prisma db push --accept-data-loss
echo "✅ 数据库迁移完成"
echo ""

# 10. 重启PM2服务
echo "🔄 重启PM2服务..."
pm2 restart wechat-editor
echo "✅ 服务重启完成"
echo ""

# 11. 查看服务状态
echo "📊 服务状态："
pm2 status
echo ""

# 12. 查看最近日志
echo "📝 最近日志："
pm2 logs wechat-editor --lines 10 --nostream
echo ""

echo "🎉 部署完成！"
echo ""
echo "🌐 访问地址: http://114.55.117.20"

