#!/bin/bash

# 创建部署包脚本
echo "🚀 创建阿里云部署包..."

# 创建部署目录
DEPLOY_DIR="wechat-editor-deploy"
rm -rf $DEPLOY_DIR
mkdir $DEPLOY_DIR

# 复制必要的文件
echo "📦 复制项目文件..."

# 前端文件
cp -r src $DEPLOY_DIR/
cp -r public $DEPLOY_DIR/
cp package.json $DEPLOY_DIR/
cp package-lock.json $DEPLOY_DIR/
cp tsconfig.json $DEPLOY_DIR/
cp vite.config.ts $DEPLOY_DIR/
cp index.html $DEPLOY_DIR/
cp -r style $DEPLOY_DIR/ 2>/dev/null || true

# 后端文件
cp -r server $DEPLOY_DIR/

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

# 打包
echo "📦 打包文件..."
tar -czf wechat-editor-deploy.tar.gz $DEPLOY_DIR

echo "✅ 部署包创建完成！"
echo "📂 文件位置: $(pwd)/wechat-editor-deploy.tar.gz"
echo "📊 包大小: $(du -h wechat-editor-deploy.tar.gz | cut -f1)"
echo ""
echo "🚀 下一步:"
echo "1. 下载 wechat-editor-deploy.tar.gz"
echo "2. 上传到阿里云服务器"
echo "3. 解压并运行部署脚本"