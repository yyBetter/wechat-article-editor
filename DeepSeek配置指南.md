# 🔑 DeepSeek API 配置指南

## 📝 快速开始

### 第1步：注册DeepSeek账号

1. 访问：https://platform.deepseek.com/
2. 点击右上角"登录/注册"
3. 使用邮箱注册账号
4. 完成邮箱验证

### 第2步：获取API密钥

1. 登录后，进入控制台
2. 点击左侧菜单 "API Keys"
3. 点击 "创建新密钥"
4. 复制生成的密钥（格式：`sk-xxxxxxxxxxxxxxxx`）

**⚠️ 重要**：密钥只显示一次，请立即保存！

### 第3步：配置到项目

**编辑文件**：`server/.env`

```bash
# 找到这一行
DEEPSEEK_API_KEY=your-deepseek-api-key-here

# 替换为你的真实密钥
DEEPSEEK_API_KEY=sk-your-actual-key-here
```

**或者使用命令行快速替换**：

```bash
cd /Users/yangyu/develop/gzhpaiban/server

# 方法1：使用 sed 命令（推荐）
sed -i '' 's/DEEPSEEK_API_KEY=.*/DEEPSEEK_API_KEY=sk-your-actual-key-here/' .env

# 方法2：直接使用 echo 覆盖（需要保留其他配置）
# 不推荐，可能会覆盖其他配置
```

**最简单的方法**：手动编辑

```bash
# 打开编辑器
code server/.env
# 或
nano server/.env
# 或
vim server/.env

# 找到 DEEPSEEK_API_KEY 这一行
# 修改为你的真实密钥
# 保存并退出
```

### 第4步：重启服务

```bash
# 停止当前服务
pkill -f "tsx watch src/index.ts"

# 重新启动
cd /Users/yangyu/develop/gzhpaiban/server
npm run dev
```

### 第5步：验证配置

打开浏览器控制台，调用API时应该看到：

```
✅ 使用真实DeepSeek API进行适配
🤖 正在调用AI...
✅ AI适配完成
```

---

## 💰 费用说明

### 免费额度
- **新用户**：500万tokens（约2500次适配）
- **有效期**：长期有效，用完为止

### 实际费用
| 操作 | Tokens消耗 | 费用 | 说明 |
|-----|-----------|------|------|
| 单平台适配 | ~2,000 | ¥0.002 | 不到1分钱 |
| 5平台适配 | ~10,000 | ¥0.01 | 1分钱 |
| 每天10次 | ~100,000 | ¥0.10 | 1毛钱 |
| 每月300次 | ~3,000,000 | ¥3.00 | 3块钱 |

**结论**：基本免费！免费额度够用很久！

---

## 🔍 问题排查

### Q1: 如何确认密钥已生效？

查看后端启动日志：

```bash
tail -f /tmp/server.log

# 应该看到：
✅ DeepSeek API 已配置
```

或者查看API调用时的console输出。

### Q2: 密钥配置错误会怎样？

系统会**自动降级到Mock模式**：

```bash
⚠️ 未检测到真实API密钥，使用Mock数据演示
✅ 生成公众号Mock数据
```

这样不会影响功能测试，只是内容是预设的。

### Q3: 如何验证密钥是否有效？

**方法1**：在DeepSeek控制台查看用量

1. 登录 https://platform.deepseek.com/
2. 查看 "用量统计"
3. 看到API调用记录即说明生效

**方法2**：查看后端日志

```bash
# 适配时应该看到：
🎯 开始适配公众号平台...
🤖 调用DeepSeek API...
✅ 公众号适配完成
```

### Q4: 密钥泄露了怎么办？

**立即操作**：

1. 登录DeepSeek控制台
2. 找到泄露的密钥
3. 点击"删除"
4. 创建新密钥
5. 更新到 `.env` 文件
6. 重启服务

### Q5: 可以使用OpenAI API吗？

**可以！** 但贵很多：

```bash
# 在 server/.env 中配置
OPENAI_API_KEY=sk-your-openai-key-here

# 系统会优先使用OpenAI
# 如果没有OPENAI_API_KEY，则使用DEEPSEEK_API_KEY
```

**费用对比**：
- DeepSeek: ¥0.001/1K tokens
- OpenAI GPT-4: ¥0.21/1K tokens (贵210倍！)

---

## ⚙️ 高级配置

### 同时支持多个API

在 `server/.env` 中：

```bash
# 优先使用OpenAI（质量更高，但贵）
OPENAI_API_KEY=sk-your-openai-key

# 备用DeepSeek（便宜）
DEEPSEEK_API_KEY=sk-your-deepseek-key
```

**逻辑**：
- 有 `OPENAI_API_KEY` → 使用OpenAI
- 没有 `OPENAI_API_KEY` → 使用DeepSeek
- 都没有 → 使用Mock模式

### 切换不同环境

**开发环境** (本地):
```bash
# server/.env
DEEPSEEK_API_KEY=sk-your-dev-key
```

**生产环境** (服务器):
```bash
# /opt/wechat-editor-production/server/.env
DEEPSEEK_API_KEY=sk-your-prod-key
```

---

## 🎯 完整配置流程

### 方式1：命令行配置（最快）

```bash
# 1. 注册DeepSeek并获取密钥
# 2. 执行以下命令

cd /Users/yangyu/develop/gzhpaiban/server

# 3. 备份原配置
cp .env .env.backup

# 4. 更新API密钥（替换YOUR_KEY为你的真实密钥）
cat > .env << 'EOF'
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=your-secret-key-here
PORT=3002
NODE_ENV=development
DEEPSEEK_API_KEY=YOUR_KEY_HERE
FRONTEND_URL=http://localhost:3001
EOF

# 5. 重启服务
pkill -f "tsx watch src/index.ts"
npm run dev > /tmp/server.log 2>&1 &

# 6. 查看日志确认
tail -f /tmp/server.log
```

### 方式2：手动编辑（最安全）

```bash
# 1. 打开编辑器
cd /Users/yangyu/develop/gzhpaiban/server
code .env

# 2. 找到这一行：
DEEPSEEK_API_KEY=your-deepseek-api-key-here

# 3. 修改为：
DEEPSEEK_API_KEY=sk-你的真实密钥

# 4. 保存文件 (Cmd+S)

# 5. 重启服务
pkill -f "tsx watch src/index.ts"
npm run dev > /tmp/server.log 2>&1 &
```

---

## 📊 监控用量

### 实时查看

访问 DeepSeek 控制台：
https://platform.deepseek.com/usage

### 自动告警（可选）

在代码中添加用量监控：

```typescript
// server/src/utils/api-monitor.ts
async function checkApiUsage() {
  // 调用DeepSeek API查询用量
  // 如果接近限制，发送通知
}
```

---

## 🔒 安全建议

### ✅ 推荐做法

1. **不要提交到Git**
   - `.env` 文件已在 `.gitignore` 中
   - 永远不要 `git add .env`

2. **不要分享**
   - 不要在截图中暴露
   - 不要发送给他人
   - 不要公开展示

3. **定期轮换**
   - 每3-6个月更换一次密钥
   - 发现异常立即更换

4. **使用环境变量**
   - 生产环境使用系统环境变量
   - 不要硬编码在代码中

### ❌ 避免做法

1. ❌ 不要把密钥写在代码里
2. ❌ 不要上传到GitHub
3. ❌ 不要发送到聊天工具
4. ❌ 不要使用弱密钥（如test123）
5. ❌ 不要多人共用一个密钥

---

## 🎁 快速测试命令

配置完成后，快速测试：

```bash
# 测试后端是否正常
curl http://localhost:3002/health

# 测试API是否可访问
curl -X POST http://localhost:3002/api/ai/adapt-platform \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "platform": "wechat",
    "title": "测试文章",
    "content": "这是一篇测试文章的内容"
  }'
```

---

## 📞 需要帮助？

### 常见错误

**1. `Error: Invalid API Key`**
- 检查密钥是否正确复制
- 确认没有多余的空格
- 重新生成新密钥

**2. `Error: Rate Limit Exceeded`**
- 已超过免费额度
- 等待配额重置或充值

**3. `Error: Network Error`**
- 检查网络连接
- 确认DeepSeek服务正常
- 查看防火墙设置

### 获取支持

- **DeepSeek文档**: https://platform.deepseek.com/docs
- **API状态**: https://status.deepseek.com/
- **技术支持**: support@deepseek.com

---

## ✅ 配置完成检查清单

- [ ] 已注册DeepSeek账号
- [ ] 已获取API密钥
- [ ] 已配置到 `server/.env`
- [ ] 已重启后端服务
- [ ] 已验证配置生效
- [ ] 已测试真实AI适配
- [ ] 已查看用量统计
- [ ] 已保存密钥备份（安全的地方）

**全部打勾？恭喜！你已经完成配置！** 🎉

---

**创建时间**: 2024-10-18  
**适用版本**: v1.0+

