# 部署指南 - Vercel（推荐手动部署）

## 方案：GitHub自动部署（最简单）

### 步骤1：登录Vercel
1. 访问 https://vercel.com
2. 点击 "Sign Up" 用GitHub账号登录
3. 授权Vercel访问你的GitHub

### 步骤2：导入项目
1. 点击 "Add New Project"
2. 选择 GitHub 标签
3. 找到并选择 `yyBetter/wechat-article-editor` 仓库
4. 点击 "Import"

### 步骤3：配置部署
1. **Framework Preset**: 选择 `Vite`
2. **Root Directory**: 保持 `./`（根目录）
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

### 步骤4：环境变量（可选）
如果需要服务器模式，添加：
- `NEXT_PUBLIC_API_URL`: 你的后端API地址

### 步骤5：部署
1. 点击 "Deploy"
2. 等待2-3分钟构建完成
3. 获得域名：`https://wechat-article-editor-xxxxx.vercel.app`

---

## 自动更新

GitHub提交新代码后，Vercel会自动重新部署：
- 每次push到main分支
- 自动生成预览链接
- 生产环境自动更新

---

## 绑定自定义域名（可选）

1. 在Vercel项目设置中找到 "Domains"
2. 添加你的域名
3. 按提示配置DNS
4. 等待SSL证书自动配置

---

## 部署状态

- ✅ 代码已提交到GitHub
- ✅ 新增爆款标准模板
- ✅ 定价策略已制定
- ⏳ 等待Vercel部署

**预计5分钟内完成部署！**
