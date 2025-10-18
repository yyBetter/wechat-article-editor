# 🌍 多环境配置指南

## 环境说明

本项目支持三个环境：

| 环境 | 用途 | 数据库 | 服务器目录 | PM2应用名 |
|------|------|--------|-----------|----------|
| **development** | 本地开发 | `dev.db` | 本地 | - |
| **staging** | 测试环境 | `staging.db` | `/opt/wechat-editor-staging` | `wechat-editor-staging` |
| **production** | 生产环境 | `production.db` | `/opt/wechat-editor` | `wechat-editor` |

## 🚀 快速开始

### 1. 创建环境配置文件

```bash
# 本地开发环境
cp .env.example .env.development

# 测试环境
cp .env.example .env.staging

# 生产环境
cp .env.example .env.production
```

### 2. 配置各环境参数

#### 📝 开发环境 (`.env.development`)
```bash
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3002
PORT=3002
DATABASE_URL=file:./dev.db
CORS_ORIGIN=http://localhost:3001
JWT_SECRET=dev-secret-key-change-in-production
LOG_LEVEL=debug
```

#### 🧪 测试环境 (`.env.staging`)
```bash
NODE_ENV=staging
VITE_API_BASE_URL=
PORT=3002
DATABASE_URL=file:./staging.db
CORS_ORIGIN=http://staging.yourdomain.com,http://localhost:3001
JWT_SECRET=staging-secret-key-please-change-me
LOG_LEVEL=info
```

#### 🏭 生产环境 (`.env.production`)
```bash
NODE_ENV=production
VITE_API_BASE_URL=
PORT=3002
DATABASE_URL=file:./production.db
CORS_ORIGIN=http://healthism.top,https://healthism.top
JWT_SECRET=PLEASE-CHANGE-THIS-TO-A-STRONG-SECRET
LOG_LEVEL=warn
```

⚠️ **重要**：生产环境的 `JWT_SECRET` 必须修改为强密码！

## 📦 部署流程

### 部署到测试环境
```bash
./deploy-multi-env.sh staging
```

### 部署到生产环境
```bash
./deploy-multi-env.sh production
```

部署脚本会自动：
1. ✅ 构建前端和后端
2. ✅ 使用对应环境的配置文件
3. ✅ 上传到不同的服务器目录
4. ✅ 使用独立的数据库文件
5. ✅ 配置独立的PM2进程
6. ✅ 配置独立的Nginx配置

## 🗂️ 数据隔离

### 数据库隔离
- **测试环境**: `/opt/wechat-editor-staging/prisma/staging.db`
- **生产环境**: `/opt/wechat-editor/prisma/production.db`

### 文件上传隔离
- **测试环境**: `/opt/wechat-editor-staging/uploads/`
- **生产环境**: `/opt/wechat-editor/uploads/`

### 前端文件隔离
- **测试环境**: `/var/www/staging/`
- **生产环境**: `/var/www/html/`

## 🔄 环境切换

### 本地切换环境
```bash
# 使用开发环境
cp .env.development .env
npm run dev

# 使用测试环境（本地模拟）
cp .env.staging .env
npm run dev
```

## 📊 服务管理

### 查看所有环境的服务状态
```bash
ssh root@47.55.117.20 'pm2 status'
```

输出示例：
```
┌────┬──────────────────────────┬─────────┐
│ id │ name                     │ status  │
├────┼──────────────────────────┼─────────┤
│ 0  │ wechat-editor            │ online  │  ← 生产环境
│ 1  │ wechat-editor-staging    │ online  │  ← 测试环境
└────┴──────────────────────────┴─────────┘
```

### 管理测试环境
```bash
# 查看测试环境日志
ssh root@47.55.117.20 'pm2 logs wechat-editor-staging'

# 重启测试环境
ssh root@47.55.117.20 'pm2 restart wechat-editor-staging'

# 停止测试环境
ssh root@47.55.117.20 'pm2 stop wechat-editor-staging'
```

### 管理生产环境
```bash
# 查看生产环境日志
ssh root@47.55.117.20 'pm2 logs wechat-editor'

# 重启生产环境
ssh root@47.55.117.20 'pm2 restart wechat-editor'
```

## 🧪 测试流程建议

### 标准发布流程

1. **本地开发** → 在 `development` 环境完成功能开发
2. **部署测试** → 部署到 `staging` 环境进行测试
3. **验证功能** → 在测试环境验证所有功能
4. **部署生产** → 确认无误后部署到 `production` 环境

```bash
# 步骤1：本地开发
npm run dev

# 步骤2：部署到测试环境
./deploy-multi-env.sh staging

# 步骤3：在浏览器测试
# 访问 http://47.55.117.20 (测试环境)

# 步骤4：确认无误后部署到生产
./deploy-multi-env.sh production
```

## 🔐 安全建议

### 1. JWT密钥管理
```bash
# 生成强密钥（推荐）
openssl rand -base64 32

# 或使用UUID
uuidgen
```

将生成的密钥填入对应环境的 `JWT_SECRET`

### 2. 环境文件安全
- ✅ 不要提交 `.env.*` 文件到Git
- ✅ 使用不同的JWT密钥
- ✅ 生产环境使用强密码
- ✅ 定期更换密钥

### 3. 数据库备份
```bash
# 备份生产数据库
ssh root@47.55.117.20 'cd /opt/wechat-editor/prisma && tar -czf production-backup-$(date +%Y%m%d).tar.gz production.db'

# 下载备份
scp root@47.55.117.20:/opt/wechat-editor/prisma/production-backup-*.tar.gz ./backups/
```

## 🎯 常见问题

### Q1: 如何在同一台服务器运行两个环境？

A: 使用不同的端口和目录：
- 测试环境：`/opt/wechat-editor-staging` + 端口 3002
- 生产环境：`/opt/wechat-editor` + 端口 3002（可以相同，因为目录隔离）

### Q2: 如何访问不同环境？

A: 配置不同的域名或子域名：
- 测试：`http://staging.yourdomain.com` 或 `http://47.55.117.20:8080`
- 生产：`http://yourdomain.com` 或 `http://47.55.117.20`

### Q3: 测试环境的数据会影响生产环境吗？

A: **不会！** 两个环境：
- 使用不同的数据库文件
- 使用不同的上传目录
- 完全隔离，互不影响

### Q4: 如何从测试环境复制数据到生产环境？

```bash
# SSH到服务器
ssh root@47.55.117.20

# 备份生产数据库（重要！）
cp /opt/wechat-editor/prisma/production.db /opt/wechat-editor/prisma/production.db.backup

# 复制测试数据到生产（谨慎操作！）
cp /opt/wechat-editor-staging/prisma/staging.db /opt/wechat-editor/prisma/production.db

# 重启生产服务
pm2 restart wechat-editor
```

## 📝 配置检查清单

部署前检查：

- [ ] 已创建对应环境的 `.env` 文件
- [ ] JWT_SECRET 已修改为强密码（生产环境）
- [ ] CORS_ORIGIN 配置正确
- [ ] 数据库路径正确
- [ ] 服务器有足够的磁盘空间
- [ ] 已备份生产数据库（如果存在）

## 🆘 故障恢复

### 回滚到上一个版本
```bash
# 查看PM2启动的进程
ssh root@47.55.117.20 'pm2 list'

# 查看应用日志
ssh root@47.55.117.20 'pm2 logs wechat-editor --lines 100'

# 如果需要回滚，恢复数据库备份
ssh root@47.55.117.20 'cd /opt/wechat-editor/prisma && cp production.db.backup production.db && pm2 restart wechat-editor'
```

## 📞 技术支持

遇到问题？检查：
1. PM2日志：`pm2 logs <app-name>`
2. Nginx日志：`tail -f /var/log/nginx/error.log`
3. 数据库文件权限：`ls -la prisma/*.db`
4. 环境变量加载：检查 `.env` 文件是否存在

