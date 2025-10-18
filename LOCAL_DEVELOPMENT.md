# 本地开发指南

## 🎯 推荐的开发流程

```
✅ 本地开发 → ✅ 本地测试 → ✅ 提交代码 → ✅ 部署到服务器
```

**不要每次修改都部署到服务器！** 这样太慢且浪费资源。

---

## 🚀 快速开始

### 1. 启动后端服务

```bash
cd server
npm run dev
```

后端将运行在：`http://localhost:3002`

### 2. 启动前端服务（新终端）

```bash
npm run dev
```

前端将运行在：`http://localhost:3001`

### 3. 访问本地应用

打开浏览器访问：`http://localhost:3001`

---

## 📊 环境说明

| 环境 | 地址 | 存储模式 | 用途 |
|------|------|----------|------|
| **本地开发** | `http://localhost:3001` | `local` (IndexedDB) | 日常开发和调试 |
| **生产环境** | `http://114.55.117.20` | `server` (数据库) | 正式使用 |

---

## 🔧 本地开发特性

### 自动环境切换

系统会自动识别环境：

- **本地开发**：
  - 前端API：`http://localhost:3002/api`
  - 存储模式：`local`（使用浏览器 IndexedDB）
  - 数据：保存在浏览器中，独立于服务器

- **生产环境**：
  - 前端API：`/api`（由Nginx代理）
  - 存储模式：`server`（使用服务器数据库）
  - 数据：保存在服务器数据库中

### 调试信息

打开浏览器控制台（F12），可以看到：

```javascript
[API Config] {
  hostname: "localhost",
  apiUrl: "http://localhost:3002/api",
  isDev: true,
  mode: "development"
}

[Storage Config] {
  mode: "local",
  hostname: "localhost",
  serverBaseUrl: "http://localhost:3002/api"
}
```

---

## 🧪 本地测试流程

### 1. 功能开发

在本地环境开发和测试功能：

```bash
# 终端1：后端
cd server && npm run dev

# 终端2：前端
npm run dev
```

### 2. 测试功能

在浏览器访问 `http://localhost:3001` 测试：

- ✅ 注册/登录
- ✅ 创建文档
- ✅ 编辑和预览
- ✅ 模板切换
- ✅ 所有功能...

### 3. 确认无误后提交代码

```bash
git add .
git commit -m "feat: 添加某某功能"
git push origin main
```

### 4. 部署到服务器

```bash
./quick-deploy-prod.sh
```

---

## 🔍 常见问题

### Q1: 本地开发时如何查看数据？

**A:** 打开浏览器开发者工具：
1. 按 F12
2. 切换到 "Application" 或 "存储" 标签
3. 展开 "IndexedDB" → `WeChat_Editor_<userId>`
4. 可以看到 `documents`、`versions`、`images` 三个表

### Q2: 本地数据和服务器数据是分开的吗？

**A:** 是的！完全独立：
- 本地开发：数据在浏览器 IndexedDB
- 生产环境：数据在服务器数据库

### Q3: 如何清除本地测试数据？

**A:** 两种方式：
1. 浏览器开发者工具 → Application → IndexedDB → 右键删除数据库
2. 清除浏览器数据：`Ctrl/Cmd + Shift + Delete`

### Q4: 本地开发需要配置什么吗？

**A:** 不需要！系统会自动识别环境并配置。只需确保：
- 后端运行在 `localhost:3002`
- 前端运行在 `localhost:3001`

### Q5: 什么时候需要部署到服务器？

**A:** 只有在这些情况下：
- ✅ 功能开发完成并在本地测试通过
- ✅ 需要给别人演示或测试
- ✅ 准备正式发布
- ❌ **不要**在每次小修改后都部署

---

## 🛠️ 开发技巧

### 热重载

前端和后端都支持热重载：
- 修改前端代码 → 浏览器自动刷新
- 修改后端代码 → 服务自动重启

### 查看后端日志

```bash
# 后端终端会实时显示日志
cd server && npm run dev
```

### 查看前端日志

浏览器控制台（F12 → Console）

### 数据库查看

```bash
# 查看本地数据库（开发环境）
cd server
npx prisma studio
```

会打开一个可视化界面查看数据库内容。

---

## 📝 开发示例

### 添加新功能的完整流程

```bash
# 1. 确保环境运行
cd server && npm run dev          # 终端1
npm run dev                       # 终端2

# 2. 在本地开发功能
# 编辑代码文件...

# 3. 在浏览器测试
# 访问 http://localhost:3001

# 4. 确认功能正常后提交
git add .
git commit -m "feat: 新功能描述"
git push origin main

# 5. 部署到生产环境
./quick-deploy-prod.sh

# 6. 在生产环境验证
# 访问 http://114.55.117.20
```

---

## 🎉 总结

**本地开发优势：**
- ⚡ 快速：修改立即生效
- 🔒 安全：不影响生产数据
- 🐛 调试：完整的调试工具
- 💰 省钱：减少服务器请求

**只在功能完成后才部署到服务器！**

