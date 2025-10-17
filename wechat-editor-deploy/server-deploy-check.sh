#!/bin/bash
set -e

echo "🔍 服务器部署后验证..."

# 检查必要文件
echo "📁 检查部署文件完整性..."
if [[ ! -d "server/dist" ]]; then
    echo "❌ 后端构建文件缺失"
    exit 1
fi

if [[ ! -d "dist" ]]; then
    echo "❌ 前端构建文件缺失"  
    exit 1
fi

if [[ ! -f "server/package.json" ]]; then
    echo "❌ 后端package.json缺失"
    exit 1
fi

echo "✅ 部署文件完整性检查通过"

# 检查依赖安装
echo "📦 安装生产依赖..."
cd server
npm ci --production --silent
echo "✅ 生产依赖安装成功"

# 数据库初始化检查
echo "🗃️ 检查数据库配置..."
if ! npx prisma generate --silent; then
    echo "❌ Prisma client生成失败"
    exit 1
fi
echo "✅ 数据库配置检查通过"

cd ..
echo "🎉 服务器端验证通过！"
