# 本地开发测试指南

## 🚀 快速开始

### 方法1：使用一键启动脚本（推荐）

```bash
# 启动开发环境
./scripts/dev.sh

# 停止开发环境
./scripts/stop-dev.sh
```

### 方法2：手动启动

```bash
# 终端1：启动后端
cd server
npm run dev

# 终端2：启动前端
npm run dev
```

---

## 🧪 测试账号

脚本已经为你创建了测试账号：

```
邮箱: dev@local.com
密码: password123
```

---

## ✅ 验证环境

### 1. 检查服务状态

```bash
# 后端健康检查
curl http://localhost:3002/health

# API状态
curl http://localhost:3002/api/status
```

### 2. 测试登录API

```bash
# 登录测试
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@local.com","password":"password123"}'
```

应该返回：
```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "..."
  }
}
```

---

## 🌐 访问应用

打开浏览器访问：**http://localhost:3001**

### 第一次使用

1. 点击右上角 "登录"
2. 输入测试账号：
   - 邮箱：`dev@local.com`
   - 密码：`password123`
3. 登录成功后即可使用所有功能

### 浏览器控制台检查

按 `F12` 打开开发者工具，应该看到：

```javascript
[API Config] {
  hostname: "localhost",
  apiUrl: "http://localhost:3002/api",
  isDev: true,
  mode: "development"
}

[Storage Config] {
  mode: "local",  // ✅ 使用本地存储
  hostname: "localhost",
  serverBaseUrl: "http://localhost:3002/api"
}
```

---

## 🔧 功能测试清单

### ✅ 基础功能

- [ ] 用户登录
- [ ] 用户注册
- [ ] 创建新文档
- [ ] 编辑文档内容
- [ ] 保存文档
- [ ] 删除文档

### ✅ 编辑器功能

- [ ] Markdown编辑
- [ ] 实时预览
- [ ] 模板切换（简约文档、图文并茂等）
- [ ] 自定义品牌色
- [ ] 上传图片
- [ ] 插入分割线

### ✅ 高级功能

- [ ] 版本历史
- [ ] 导出数据
- [ ] 字数统计
- [ ] 大纲导航

---

## 🐛 常见问题排查

### 问题1：无法登录

**症状**：点击登录没反应或报错

**排查步骤**：

1. 打开浏览器控制台（F12），查看是否有错误
2. 检查Network标签，看请求是否发送到 `http://localhost:3002/api/auth/login`
3. 确认后端服务是否运行：
   ```bash
   curl http://localhost:3002/health
   ```

**解决方案**：

```bash
# 重启开发环境
./scripts/stop-dev.sh
./scripts/dev.sh
```

### 问题2：端口被占用

**症状**：启动时报错 `EADDRINUSE`

**解决方案**：

```bash
# 手动清理端口
kill $(lsof -ti:3001)
kill $(lsof -ti:3002)

# 或使用停止脚本
./scripts/stop-dev.sh
```

### 问题3：前端白屏

**症状**：浏览器打开是空白页

**排查步骤**：

1. 打开控制台，查看错误信息
2. 检查前端日志：
   ```bash
   tail -f /tmp/wechat-editor-frontend.log
   ```

**解决方案**：

```bash
# 清除缓存重启
rm -rf node_modules/.vite
./scripts/dev.sh
```

### 问题4：API请求404

**症状**：控制台显示 `404 Not Found`

**排查**：

1. 确认请求URL是否正确：`http://localhost:3002/api/xxx`
2. 检查后端日志：
   ```bash
   tail -f /tmp/wechat-editor-backend.log
   ```

**解决方案**：

```bash
# 确保后端正常运行
curl http://localhost:3002/api/status
```

### 问题5：数据不同步

**症状**：本地创建的文档在刷新后消失

**说明**：这是正常的！本地开发使用浏览器 IndexedDB 存储：

- **本地环境**：数据存在浏览器 IndexedDB
- **生产环境**：数据存在服务器数据库

**查看本地数据**：

1. F12 → Application/存储
2. IndexedDB → `WeChat_Editor_<用户ID>`
3. 展开查看 documents、versions、images

---

## 📊 性能测试

### API响应时间

```bash
# 测试登录性能
time curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@local.com","password":"password123"}' \
  -s > /dev/null

# 测试获取文档列表
time curl http://localhost:3002/api/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -s > /dev/null
```

### 前端加载时间

打开浏览器控制台 → Network → 刷新页面，查看：
- DOMContentLoaded
- Load 时间

---

## 🔄 开发工作流

### 典型的开发流程

```bash
# 1. 启动开发环境
./scripts/dev.sh

# 2. 在浏览器中测试功能
# 访问 http://localhost:3001

# 3. 修改代码
# 编辑器会自动热重载

# 4. 提交代码
git add .
git commit -m "feat: 新功能"
git push

# 5. 部署到生产环境
./quick-deploy-prod.sh

# 6. 停止本地环境
./scripts/stop-dev.sh
```

---

## 📝 查看日志

### 实时日志

```bash
# 后端日志
tail -f /tmp/wechat-editor-backend.log

# 前端日志
tail -f /tmp/wechat-editor-frontend.log
```

### 浏览器日志

F12 → Console 标签

---

## 🎯 环境对比

| 特性 | 本地开发 | 生产环境 |
|------|---------|---------|
| **前端地址** | http://localhost:3001 | http://114.55.117.20 |
| **后端地址** | http://localhost:3002 | http://114.55.117.20/api |
| **存储方式** | IndexedDB（浏览器） | SQLite（服务器） |
| **数据隔离** | ✅ 完全独立 | ✅ 完全独立 |
| **热重载** | ✅ 支持 | ❌ 需要重新构建 |
| **调试工具** | ✅ 完整 | ⚠️ 有限 |
| **适用场景** | 日常开发、功能测试 | 正式使用、演示 |

---

## 💡 开发技巧

### 1. 使用浏览器扩展

推荐安装：
- React DevTools
- Redux DevTools（如果使用）
- JSON Viewer

### 2. 快速切换环境

```bash
# 本地开发
export API_BASE_URL=http://localhost:3002

# 生产测试
export API_BASE_URL=http://114.55.117.20
```

### 3. 模拟生产环境

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview  # 端口 4173
```

### 4. 清除测试数据

```bash
# 清除浏览器数据
# F12 → Application → Clear storage → Clear site data

# 或者清除特定数据库
# F12 → Application → IndexedDB → 右键删除
```

---

## ✅ 准备发布检查清单

在部署到生产环境前，确保：

- [ ] 所有功能在本地测试通过
- [ ] 没有控制台错误
- [ ] 数据能正常保存和读取
- [ ] 登录/注册功能正常
- [ ] 图片上传功能正常
- [ ] 模板切换正常
- [ ] 代码已提交到Git
- [ ] 已运行 `npm run build` 无错误

通过检查后：

```bash
./quick-deploy-prod.sh
```

---

## 🎉 总结

**本地开发环境已经完全配置好！**

- ✅ 后端 API 正常运行
- ✅ 前端热重载工作正常
- ✅ 测试账号已创建
- ✅ 存储模式自动识别
- ✅ 日志和调试工具齐全

**现在可以开始愉快地开发了！** 🚀

有任何问题，请参考本文档的"常见问题排查"部分。

