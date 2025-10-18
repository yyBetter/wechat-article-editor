# 🎯 部署技巧和常见问题

## SSH连接频繁失败

### 问题表现
```bash
Connection closed by 114.55.117.20 port 22
```

### 原因
短时间内SSH连接次数过多，服务器安全策略临时封禁IP

### 解决方案

#### 1. 等待解封（10-20分钟）
```bash
# 等待后测试
ssh root@114.55.117.20 'date'

# 连接成功后部署
./deploy-multi-env.sh staging
```

#### 2. 配置SSH免密登录（一劳永逸）
```bash
# 运行配置脚本（只需一次）
./setup-ssh-key.sh

# 之后部署无需密码
./deploy-multi-env.sh staging
```

#### 3. 保持SSH连接
```bash
# 在一个Terminal窗口保持连接
ssh root@114.55.117.20

# 在另一个窗口执行部署
# 这样可以减少新建连接的次数
```

---

## 部署流程优化建议

### 标准部署流程

```bash
# 1. 本地开发和测试
npm run dev

# 2. 提交代码
git add .
git commit -m "feat: 新功能"

# 3. 等待确保SSH连接正常（如果之前有频繁连接）
# 可以喝杯咖啡休息10分钟 ☕

# 4. 部署到测试环境
./deploy-multi-env.sh staging

# 5. 在浏览器测试 staging 环境

# 6. 测试通过后部署到生产
./deploy-multi-env.sh production
```

### 避免SSH封禁的技巧

1. **不要频繁测试SSH**
   - ❌ 不要连续多次执行 ssh 命令
   - ✅ 测试失败后等待几分钟

2. **使用SSH密钥**
   - ❌ 每次输入密码（慢且容易触发封禁）
   - ✅ 配置密钥免密登录

3. **批量操作**
   - ❌ 分多次上传文件
   - ✅ 使用部署脚本一次完成

4. **保持连接**
   - ✅ 长时间部署时保持一个SSH连接

---

## 部署失败快速排查

### 1. SSH连接失败
```bash
# 检查网络
ping 114.55.117.20

# 检查SSH端口
telnet 114.55.117.20 22

# 等待10分钟后重试
```

### 2. 构建失败
```bash
# 清理后重新构建
rm -rf dist/ server/dist/
npm run build
cd server && npm run build
```

### 3. 服务启动失败
```bash
# SSH到服务器查看日志
ssh root@114.55.117.20 'pm2 logs wechat-editor --lines 50'
```

### 4. Nginx配置问题
```bash
# 检查Nginx配置
ssh root@114.55.117.20 'sudo nginx -t'

# 重启Nginx
ssh root@114.55.117.20 'sudo systemctl reload nginx'
```

---

## 最佳实践

### 1. 部署前检查清单

- [ ] 本地代码已提交到Git
- [ ] 已等待足够时间（如果之前有SSH连接失败）
- [ ] 已配置SSH密钥（推荐）
- [ ] 已备份生产数据库（如果部署生产环境）

### 2. 部署时机

✅ **适合部署的时候：**
- 功能已在本地充分测试
- 非业务高峰期
- 有时间监控部署结果

❌ **不适合部署的时候：**
- 刚刚才SSH连接失败（等10分钟）
- 业务高峰期（生产环境）
- 晚上睡觉前（无法监控）

### 3. 部署后验证

```bash
# 1. 检查服务状态
ssh root@114.55.117.20 'pm2 status'

# 2. 检查日志
ssh root@114.55.117.20 'pm2 logs wechat-editor --lines 20'

# 3. 测试API
curl http://114.55.117.20/api/status

# 4. 浏览器测试
# 访问 http://114.55.117.20
```

---

## 应急处理

### 如果部署失败需要回滚

```bash
# 1. SSH到服务器
ssh root@114.55.117.20

# 2. 恢复数据库备份（如果有）
cd /opt/wechat-editor/prisma
cp production.db.backup production.db

# 3. 重启服务
pm2 restart wechat-editor

# 4. 检查状态
pm2 status
pm2 logs wechat-editor
```

### 完全重新部署

```bash
# 1. 停止服务
ssh root@114.55.117.20 'pm2 delete wechat-editor'

# 2. 清理旧文件
ssh root@114.55.117.20 'rm -rf /opt/wechat-editor/dist'

# 3. 重新部署
./deploy-multi-env.sh production
```

---

## 监控和日志

### 实时监控
```bash
# 监控所有PM2进程
ssh root@114.55.117.20 'pm2 monit'

# 实时查看日志
ssh root@114.55.117.20 'pm2 logs wechat-editor'

# 查看系统资源
ssh root@114.55.117.20 'htop'
```

### 日志位置
- PM2日志: `/root/.pm2/logs/`
- Nginx日志: `/var/log/nginx/`
- 应用日志: 在PM2日志中

---

## 性能优化建议

1. **启用Nginx缓存**
2. **配置CDN加速静态资源**
3. **数据库定期清理**
4. **定期重启PM2进程**
5. **监控磁盘空间**

---

## 联系和反馈

遇到问题？查看：
- [QUICK_START.md](./QUICK_START.md) - 快速开始
- [MULTI_ENV_GUIDE.md](./MULTI_ENV_GUIDE.md) - 完整指南
- [ENV_SETUP.md](./ENV_SETUP.md) - 环境配置

或检查：
- PM2日志
- Nginx错误日志
- 浏览器控制台

