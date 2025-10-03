# 快速修复指南 🔧

## 🚨 遇到错误？3步快速解决

### Step 1: 检查存储模式

**症状：**
- ❌ 保存失败 (500错误)
- ❌ 图片上传失败
- ❌ 连接失败 (ERR_PROXY_CONNECTION_FAILED)

**解决方案：**
1. 查看页面右下角的**存储状态指示器**（绿色/橙色/红色圆点）
2. 点击它，打开详细面板
3. 点击 **💾 本地存储模式** 按钮

✅ **立即生效** - 所有数据将保存在浏览器本地，无需后端服务

---

### Step 2: 重启浏览器

如果切换模式后仍然有问题：

1. 保存当前工作（如果可以）
2. 关闭所有浏览器窗口
3. 清除浏览器缓存：
   - **Chrome/Edge**: `Ctrl+Shift+Delete` → 选择"缓存的图片和文件" → 清除
   - **Firefox**: `Ctrl+Shift+Delete` → 选择"缓存" → 清除
4. 重新打开应用

---

### Step 3: 启动后端服务（仅需要服务器模式时）

如果你需要跨设备同步或团队协作：

```bash
# 打开终端，进入项目目录
cd server

# 安装依赖（首次运行）
npm install

# 初始化数据库（首次运行）
npm run db:generate
npm run db:migrate

# 启动后端服务
npm run dev

# 看到以下输出说明启动成功：
# ✅ Database connected successfully
# 🚀 Server running on http://localhost:3002
```

然后在应用中切换到 **☁️ 服务器模式**

---

## 📋 常见问题速查

### Q1: "自动保存失败"

**方案A（推荐）：** 使用本地模式
- 点击右下角存储状态 → 切换到本地模式
- 无需后端服务，离线可用

**方案B：** 启动后端服务
```bash
cd server && npm run dev
```

---

### Q2: "图片上传失败 (413)"

**原因：** 图片太大（已修复，现在支持10MB）

**解决：**
1. 压缩图片（推荐 <2MB）
2. 使用在线工具：tinypng.com 或 squoosh.app
3. 本地模式会自动压缩图片

---

### Q3: "ERR_CONNECTION_RESET / ERR_PROXY_CONNECTION_FAILED"

**原因：** 后端服务未启动或网络问题

**快速解决：**
1. 切换到**本地存储模式**（右下角存储状态指示器）
2. 或启动后端服务：`cd server && npm run dev`
3. 检查浏览器代理设置（禁用代理）

---

### Q4: 数据不见了？

**不要慌！** 数据保存在两个地方：

**本地模式：**
- 位置：浏览器 IndexedDB
- 查看：开发者工具 → Application → IndexedDB → WeChat_Editor_*
- 恢复：只要不清除浏览器数据就一直在

**服务器模式：**
- 位置：`server/prisma/dev.db`
- 备份：定期复制此文件
- 恢复：替换此文件后重启服务器

---

## 💡 推荐配置

### 个人使用 → 本地模式
```
优点：
✅ 离线可用
✅ 响应快速  
✅ 隐私保护
✅ 无需配置

缺点：
❌ 不跨设备
❌ 无法协作
```

### 团队协作 → 服务器模式
```
优点：
✅ 跨设备同步
✅ 团队共享
✅ 云端备份

缺点：
❌ 需要后端
❌ 依赖网络
```

### 不稳定网络 → 混合模式
```
优点：
✅ 自动降级
✅ 灵活切换

缺点：
❌ 可能同步冲突
```

---

## 🔍 诊断工具

### 浏览器控制台检查

按 `F12` 打开开发者工具，在 Console 标签粘贴：

```javascript
// 检查存储配额
import { checkStorageQuota } from './utils/local-storage-utils'
const quota = await checkStorageQuota()
console.log('存储使用:', quota.percentage.toFixed(1) + '%')
console.log('剩余空间:', (quota.available/1024/1024).toFixed(0) + 'MB')

// 检查当前模式
import { getStorageConfig } from './utils/storage-adapter'
console.log('当前存储模式:', getStorageConfig().mode)

// 检查数据库
const dbs = await indexedDB.databases()
console.log('本地数据库:', dbs)
```

### 后端健康检查

在浏览器打开：
- http://localhost:3002/health
- http://localhost:3002/api/status

看到响应说明后端正常运行。

---

## 📞 仍然有问题？

1. **查看完整文档：** `TROUBLESHOOTING.md`
2. **检查日志：**
   - 浏览器控制台（F12 → Console）
   - 后端终端输出
3. **提供信息：**
   - 错误截图
   - 浏览器版本
   - 操作系统
   - 重现步骤

---

## ✅ 修复确认清单

修复后，确认以下功能正常：

- [ ] 可以创建新文档
- [ ] 内容自动保存
- [ ] 图片可以上传
- [ ] 预览正常显示
- [ ] 文档列表可见
- [ ] 版本历史可访问
- [ ] 导出HTML成功

全部打勾？恭喜！问题已解决 🎉



