# 🌍 多环境部署完全指南

## 一分钟快速开始

```bash
# 1. 初始化环境配置（首次运行）
./setup-env.sh

# 2. 部署到测试环境
./deploy-multi-env.sh staging

# 3. 测试通过后，部署到生产环境
./deploy-multi-env.sh production
```

就这么简单！✨

---

## 📖 详细说明

### 环境架构

本项目支持完整的**开发→测试→生产**三环境隔离：

```
┌─────────────────────────────────────────────────────────────┐
│                         本地开发                              │
│  Environment: development                                    │
│  Database: dev.db                                           │
│  API: http://localhost:3002                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓ 推送代码
┌─────────────────────────────────────────────────────────────┐
│                         测试环境                              │
│  Environment: staging                                        │
│  Server: /opt/wechat-editor-staging                         │
│  Database: staging.db                                       │
│  PM2: wechat-editor-staging                                 │
│  Frontend: /var/www/staging                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓ 测试通过
┌─────────────────────────────────────────────────────────────┐
│                         生产环境                              │
│  Environment: production                                     │
│  Server: /opt/wechat-editor                                 │
│  Database: production.db                                    │
│  PM2: wechat-editor                                         │
│  Frontend: /var/www/html                                    │
└─────────────────────────────────────────────────────────────┘
```

### 核心特性

✅ **完全数据隔离** - 测试和生产使用独立数据库  
✅ **独立进程管理** - PM2分别管理两个环境  
✅ **一键部署** - 自动化构建、上传、重启  
✅ **环境变量管理** - 每个环境独立配置  
✅ **零停机部署** - PM2优雅重启  

---

## 🚀 标准工作流程

### 阶段1: 本地开发

```bash
# 首次运行：初始化环境配置
./setup-env.sh

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3001` 进行开发

### 阶段2: 部署到测试环境

功能开发完成后，部署到测试环境进行验证：

```bash
./deploy-multi-env.sh staging
```

脚本会自动完成：
1. 构建前端（使用staging配置）
2. 构建后端（使用staging配置）
3. 上传到测试目录
4. 同步staging数据库
5. 重启staging服务
6. 验证部署结果

访问 `http://47.55.117.20` 进行测试

### 阶段3: 部署到生产环境

测试通过后，部署到生产环境：

```bash
./deploy-multi-env.sh production
```

⚠️ **注意**：部署生产环境时会要求二次确认！

---

## 📁 环境配置详解

### 配置文件说明

| 文件 | 用途 | Git追踪 |
|------|------|---------|
| `.env.development` | 本地开发配置 | ❌ 不追踪 |
| `.env.staging` | 测试环境配置 | ❌ 不追踪 |
| `.env.production` | 生产环境配置 | ❌ 不追踪 |
| `.env` | 当前使用的配置 | ❌ 不追踪 |

### 关键配置项

#### 1. VITE_API_BASE_URL
- **开发环境**: `http://localhost:3002` （直连后端）
- **测试/生产**: 留空 （通过Nginx代理）

#### 2. DATABASE_URL
- **开发**: `file:./dev.db`
- **测试**: `file:./staging.db`
- **生产**: `file:./production.db`

#### 3. JWT_SECRET
- 每个环境使用**不同的密钥**
- 生产环境密钥最强
- `setup-env.sh` 会自动生成

#### 4. CORS_ORIGIN
- **开发**: `http://localhost:3001`
- **测试**: `http://staging.yourdomain.com,http://localhost:3001`
- **生产**: `http://healthism.top,https://healthism.top`

---

## 🗂️ 服务器目录结构

```
/opt/
├── wechat-editor/              # 生产环境
│   ├── dist/                   # 后端代码
│   ├── prisma/
│   │   └── production.db       # 生产数据库 ⭐
│   ├── uploads/                # 上传文件
│   ├── package.json
│   └── .env                    # 生产配置
│
└── wechat-editor-staging/      # 测试环境
    ├── dist/
    ├── prisma/
    │   └── staging.db          # 测试数据库 ⭐
    ├── uploads/
    ├── package.json
    └── .env                    # 测试配置

/var/www/
├── html/                       # 生产前端 ⭐
│   ├── index.html
│   └── assets/
│
└── staging/                    # 测试前端 ⭐
    ├── index.html
    └── assets/
```

---

## 🔧 常用管理命令

### 查看所有环境状态

```bash
ssh root@47.55.117.20 'pm2 status'
```

### 测试环境管理

```bash
# 查看测试环境日志
ssh root@47.55.117.20 'pm2 logs wechat-editor-staging --lines 50'

# 重启测试环境
ssh root@47.55.117.20 'pm2 restart wechat-editor-staging'

# 停止测试环境
ssh root@47.55.117.20 'pm2 stop wechat-editor-staging'

# 查看测试数据库大小
ssh root@47.55.117.20 'ls -lh /opt/wechat-editor-staging/prisma/*.db'
```

### 生产环境管理

```bash
# 查看生产环境日志
ssh root@47.55.117.20 'pm2 logs wechat-editor --lines 50'

# 重启生产环境
ssh root@47.55.117.20 'pm2 restart wechat-editor'

# 查看生产数据库大小
ssh root@47.55.117.20 'ls -lh /opt/wechat-editor/prisma/*.db'
```

---

## 💾 数据管理

### 备份生产数据库

```bash
# SSH到服务器
ssh root@47.55.117.20

# 创建备份目录
mkdir -p /root/backups

# 备份数据库
cd /opt/wechat-editor/prisma
tar -czf /root/backups/prod-db-$(date +%Y%m%d-%H%M%S).tar.gz production.db

# 查看备份
ls -lh /root/backups/
```

### 下载备份到本地

```bash
# 在本地执行
mkdir -p backups
scp root@47.55.117.20:/root/backups/prod-db-*.tar.gz backups/
```

### 从测试环境复制数据到生产

```bash
ssh root@47.55.117.20 << 'EOF'
# ⚠️ 谨慎操作！先备份生产数据
cd /opt/wechat-editor/prisma
cp production.db production.db.backup-$(date +%Y%m%d)

# 复制测试数据到生产
cp /opt/wechat-editor-staging/prisma/staging.db production.db

# 重启生产服务
pm2 restart wechat-editor
EOF
```

---

## 🎯 最佳实践

### 1. 开发流程

```bash
# 本地开发
git checkout -b feature/new-feature
npm run dev
# 开发功能...
git commit -m "feat: 新功能"
git push

# 部署到测试环境
./deploy-multi-env.sh staging
# 在测试环境验证...

# 测试通过后部署到生产
git checkout main
git merge feature/new-feature
./deploy-multi-env.sh production
```

### 2. 配置管理

- ✅ 使用 `setup-env.sh` 初始化配置
- ✅ 不要提交 `.env*` 文件到Git
- ✅ 生产环境使用强JWT密钥
- ✅ 定期更换密钥

### 3. 数据安全

- ✅ 每周备份生产数据库
- ✅ 重大更新前手动备份
- ✅ 保留最近7天的备份
- ✅ 测试环境使用测试数据

### 4. 监控和日志

```bash
# 定时检查服务状态
watch -n 5 'ssh root@47.55.117.20 pm2 status'

# 实时查看生产日志
ssh root@47.55.117.20 'pm2 logs wechat-editor'

# 查看系统资源
ssh root@47.55.117.20 'pm2 monit'
```

---

## 🐛 故障排查

### 问题1: 部署后401错误

**原因**: Nginx没有正确代理API

**解决**:
```bash
ssh root@47.55.117.20
sudo nginx -t
sudo systemctl reload nginx
```

### 问题2: 数据库错误

**原因**: 数据库schema不匹配

**解决**:
```bash
ssh root@47.55.117.20
cd /opt/wechat-editor  # 或 /opt/wechat-editor-staging
npx prisma db push --accept-data-loss
pm2 restart wechat-editor  # 或 wechat-editor-staging
```

### 问题3: 服务无法启动

**原因**: 端口被占用或配置错误

**解决**:
```bash
ssh root@47.55.117.20

# 查看端口占用
netstat -tlnp | grep 3002

# 检查PM2日志
pm2 logs wechat-editor --lines 100

# 检查环境配置
cat /opt/wechat-editor/.env
```

### 问题4: 前端显示空白

**原因**: 浏览器缓存

**解决**: 按 `Ctrl+Shift+R` 强制刷新

---

## 📞 快速参考

### 一键部署
```bash
./deploy-multi-env.sh staging     # 测试环境
./deploy-multi-env.sh production  # 生产环境
```

### 常用命令
```bash
# 查看状态
ssh root@47.55.117.20 'pm2 status'

# 查看日志
ssh root@47.55.117.20 'pm2 logs <app-name>'

# 重启服务
ssh root@47.55.117.20 'pm2 restart <app-name>'

# 备份数据库
ssh root@47.55.117.20 'cd /opt/wechat-editor/prisma && tar -czf backup-$(date +%Y%m%d).tar.gz production.db'
```

### 应用名称
- 测试环境: `wechat-editor-staging`
- 生产环境: `wechat-editor`

---

## 📚 相关文档

- `ENV_SETUP.md` - 详细的环境配置说明
- `DEPLOY_QUICK.md` - 快速部署指南（单环境）
- `setup-env.sh` - 环境配置初始化脚本
- `deploy-multi-env.sh` - 多环境部署脚本

---

## ✨ 总结

通过这套多环境方案，你可以：

1. ✅ **本地开发** - 快速迭代，实时预览
2. ✅ **测试验证** - 在staging环境充分测试
3. ✅ **安全发布** - 生产环境数据隔离，风险可控
4. ✅ **快速回滚** - 保留备份，随时恢复
5. ✅ **团队协作** - 统一的部署流程

**现在部署只需一条命令，数据完全隔离，再也不用担心测试影响生产了！** 🎉

