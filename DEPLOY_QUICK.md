# 🚀 一键部署指南

## 快速部署

```bash
./deploy.sh
```

就这么简单！脚本会自动完成：
1. ✅ 构建前端和后端
2. ✅ 上传文件到服务器
3. ✅ 安装依赖
4. ✅ 同步数据库
5. ✅ 配置Nginx（首次部署）
6. ✅ 重启服务
7. ✅ 验证部署

## 首次部署

如果是第一次部署，需要先在服务器上做一些初始化：

```bash
# SSH登录服务器
ssh root@47.55.117.20

# 创建项目目录
mkdir -p /opt/wechat-editor
mkdir -p /var/www/html

# 安装必要软件
apt update
apt install -y nodejs npm nginx

# 安装PM2
npm install -g pm2

# 退出SSH
exit
```

然后运行部署脚本：
```bash
./deploy.sh
```

## 常用命令

### 查看服务状态
```bash
ssh root@47.55.117.20 'pm2 status'
```

### 查看日志
```bash
ssh root@47.55.117.20 'pm2 logs wechat-editor --lines 50'
```

### 重启服务
```bash
ssh root@47.55.117.20 'pm2 restart wechat-editor'
```

### 查看Nginx状态
```bash
ssh root@47.55.117.20 'systemctl status nginx'
```

## 故障排查

### 问题：401 Unauthorized

**原因**：Nginx没有正确代理API请求到后端

**解决**：
```bash
# SSH登录服务器
ssh root@47.55.117.20

# 检查Nginx配置
cat /etc/nginx/sites-available/wechat-editor

# 如果配置不存在或不正确，手动配置
sudo cp /tmp/nginx-wechat-editor.conf /etc/nginx/sites-available/wechat-editor
sudo ln -sf /etc/nginx/sites-available/wechat-editor /etc/nginx/sites-enabled/wechat-editor
sudo nginx -t
sudo systemctl reload nginx
```

### 问题：前端显示空白

**原因**：浏览器缓存

**解决**：按 `Ctrl+Shift+R` (Windows/Linux) 或 `Cmd+Shift+R` (Mac) 强制刷新

### 问题：后端无响应

**原因**：后端服务未启动

**解决**：
```bash
ssh root@47.55.117.20
cd /opt/wechat-editor
pm2 restart wechat-editor
pm2 logs wechat-editor
```

## 配置说明

### 修改服务器地址

编辑 `deploy.sh` 第11-13行：
```bash
SERVER_IP="你的服务器IP"
SERVER_USER="你的SSH用户名"
SERVER_PATH="/opt/wechat-editor"
```

### 修改API地址

如果你的域名或端口不同，编辑 `nginx-server.conf` 第20行：
```nginx
proxy_pass http://localhost:3002/api/;
```

## 性能优化建议

1. **启用HTTPS**：使用Let's Encrypt免费证书
2. **CDN加速**：将静态资源放到CDN
3. **数据库优化**：定期清理和备份数据库
4. **日志管理**：配置日志轮转，避免磁盘占满

## 安全建议

1. **修改SSH端口**：避免使用默认22端口
2. **配置防火墙**：只开放必要的端口（80, 443）
3. **定期更新**：保持系统和依赖包更新
4. **备份数据**：定期备份数据库和上传文件

