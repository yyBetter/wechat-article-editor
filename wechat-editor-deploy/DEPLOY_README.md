# 阿里云部署包

## 快速部署步骤

1. **上传此文件夹到服务器**:
   ```bash
   scp -r wechat-editor-deploy root@your_server_ip:/opt/
   ```

2. **登录服务器并运行部署脚本**:
   ```bash
   ssh root@your_server_ip
   cd /opt/wechat-editor-deploy
   chmod +x aliyun-auto-deploy.sh
   ./aliyun-auto-deploy.sh
   ```

3. **按提示输入**:
   - 域名 (可选)
   - 管理员邮箱
   - 是否安装SSL证书

4. **等待部署完成** (约5-10分钟)

## 文件说明

- `aliyun-auto-deploy.sh` - 自动部署脚本
- `deploy-aliyun.md` - 详细部署指南
- `server/` - 后端代码
- `src/` - 前端代码
- `docker-compose.yml` - Docker服务配置
- `nginx.conf` - Nginx配置

## 注意事项

1. 确保服务器已重置root密码
2. 确保服务器安全组开放80、443端口
3. 如有域名，确保DNS解析已配置
4. 记录好部署过程中生成的数据库密码

