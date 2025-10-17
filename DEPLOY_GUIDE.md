# 🚀 公众号排版工具 - 阿里云部署指南

## ✅ 部署包已准备完成

**部署包文件**: `wechat-editor-20251017-181608.tar.gz` (1.1MB)  
**包含内容**: 前端构建文件 + 后端代码 + Docker配置 + 自动部署脚本

---

## 📋 部署前准备

### 1. 服务器要求
- **操作系统**: Ubuntu 20.04+ / Debian 11+
- **配置**: 最低 2核4GB，推荐 4核8GB
- **磁盘**: 至少20GB可用空间
- **Root权限**: 需要root用户或sudo权限

### 2. 网络要求
- **防火墙/安全组**:
  - 开放 **80端口** (HTTP)
  - 开放 **443端口** (HTTPS，如需SSL)
  - 开放 **22端口** (SSH访问)

### 3. 域名（可选但推荐）
- 如果有域名，请先配置好DNS解析指向服务器IP
- A记录指向服务器公网IP
- 等待DNS生效（通常5-30分钟）

---

## 🚀 部署步骤

### 步骤 1: 上传部署包到服务器

在本地电脑上运行：

```bash
# 将部署包上传到服务器 /opt 目录
# 替换 YOUR_SERVER_IP 为你的服务器IP地址
scp wechat-editor-20251017-181608.tar.gz root@YOUR_SERVER_IP:/opt/

# 示例：
# scp wechat-editor-20251017-181608.tar.gz root@47.98.123.456:/opt/
```

> 💡 如果没有配置SSH密钥，会要求输入服务器root密码

### 步骤 2: 登录服务器

```bash
ssh root@YOUR_SERVER_IP

# 示例：
# ssh root@47.98.123.456
```

### 步骤 3: 解压部署包

```bash
cd /opt
tar -xzf wechat-editor-20251017-181608.tar.gz
cd wechat-editor-deploy
```

### 步骤 4: 运行自动部署脚本

```bash
# 添加执行权限
chmod +x *.sh

# 运行部署脚本
./aliyun-auto-deploy.sh
```

### 步骤 5: 按提示输入配置信息

脚本会要求你输入以下信息：

1. **域名** (可选)
   ```
   你的域名 (如: gzh-paiban.com，没有请按Enter跳过): 
   ```
   - 有域名请输入，如：`gzh-paiban.com`
   - 没有域名直接按Enter，将通过IP访问

2. **管理员邮箱** (必填)
   ```
   管理员邮箱 (用于查看统计数据): admin@example.com
   ```
   - 用于接收证书通知和查看后台数据

3. **SSL证书** (推荐)
   ```
   是否安装SSL证书? (y/n): y
   ```
   - 有域名且需要HTTPS请输入 `y`
   - 没有域名或暂不需要请输入 `n`

### 步骤 6: 等待部署完成

部署脚本会自动完成以下操作：
- ✅ 更新系统
- ✅ 安装Docker和Docker Compose
- ✅ 安装Nginx
- ✅ 创建PostgreSQL数据库
- ✅ 启动后端服务
- ✅ 配置Nginx反向代理
- ✅ 申请SSL证书（如选择）
- ✅ 配置防火墙
- ✅ 设置监控脚本

**预计耗时**: 5-10分钟

---

## 🎉 部署完成

部署成功后，你会看到：

```
🎉 部署完成！
================================================
🌐 访问地址: https://your-domain.com  (或 http://your-ip)
📊 统计API: /api/analytics/public-stats
📧 管理员邮箱: admin@example.com

📋 重要信息:
• 数据库密码: [自动生成的强密码]
• 配置文件: /opt/wechat-editor/.env.production
• 日志目录: /var/log/wechat-editor-monitor.log
• 监控脚本: /opt/monitor.sh

🔧 常用管理命令:
• 查看服务状态: docker-compose ps
• 查看日志: docker-compose logs -f
• 重启服务: docker-compose restart
• 更新SSL证书: certbot renew

✅ 部署完成，请测试访问功能！
```

**⚠️ 重要：请保存数据库密码！**

---

## 🔍 验证部署

### 1. 检查服务状态

```bash
cd /opt/wechat-editor
docker-compose ps
```

应该看到三个服务都是 `Up` 状态：
```
wechat-editor-db        Up (healthy)
wechat-editor-backend   Up (healthy)
```

### 2. 检查端口监听

```bash
ss -tlnp | grep -E ":80|:443|:3002"
```

应该看到：
- `0.0.0.0:80` - Nginx HTTP
- `0.0.0.0:443` - Nginx HTTPS (如果配置了SSL)
- `127.0.0.1:3002` - 后端API

### 3. 测试访问

在浏览器中访问：
- **有域名**: `https://your-domain.com` 或 `http://your-domain.com`
- **无域名**: `http://your-server-ip`

应该能看到应用首页。

### 4. 测试API

```bash
curl http://localhost:3002/health
```

应该返回：
```json
{"status":"ok","timestamp":"2025-10-17T...","service":"wechat-editor-backend"}
```

---

## 🔧 常用管理命令

### 查看日志

```bash
cd /opt/wechat-editor

# 查看所有服务日志
docker-compose logs -f

# 查看后端日志
docker-compose logs -f backend

# 查看数据库日志
docker-compose logs -f postgres
```

### 重启服务

```bash
cd /opt/wechat-editor

# 重启所有服务
docker-compose restart

# 只重启后端
docker-compose restart backend

# 重启Nginx
systemctl restart nginx
```

### 停止/启动服务

```bash
cd /opt/wechat-editor

# 停止所有服务
docker-compose down

# 启动所有服务
docker-compose up -d
```

### 更新代码

如果有新版本需要更新：

```bash
# 1. 上传新的部署包
scp wechat-editor-YYYYMMDD-HHMMSS.tar.gz root@YOUR_SERVER:/opt/

# 2. 登录服务器
ssh root@YOUR_SERVER

# 3. 备份当前版本
cd /opt
mv wechat-editor wechat-editor.backup

# 4. 解压新版本
tar -xzf wechat-editor-YYYYMMDD-HHMMSS.tar.gz
cd wechat-editor-deploy

# 5. 停止旧服务
cd /opt/wechat-editor.backup
docker-compose down

# 6. 复制环境变量文件（保留配置）
cp .env.production /opt/wechat-editor-deploy/

# 7. 启动新服务
cd /opt/wechat-editor-deploy
mv /opt/wechat-editor-deploy /opt/wechat-editor
cd /opt/wechat-editor
docker-compose up -d --build
```

---

## ❗ 故障排查

### 问题1: 无法访问网站

**检查项**:
1. 防火墙是否开放80/443端口
   ```bash
   ufw status
   ```

2. Nginx是否运行
   ```bash
   systemctl status nginx
   ```

3. Docker服务是否运行
   ```bash
   docker-compose ps
   ```

**解决方法**:
```bash
# 重启Nginx
systemctl restart nginx

# 重启Docker服务
cd /opt/wechat-editor && docker-compose restart
```

### 问题2: API请求失败

**检查后端日志**:
```bash
cd /opt/wechat-editor
docker-compose logs backend
```

**常见原因**:
- 数据库连接失败
- 环境变量配置错误

**解决方法**:
```bash
# 检查数据库状态
docker-compose logs postgres

# 重启后端
docker-compose restart backend
```

### 问题3: SSL证书申请失败

**原因**:
- DNS还未生效
- 域名解析错误
- 80端口被占用

**解决方法**:
```bash
# 等待DNS生效后手动申请
certbot --nginx -d your-domain.com

# 查看Nginx错误日志
tail -f /var/log/nginx/error.log
```

### 问题4: 磁盘空间不足

**检查磁盘使用**:
```bash
df -h
```

**清理Docker镜像**:
```bash
# 清理未使用的Docker资源
docker system prune -a

# 清理旧的日志
cd /opt/wechat-editor
docker-compose logs --tail=1000 > recent.log
: > /var/lib/docker/containers/*/[container-id]-json.log
```

---

## 📊 监控和维护

### 自动监控

系统已自动配置监控脚本 `/opt/monitor.sh`，每5分钟运行一次，检查：
- Docker服务状态
- Nginx服务状态  
- 磁盘空间使用

查看监控日志：
```bash
tail -f /var/log/wechat-editor-monitor.log
```

### 数据库备份

**手动备份**:
```bash
cd /opt/wechat-editor
docker-compose exec postgres pg_dump -U wechat_user wechat_editor_prod > backup_$(date +%Y%m%d).sql
```

**设置定时备份**:
```bash
# 编辑crontab
crontab -e

# 添加每天凌晨3点备份
0 3 * * * cd /opt/wechat-editor && docker-compose exec postgres pg_dump -U wechat_user wechat_editor_prod > /opt/backups/backup_$(date +\%Y\%m\%d).sql
```

---

## 🔐 安全建议

1. **修改默认密码**
   - 记得修改服务器root密码
   - 数据库密码已自动生成强密码

2. **配置SSH密钥登录**
   ```bash
   # 禁用密码登录，只允许密钥登录
   vim /etc/ssh/sshd_config
   # 设置 PasswordAuthentication no
   systemctl restart sshd
   ```

3. **定期更新系统**
   ```bash
   apt update && apt upgrade -y
   ```

4. **查看访问日志**
   ```bash
   tail -f /var/log/nginx/access.log
   ```

---

## 📞 技术支持

如有问题，请检查：
1. 服务器日志: `docker-compose logs -f`
2. Nginx日志: `/var/log/nginx/error.log`
3. 监控日志: `/var/log/wechat-editor-monitor.log`

---

## ✅ 部署检查清单

部署完成后，请确认：

- [ ] 能通过域名/IP访问应用首页
- [ ] 能注册和登录用户
- [ ] 能创建和编辑文章
- [ ] 能预览文章排版
- [ ] 能复制格式化内容
- [ ] API健康检查通过: `/health`
- [ ] 数据库密码已保存
- [ ] SSL证书已配置（如有域名）
- [ ] 监控脚本正常运行

**恭喜！你的公众号排版工具已成功部署上线！** 🎉🎉🎉

