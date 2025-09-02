#!/bin/bash

# 数据库迁移脚本：从SQLite迁移到PostgreSQL
# 使用方法: ./scripts/migrate-to-postgres.sh

set -e

echo "🚀 开始数据库迁移到PostgreSQL..."

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 错误: DATABASE_URL环境变量未设置"
    exit 1
fi

echo "📋 当前配置:"
echo "  数据库URL: $DATABASE_URL"
echo "  Node环境: ${NODE_ENV:-development}"

# 备份现有SQLite数据（如果存在）
if [ -f "prisma/dev.db" ]; then
    echo "💾 备份现有SQLite数据库..."
    cp prisma/dev.db "prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ 备份完成"
fi

# 使用生产环境schema
echo "🔄 切换到PostgreSQL schema..."
if [ "$NODE_ENV" = "production" ]; then
    cp prisma/schema.production.prisma prisma/schema.prisma
else
    # 创建开发环境PostgreSQL schema
    sed 's/sqlite/postgresql/' prisma/schema.prisma > prisma/schema.tmp
    sed 's|file:./dev.db|env("DATABASE_URL")|' prisma/schema.tmp > prisma/schema.prisma
    rm prisma/schema.tmp
fi

# 生成Prisma客户端
echo "🔧 生成Prisma客户端..."
npx prisma generate

# 推送数据库schema到PostgreSQL
echo "📊 创建数据库表结构..."
npx prisma db push --force-reset

# 如果有SQLite数据，进行数据迁移
if [ -f "prisma/dev.db" ]; then
    echo "📋 迁移数据 (需要手动实现)..."
    echo "⚠️  注意: SQLite到PostgreSQL的数据迁移需要手动处理"
    echo "   1. 导出SQLite数据: sqlite3 prisma/dev.db .dump > data_export.sql"
    echo "   2. 清理SQL格式兼容PostgreSQL"
    echo "   3. 导入到PostgreSQL数据库"
fi

# 验证数据库连接
echo "🔍 验证数据库连接..."
if npx prisma db ping; then
    echo "✅ 数据库连接成功！"
else
    echo "❌ 数据库连接失败"
    exit 1
fi

echo "🎉 数据库迁移完成！"
echo ""
echo "📝 后续步骤："
echo "  1. 如果有旧数据需要迁移，请手动处理SQLite导出"
echo "  2. 更新环境变量确保指向PostgreSQL"
echo "  3. 重启应用服务"