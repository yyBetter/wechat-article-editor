# ⚡ 快速开始 - 多环境部署

## 🎯 三步完成部署

```bash
# 步骤1: 初始化环境配置（仅首次需要）
./setup-env.sh

# 步骤2: 部署到测试环境
./deploy-multi-env.sh staging

# 步骤3: 测试通过后部署到生产
./deploy-multi-env.sh production
```

就这么简单！🚀

---

## 📋 环境对比

| 环境 | 命令 | 数据库 | 服务器目录 | PM2应用名 |
|------|------|--------|-----------|----------|
| **本地开发** | `npm run dev` | `dev.db` | 本地 | - |
| **测试环境** | `./deploy-multi-env.sh staging` | `staging.db` | `/opt/wechat-editor-staging` | `wechat-editor-staging` |
| **生产环境** | `./deploy-multi-env.sh production` | `production.db` | `/opt/wechat-editor` | `wechat-editor` |

---

## 🔥 核心优势

### 1. 数据完全隔离
✅ 测试和生产使用**不同的数据库**  
✅ 测试数据**不会影响**生产环境  
✅ 可以放心在测试环境进行任何操作  

### 2. 一键部署
✅ 自动构建、上传、部署、重启  
✅ 自动配置Nginx、数据库迁移  
✅ 自动验证部署结果  

### 3. 安全发布
✅ 测试环境充分验证  
✅ 生产环境二次确认  
✅ 完整的备份策略  

---

## 🚀 标准工作流

```bash
# 1. 本地开发
npm run dev
# 在 http://localhost:3001 开发功能

# 2. 提交代码
git add .
git commit -m "feat: 新功能"

# 3. 部署到测试环境
./deploy-multi-env.sh staging
# 在 http://114.55.117.20 测试

# 4. 测试通过，部署到生产
./deploy-multi-env.sh production
# 生产环境上线
```

---

## 🛠️ 常用命令

### 查看所有环境状态
```bash
ssh root@114.55.117.20 'pm2 status'
```

### 查看测试环境日志
```bash
ssh root@114.55.117.20 'pm2 logs wechat-editor-staging --lines 50'
```

### 查看生产环境日志
```bash
ssh root@114.55.117.20 'pm2 logs wechat-editor --lines 50'
```

### 重启服务
```bash
# 重启测试环境
ssh root@114.55.117.20 'pm2 restart wechat-editor-staging'

# 重启生产环境
ssh root@114.55.117.20 'pm2 restart wechat-editor'
```

---

## 💾 备份生产数据

```bash
# 备份数据库
ssh root@114.55.117.20 'cd /opt/wechat-editor/prisma && tar -czf backup-$(date +%Y%m%d).tar.gz production.db'

# 下载备份到本地
mkdir -p backups
scp root@114.55.117.20:/opt/wechat-editor/prisma/backup-*.tar.gz backups/
```

---

## 🐛 常见问题

### 问题1: 部署后出现401错误
**原因**: Nginx配置未生效  
**解决**: `ssh root@114.55.117.20 'sudo systemctl reload nginx'`

### 问题2: 前端显示空白
**原因**: 浏览器缓存  
**解决**: 按 `Ctrl+Shift+R` (Mac: `Cmd+Shift+R`) 强制刷新

### 问题3: 数据库报错
**原因**: Schema不匹配  
**解决**: 
```bash
ssh root@114.55.117.20 'cd /opt/wechat-editor && npx prisma db push && pm2 restart wechat-editor'
```

---

## 📚 详细文档

- **[MULTI_ENV_GUIDE.md](./MULTI_ENV_GUIDE.md)** - 完整的多环境部署指南（推荐阅读）
- **[ENV_SETUP.md](./ENV_SETUP.md)** - 详细的环境配置说明
- **[DEPLOY_QUICK.md](./DEPLOY_QUICK.md)** - 单环境快速部署指南

---

## 🎯 最佳实践

### ✅ DO - 推荐做法

1. **先测试后生产** - 所有功能必须在staging验证通过后才能发布production
2. **定期备份** - 每周备份生产数据库
3. **使用独立密钥** - 每个环境使用不同的JWT_SECRET
4. **查看日志** - 部署后检查PM2日志确认无错误

### ❌ DON'T - 避免的做法

1. **直接修改生产** - 不要在生产服务器上直接修改代码
2. **跳过测试** - 不要跳过staging直接部署production
3. **共享数据库** - 不要让测试和生产共用数据库
4. **提交配置文件** - 不要将 `.env*` 文件提交到Git

---

## 🎉 总结

通过这套多环境方案：

- ✅ **本地开发快速迭代** - 实时热更新，开发体验好
- ✅ **测试环境充分验证** - 数据隔离，放心测试
- ✅ **生产环境安全稳定** - 二次确认，风险可控
- ✅ **部署流程标准化** - 一条命令，3分钟完成

**现在你可以放心地测试和发布了！** 🚀

有任何问题，查看 [MULTI_ENV_GUIDE.md](./MULTI_ENV_GUIDE.md) 获取详细帮助。

