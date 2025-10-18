# 快速故障排查指南

## 🚨 常见错误及解决方案

### 错误1：429 Too Many Requests（速率限制）

**症状：**
```
POST http://localhost:3002/api/auth/login 429 (Too Many Requests)
登录尝试次数过多，请稍后重试
```

**原因：** 触发了后端的速率限制保护

**解决方案：**

#### 方法1：等待（推荐生产环境）
```bash
# 等待15分钟后重试
```

#### 方法2：重启本地后端（开发环境）
```bash
# 杀掉后端进程
lsof -ti:3002 | xargs kill -9

# 重启开发环境
./scripts/dev.sh
```

#### 方法3：使用开发脚本（最简单）
```bash
./scripts/stop-dev.sh
./scripts/dev.sh
```

**预防措施：**
- ✅ 开发环境已配置宽松限制（100次/15分钟）
- ✅ 生产环境保持严格限制（5次/15分钟）

---

### 错误2：无法登录（本地开发）

**症状：**
- 点击登录没反应
- 控制台显示网络错误
- `ERR_CONNECTION_REFUSED`

**排查步骤：**

1. **检查后端是否运行**
```bash
curl http://localhost:3002/health
```

2. **检查端口占用**
```bash
lsof -i:3002
```

3. **查看后端日志**
```bash
tail -f /tmp/wechat-editor-backend.log
```

**解决方案：**
```bash
./scripts/dev.sh  # 一键启动
```

---

### 错误3：端口被占用

**症状：**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**解决方案：**
```bash
# 清理端口
kill $(lsof -ti:3001)
kill $(lsof -ti:3002)

# 或使用停止脚本
./scripts/stop-dev.sh

# 重新启动
./scripts/dev.sh
```

---

### 错误4：前端白屏

**症状：**
- 浏览器打开是空白页
- 控制台有JavaScript错误

**解决方案：**

```bash
# 1. 清除缓存
rm -rf node_modules/.vite
rm -rf dist

# 2. 重新安装依赖（如需要）
npm install

# 3. 重启开发服务
./scripts/dev.sh
```

---

### 错误5：API请求404

**症状：**
```
GET http://localhost:3002/api/xxx 404 Not Found
```

**排查：**

1. 检查URL是否正确
2. 检查后端路由是否存在
3. 查看后端日志

```bash
curl http://localhost:3002/api/status  # 查看API状态
```

---

### 错误6：数据不同步

**症状：**
- 创建的文档消失了
- 数据显示不一致

**说明：** 这是正常的！

| 环境 | 存储位置 | 是否共享 |
|------|---------|---------|
| 本地开发 | IndexedDB（浏览器） | ❌ 独立 |
| 生产环境 | SQLite（服务器） | ❌ 独立 |

**解决方案：**
- 本地开发的数据只在浏览器中
- 生产环境的数据在服务器数据库中
- 两者不会同步

---

## 🔧 环境对比

### 本地开发环境

```
前端: http://localhost:3001
后端: http://localhost:3002
存储: IndexedDB（浏览器）
速率限制: 宽松（100次/15分钟）
```

### 生产环境

```
前端: http://114.55.117.20
后端: http://114.55.117.20/api
存储: SQLite（服务器数据库）
速率限制: 严格（5次/15分钟）
```

---

## 📝 检查清单

### 启动前检查

- [ ] Node.js 和 npm 已安装
- [ ] 项目依赖已安装（`npm install`）
- [ ] 后端依赖已安装（`cd server && npm install`）
- [ ] 端口 3001 和 3002 空闲

### 运行时检查

```bash
# 检查后端健康
curl http://localhost:3002/health

# 检查API状态
curl http://localhost:3002/api/status

# 检查前端
curl http://localhost:3001
```

### 登录测试

```bash
# 测试登录API
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@local.com","password":"password123"}'
```

---

## 🚀 快速命令

### 开发环境管理

```bash
# 启动开发环境
./scripts/dev.sh

# 停止开发环境
./scripts/stop-dev.sh

# 查看后端日志
tail -f /tmp/wechat-editor-backend.log

# 查看前端日志
tail -f /tmp/wechat-editor-frontend.log
```

### 端口管理

```bash
# 查看端口占用
lsof -i:3001
lsof -i:3002

# 杀死端口进程
kill $(lsof -ti:3001)
kill $(lsof -ti:3002)
```

### 数据管理

```bash
# 清除浏览器数据
# F12 → Application → Clear storage

# 查看服务器数据库
ssh root@114.55.117.20
cd /opt/wechat-editor/server
npx prisma studio
```

---

## 🎯 测试流程

### 完整测试流程

```bash
# 1. 启动环境
./scripts/dev.sh

# 2. 等待服务就绪（约10秒）
sleep 10

# 3. 打开浏览器
open http://localhost:3001

# 4. 登录测试
# 邮箱: dev@local.com
# 密码: password123

# 5. 测试功能
# - 创建文档
# - 编辑内容
# - 切换模板
# - 保存数据

# 6. 完成后停止
./scripts/stop-dev.sh
```

---

## 💡 调试技巧

### 1. 浏览器控制台

打开 F12，查看：
- **Console**: JavaScript错误
- **Network**: HTTP请求
- **Application**: 本地存储数据

### 2. 后端日志

```bash
# 实时查看日志
tail -f /tmp/wechat-editor-backend.log

# 查看最近50行
tail -50 /tmp/wechat-editor-backend.log
```

### 3. 网络请求

在浏览器 Network 标签中，查看：
- 请求URL是否正确
- 请求状态码
- 响应内容

### 4. API测试

使用 curl 测试API：

```bash
# 健康检查
curl http://localhost:3002/health

# 登录测试
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@local.com","password":"password123"}'

# 获取文档列表（需要token）
curl http://localhost:3002/api/documents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🆘 求助时提供的信息

如果遇到无法解决的问题，请提供：

1. **错误信息**（完整的错误堆栈）
2. **环境信息**
   - 本地还是生产？
   - Node.js版本：`node -v`
   - npm版本：`npm -v`
3. **后端日志**（最近50行）
4. **浏览器控制台截图**
5. **复现步骤**

---

## ✅ 问题解决了？

如果问题解决了，确保：

- [ ] 功能正常工作
- [ ] 没有控制台错误
- [ ] 数据能正常保存
- [ ] 提交代码：`git add . && git commit -m "fix: ...""`

然后继续愉快地开发！🎉

