# 错误排查指南

## 当前遇到的错误及解决方案

### 1. ❌ 500 Internal Server Error (文档保存失败)

**原因：** 后端服务未启动或数据库连接失败

**解决方案：**

#### 方案A：启动后端服务（推荐用于云端同步）

```bash
# 1. 进入server目录
cd server

# 2. 安装依赖（如果还没安装）
npm install

# 3. 生成Prisma客户端
npm run db:generate

# 4. 运行数据库迁移
npm run db:migrate

# 5. 启动后端服务
npm run dev
```

后端服务应该运行在 `http://localhost:3002`

#### 方案B：使用本地存储模式（推荐用于离线使用）

前端已默认配置为本地存储模式，无需后端服务。如果仍然报错，请：

1. 清除浏览器缓存和IndexedDB
2. 刷新页面
3. 重新登录（本地模式也需要登录以创建用户隔离的数据库）

### 2. ❌ 413 Request Entity Too Large (图片上传失败)

**原因：** 上传的图片超过服务器限制

**已修复：** 
- 服务器端上传限制已从5MB提升到10MB
- Express body parser限制已从10MB提升到50MB

**如果仍然失败：**
- 在本地模式下，图片会自动压缩到合理大小
- 建议上传前手动压缩图片（推荐使用 tinypng.com）

### 3. ❌ ERR_CONNECTION_RESET / ERR_PROXY_CONNECTION_FAILED

**原因：** 
- 后端服务未启动
- 代理或网络配置问题
- 浏览器代理设置干扰

**解决方案：**

1. **检查后端服务状态**
   ```bash
   # 查看3002端口是否被占用
   lsof -i :3002
   
   # 如果端口被占用，杀死进程
   kill -9 <PID>
   
   # 重新启动后端
   cd server && npm run dev
   ```

2. **使用本地存储模式**（无需后端）
   - 应用已默认使用本地存储模式
   - 所有数据保存在浏览器的IndexedDB中
   - 支持离线使用

3. **检查浏览器设置**
   - 禁用浏览器代理
   - 清除浏览器缓存
   - 尝试使用无痕模式

## 存储模式切换

### 当前配置
```typescript
// src/utils/storage-adapter.ts
const DEFAULT_CONFIG: StorageConfig = {
  mode: 'local', // 本地存储模式（推荐）
}
```

### 三种存储模式对比

| 模式 | 描述 | 优点 | 缺点 | 适用场景 |
|------|------|------|------|---------|
| **local** | 纯本地存储 | 离线可用、快速、隐私 | 不跨设备同步 | 个人使用、离线编辑 |
| **server** | 纯服务器存储 | 跨设备同步、备份 | 需要网络、依赖后端 | 团队协作、多设备 |
| **hybrid** | 混合模式 | 自动降级、灵活 | 逻辑复杂 | 不稳定网络环境 |

### 手动切换存储模式

如果需要切换到服务器模式：

```typescript
// 在浏览器控制台执行
import { setStorageConfig } from './utils/storage-adapter'

// 切换到服务器模式
setStorageConfig({ mode: 'server' })

// 切换到混合模式（本地优先，失败降级到服务器）
setStorageConfig({ mode: 'hybrid' })

// 切换回本地模式
setStorageConfig({ mode: 'local' })
```

## 数据库相关问题

### SQLite数据库损坏

如果遇到数据库错误：

```bash
cd server

# 删除旧数据库
rm prisma/dev.db

# 重新创建数据库
npm run db:migrate
```

### IndexedDB清理

如果本地存储出现问题：

1. 打开浏览器开发者工具
2. Application/存储 → IndexedDB
3. 删除 `WeChat_Editor_*` 数据库
4. 刷新页面

## 检查清单

遇到问题时，按顺序检查：

- [ ] 后端服务是否运行 (`npm run dev` in server/)
- [ ] 浏览器控制台是否有错误信息
- [ ] 网络连接是否正常
- [ ] 是否登录（即使本地模式也需要）
- [ ] IndexedDB是否可用（隐私模式可能禁用）
- [ ] 浏览器是否支持（Chrome/Edge/Firefox最新版）

## 性能优化建议

### 图片优化
- 上传前压缩图片（推荐小于1MB）
- 使用 WebP 格式（更小的文件大小）
- 避免上传超大图片（>5MB）

### 版本历史
- 自动保存版本保留最近50个
- 手动创建重要版本快照
- 定期清理不需要的版本

### 存储空间
```javascript
// 检查存储配额
import { checkStorageQuota } from './utils/local-storage-utils'

const quota = await checkStorageQuota()
console.log(`使用: ${quota.percentage.toFixed(1)}%`)
console.log(`剩余: ${(quota.available / 1024 / 1024).toFixed(0)} MB`)
```

## 联系支持

如果以上方法都无法解决问题，请提供：
1. 浏览器控制台完整错误日志
2. 后端服务器日志（如果使用服务器模式）
3. 浏览器版本和操作系统信息
4. 重现问题的详细步骤



