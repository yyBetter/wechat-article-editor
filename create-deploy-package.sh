#!/bin/bash
set -e

# 创建部署包脚本（改进版）
echo "🚀 创建生产级阿里云部署包..."
echo "================================"

# 跳过预检查，直接创建部署包（服务器上将验证）
echo "⚠️  跳过本地预检查，将在服务器上验证"

# 创建部署目录
DEPLOY_DIR="wechat-editor-deploy"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PACKAGE_NAME="wechat-editor-${TIMESTAMP}"

rm -rf $DEPLOY_DIR
mkdir $DEPLOY_DIR

# 复制必要的文件
echo "📦 复制项目文件..."

# 复制构建后的前端文件
if [[ -d "dist" ]]; then
    cp -r dist $DEPLOY_DIR/
    echo "✅ 前端构建文件已复制"
else
    echo "❌ 未找到前端构建文件，请先运行 npm run build"
    exit 1
fi

# 前端源文件（生产环境不需要，但保留以备调试）
cp package.json $DEPLOY_DIR/
cp package-lock.json $DEPLOY_DIR/
cp vite.config.ts $DEPLOY_DIR/
cp index.html $DEPLOY_DIR/

# 后端文件（包含构建后的dist目录）
mkdir -p $DEPLOY_DIR/server
cp -r server/dist $DEPLOY_DIR/server/ 2>/dev/null || {
    echo "❌ 未找到后端构建文件，请检查后端构建是否成功"
    exit 1
}
cp server/package.json $DEPLOY_DIR/server/
cp server/package-lock.json $DEPLOY_DIR/server/
cp -r server/prisma $DEPLOY_DIR/server/
mkdir -p $DEPLOY_DIR/server/uploads/images
echo "✅ 后端文件已复制"

# 部署配置文件
cp docker-compose.yml $DEPLOY_DIR/
cp Dockerfile $DEPLOY_DIR/
cp nginx.conf $DEPLOY_DIR/
cp aliyun-auto-deploy.sh $DEPLOY_DIR/
cp deploy-aliyun.md $DEPLOY_DIR/
cp PRODUCT_LAUNCH_GUIDE.md $DEPLOY_DIR/
cp PRODUCTION_READINESS_CHECKLIST.md $DEPLOY_DIR/

# 创建README
cat > $DEPLOY_DIR/DEPLOY_README.md << 'EOF'
# 阿里云部署包

## 快速部署步骤

1. **上传此文件夹到服务器**:
   ```bash
   scp -r wechat-editor-deploy root@your_server_ip:/opt/
   ```

2. **登录服务器并运行部署脚本**:
   ```bash
   ssh root@your_server_ip
   cd /opt/wechat-editor-deploy
   chmod +x aliyun-auto-deploy.sh
   ./aliyun-auto-deploy.sh
   ```

3. **按提示输入**:
   - 域名 (可选)
   - 管理员邮箱
   - 是否安装SSL证书

4. **等待部署完成** (约5-10分钟)

## 文件说明

- `aliyun-auto-deploy.sh` - 自动部署脚本
- `deploy-aliyun.md` - 详细部署指南
- `server/` - 后端代码
- `src/` - 前端代码
- `docker-compose.yml` - Docker服务配置
- `nginx.conf` - Nginx配置

## 注意事项

1. 确保服务器已重置root密码
2. 确保服务器安全组开放80、443端口
3. 如有域名，确保DNS解析已配置
4. 记录好部署过程中生成的数据库密码

EOF

# 复制部署脚本和预检查脚本
cp deploy-preflight.sh $DEPLOY_DIR/ 2>/dev/null || echo "⚠️  deploy-preflight.sh未找到"
cp aliyun-auto-deploy.sh $DEPLOY_DIR/ 2>/dev/null || echo "⚠️  aliyun-auto-deploy.sh未找到"

# 创建服务器端验证脚本
cat > $DEPLOY_DIR/server-deploy-check.sh << 'EOF'
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
EOF

chmod +x $DEPLOY_DIR/server-deploy-check.sh

# 打包
echo ""
echo "📦 创建部署包..."
PACKAGE_FILE="${PACKAGE_NAME}.tar.gz"
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='src' \
    --exclude='*.log' \
    -czf $PACKAGE_FILE $DEPLOY_DIR

echo ""
echo "🎉 生产级部署包创建完成！"
echo "================================"
echo "📂 包文件: $(pwd)/$PACKAGE_FILE"
echo "📊 包大小: $(du -h $PACKAGE_FILE | cut -f1)"
echo "📅 创建时间: $(date)"
echo ""
echo "🚀 部署步骤:"
echo "1. 上传包到服务器: scp $PACKAGE_FILE root@YOUR_SERVER:/opt/"
echo "2. 登录服务器: ssh root@YOUR_SERVER"
echo "3. 解压: cd /opt && tar -xzf $PACKAGE_FILE"
echo "4. 运行部署: cd $DEPLOY_DIR && chmod +x *.sh && ./aliyun-auto-deploy.sh"
echo ""
echo "⚠️  部署前确保:"
echo "- 服务器安全组开放80/443端口"
echo "- 域名DNS已正确解析（如有）"
echo "- 备份现有数据（如有）"