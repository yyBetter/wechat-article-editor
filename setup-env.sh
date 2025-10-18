#!/bin/bash

# 🔧 环境配置初始化脚本
# 自动创建各环境的配置文件

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 初始化环境配置...${NC}"
echo ""

# ========== 生成JWT密钥 ==========
echo -e "${BLUE}📝 生成JWT密钥...${NC}"
DEV_SECRET="dev-secret-$(openssl rand -hex 16)"
STAGING_SECRET="staging-secret-$(openssl rand -hex 16)"
PROD_SECRET="prod-secret-$(openssl rand -hex 32)"

# ========== 创建开发环境配置 ==========
cat > .env.development << EOF
# 开发环境配置
NODE_ENV=development

# 前端配置
VITE_API_BASE_URL=http://localhost:3002

# 后端配置
PORT=3002
DATABASE_URL=file:./dev.db

# CORS配置
CORS_ORIGIN=http://localhost:3001

# JWT配置
JWT_SECRET=${DEV_SECRET}

# 日志级别
LOG_LEVEL=debug

# AI配置（可选）
DEEPSEEK_API_KEY=your-deepseek-api-key-here
EOF

echo -e "${GREEN}✅ 已创建 .env.development${NC}"

# ========== 创建测试环境配置 ==========
cat > .env.staging << EOF
# 测试环境配置
NODE_ENV=staging

# 前端配置（留空使用相对路径，通过Nginx代理）
VITE_API_BASE_URL=

# 后端配置
PORT=3002
DATABASE_URL=file:./staging.db

# CORS配置
CORS_ORIGIN=http://staging.yourdomain.com,http://localhost:3001

# JWT配置
JWT_SECRET=${STAGING_SECRET}

# 日志级别
LOG_LEVEL=info

# AI配置（可选）
DEEPSEEK_API_KEY=your-deepseek-api-key-here
EOF

echo -e "${GREEN}✅ 已创建 .env.staging${NC}"

# ========== 创建生产环境配置 ==========
cat > .env.production << EOF
# 生产环境配置
NODE_ENV=production

# 前端配置（留空使用相对路径，通过Nginx代理）
VITE_API_BASE_URL=

# 后端配置
PORT=3002
DATABASE_URL=file:./production.db

# CORS配置（只允许生产域名）
CORS_ORIGIN=http://healthism.top,https://healthism.top

# JWT配置
JWT_SECRET=${PROD_SECRET}

# 日志级别
LOG_LEVEL=warn

# AI配置（可选）
DEEPSEEK_API_KEY=your-deepseek-api-key-here
EOF

echo -e "${GREEN}✅ 已创建 .env.production${NC}"

# ========== 创建本地开发用的.env ==========
cp .env.development .env
echo -e "${GREEN}✅ 已创建 .env (默认使用开发环境配置)${NC}"

# ========== 复制到server目录 ==========
cp .env.development server/.env
echo -e "${GREEN}✅ 已复制配置到 server/.env${NC}"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}🎉 环境配置初始化完成！${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}📋 已创建的文件：${NC}"
echo "  - .env.development  (本地开发)"
echo "  - .env.staging      (测试环境)"
echo "  - .env.production   (生产环境)"
echo "  - .env              (当前环境 = development)"
echo "  - server/.env       (后端环境 = development)"
echo ""
echo -e "${YELLOW}⚠️  重要提示：${NC}"
echo "  1. 如果使用AI功能，请在各环境配置文件中填入 DEEPSEEK_API_KEY"
echo "  2. 生产环境的JWT密钥已自动生成，请妥善保管"
echo "  3. 环境配置文件不会被Git追踪（已在.gitignore中）"
echo ""
echo -e "${BLUE}🚀 下一步：${NC}"
echo "  本地开发: npm run dev"
echo "  部署测试: ./deploy-multi-env.sh staging"
echo "  部署生产: ./deploy-multi-env.sh production"
echo ""

