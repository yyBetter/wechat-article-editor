# 数据存储说明

## 📊 数据存储位置总览

### 🏠 本地开发环境
- **位置**: 浏览器 IndexedDB
- **数据库名**: `WeChat_Editor_<用户ID>`
- **查看方式**: 浏览器开发者工具 → Application/存储 → IndexedDB

### 🌐 生产环境（服务器）
- **位置**: `/opt/wechat-editor/server/prisma/dev.db`
- **类型**: SQLite 数据库
- **大小**: 约 68KB（会随数据增长）

---

## 🗄️ 服务器数据库结构

### 文档存储位置

```
服务器路径: /opt/wechat-editor/server/prisma/dev.db
数据库类型: SQLite
```

### 数据库表结构

#### 1️⃣ **users 表** - 用户信息
存储内容：
- ✅ 用户账号（邮箱、用户名、密码）
- ✅ 用户偏好设置（主题、自动保存等）
- ✅ 品牌设置（logo、二维码、品牌色等）
- ✅ AI使用次数统计
- ✅ 微信公众号配置

#### 2️⃣ **documents 表** - 文章内容 ⭐
存储内容：
- ✅ **文章标题** (`title`)
- ✅ **文章内容** (`content`) - Markdown格式的完整文章
- ✅ **模板ID** (`templateId`) - 使用的模板
- ✅ **模板变量** (`templateVariables`) - 自定义样式
- ✅ **文章状态** (`status`) - 草稿/已发布/归档
- ✅ **元数据** - 字数、图片数量、阅读时间
- ✅ **创建时间** / **更新时间**

**示例数据结构：**
```json
{
  "id": "cmf0ojoen0000ge1971juyu5a",
  "userId": "user123",
  "title": "我的第一篇文章",
  "content": "# 标题\n\n这是文章内容...",
  "templateId": "simple-doc",
  "status": "DRAFT",
  "createdAt": "2025-10-18T08:00:00.000Z"
}
```

#### 3️⃣ **document_versions 表** - 历史版本
存储内容：
- ✅ 每次保存的文章快照
- ✅ 版本号（v1, v2, v3...）
- ✅ 变更类型（创建、编辑、模板更改等）
- ✅ 完整的历史内容

#### 4️⃣ **analytics_events 表** - 使用统计
存储内容：
- ✅ 用户行为事件
- ✅ 功能使用统计
- ✅ 访问日志

---

## 📁 完整的服务器文件结构

```
/opt/wechat-editor/
├── server/
│   ├── prisma/
│   │   ├── dev.db              ← 📄 主数据库文件（存储所有文章）
│   │   ├── dev.db-journal      ← 📄 数据库事务日志
│   │   ├── schema.prisma       ← 📄 数据库结构定义
│   │   └── migrations/         ← 📁 数据库迁移记录
│   ├── dist/                   ← 📁 编译后的后端代码
│   └── node_modules/           ← 📁 后端依赖包
├── dist/                       ← 📁 前端构建产物
└── uploads/                    ← 📁 上传的图片文件
    └── images/
```

---

## 🔍 数据存储详解

### 文章内容是如何存储的？

当你在编辑器中创建一篇文章时：

1. **本地开发环境**:
   ```
   文章 → IndexedDB (浏览器) → documents 表
   ```

2. **生产环境**:
   ```
   文章 → HTTP请求 → 后端API → SQLite数据库 → dev.db 文件
   ```

### 数据表关系图

```
User (用户)
  └── Documents (文章) [一对多]
        └── DocumentVersions (版本历史) [一对多]
```

一个用户可以有多篇文章，一篇文章可以有多个历史版本。

---

## 💾 数据备份

### 备份数据库文件

```bash
# SSH登录服务器
ssh root@114.55.117.20

# 备份数据库
cd /opt/wechat-editor/server/prisma
cp dev.db dev.db.backup.$(date +%Y%m%d_%H%M%S)

# 下载到本地
scp root@114.55.117.20:/opt/wechat-editor/server/prisma/dev.db ./backup/
```

### 恢复数据库

```bash
# 上传备份到服务器
scp backup/dev.db root@114.55.117.20:/opt/wechat-editor/server/prisma/

# 重启服务
ssh root@114.55.117.20 'pm2 restart wechat-editor'
```

---

## 🔒 数据安全

### 存储安全特性

1. ✅ **用户隔离**: 每个用户只能访问自己的文章
2. ✅ **密码加密**: 使用 bcrypt 加密存储
3. ✅ **JWT认证**: 基于token的身份验证
4. ✅ **自动备份**: 每次部署前自动备份旧版本
5. ✅ **版本历史**: 防止误删除，可恢复历史版本

### 数据隐私

- ❌ **不存储敏感信息**: 不存储支付信息、身份证等
- ✅ **本地开发数据**: 完全在本地浏览器，不上传
- ✅ **生产数据**: 仅存储在你的服务器上

---

## 🛠️ 数据管理工具

### 使用 Prisma Studio 查看数据

```bash
# 在服务器上运行
ssh root@114.55.117.20
cd /opt/wechat-editor/server
npx prisma studio
```

这会启动一个可视化界面，可以：
- 查看所有表
- 编辑数据
- 搜索过滤
- 导出数据

### 使用 SQL 查询（需要安装 sqlite3）

```bash
# 安装 sqlite3
ssh root@114.55.117.20 'apt-get install -y sqlite3'

# 查询文章列表
ssh root@114.55.117.20 'cd /opt/wechat-editor/server && sqlite3 prisma/dev.db "SELECT id, title, status FROM documents;"'

# 查询用户统计
ssh root@114.55.117.20 'cd /opt/wechat-editor/server && sqlite3 prisma/dev.db "SELECT COUNT(*) as total FROM documents;"'
```

---

## 📈 数据增长预估

### 存储空间计算

假设每篇文章：
- 文章内容：约 5KB
- 图片引用：不存在数据库，存在文件系统
- 版本历史：每个版本约 5KB

**示例计算：**
```
100篇文章 × 5KB = 500KB
每篇3个版本 × 100篇 × 5KB = 1.5MB
总计约 2MB
```

SQLite数据库可以轻松支持几百万条记录，对于个人或小团队完全够用。

---

## 🔄 数据迁移

### 从本地迁移到服务器

如果你在本地开发环境创建了文章，想迁移到服务器：

1. 在生产环境重新创建文章（推荐）
2. 或者导出本地数据，通过API导入

### 未来扩展

当数据量增长后，可以考虑：
- 迁移到 PostgreSQL（更适合生产环境）
- 配置自动定时备份
- 使用云数据库服务

---

## ❓ 常见问题

### Q1: 文章内容是直接存储在数据库里吗？
**A:** 是的！文章内容（Markdown格式）直接存储在 `documents.content` 字段中。

### Q2: 图片存储在哪里？
**A:** 
- 本地开发：IndexedDB（base64编码）
- 生产环境：`/opt/wechat-editor/uploads/images/` 目录

### Q3: 数据库会不会太大？
**A:** 不会。纯文本内容非常小，100篇文章通常不到1MB。

### Q4: 如何查看我有多少篇文章？
**A:** 
```bash
ssh root@114.55.117.20 'cd /opt/wechat-editor/server && npx prisma db push'
```
或者在应用的Dashboard页面查看。

### Q5: 删除的文章可以恢复吗？
**A:** 目前删除是永久的。建议未来添加"回收站"功能。

---

## 📝 总结

### 数据存储位置

| 环境 | 存储位置 | 类型 |
|------|----------|------|
| **本地开发** | 浏览器 IndexedDB | 客户端存储 |
| **生产环境** | `/opt/wechat-editor/server/prisma/dev.db` | SQLite数据库 |

### 核心要点

1. ✅ 文章内容存储在 **SQLite数据库** 的 `documents` 表中
2. ✅ 数据库文件路径：`/opt/wechat-editor/server/prisma/dev.db`
3. ✅ 每个用户的数据完全隔离，互不影响
4. ✅ 支持版本历史，可以查看文章的修改记录
5. ✅ 数据备份简单，直接复制 `dev.db` 文件即可

**你的所有文章都安全地存储在你自己的服务器上！** 🔒

