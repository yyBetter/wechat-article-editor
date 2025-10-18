#!/bin/bash

# 🔑 SSH密钥配置脚本 - 实现免密码登录
# 使用方法：./setup-ssh-key.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

SERVER_IP="47.55.117.20"
SERVER_USER="root"

echo -e "${BLUE}🔑 配置SSH免密登录...${NC}"
echo ""

# 检查是否已有SSH密钥
if [ -f ~/.ssh/id_rsa.pub ]; then
    echo -e "${GREEN}✅ 发现现有SSH密钥${NC}"
else
    echo -e "${YELLOW}⚠️  未找到SSH密钥，开始生成...${NC}"
    ssh-keygen -t rsa -b 4096 -C "deploy-key" -f ~/.ssh/id_rsa -N ""
    echo -e "${GREEN}✅ SSH密钥已生成${NC}"
fi

echo ""
echo -e "${BLUE}📋 你的公钥内容：${NC}"
echo "=========================================="
cat ~/.ssh/id_rsa.pub
echo "=========================================="
echo ""

echo -e "${YELLOW}现在需要将公钥上传到服务器...${NC}"
echo ""
echo -e "${BLUE}方式1: 自动上传（需要输入一次密码）${NC}"
echo "  ssh-copy-id ${SERVER_USER}@${SERVER_IP}"
echo ""
echo -e "${BLUE}方式2: 手动上传${NC}"
echo "  1. 复制上面的公钥内容"
echo "  2. SSH登录服务器: ssh ${SERVER_USER}@${SERVER_IP}"
echo "  3. 执行以下命令："
echo "     mkdir -p ~/.ssh"
echo "     echo '公钥内容' >> ~/.ssh/authorized_keys"
echo "     chmod 700 ~/.ssh"
echo "     chmod 600 ~/.ssh/authorized_keys"
echo ""

read -p "是否现在自动上传公钥？(y/n): " answer

if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
    echo ""
    echo -e "${BLUE}正在上传公钥到服务器...${NC}"
    echo -e "${YELLOW}请输入服务器密码：${NC}"
    
    # 使用ssh-copy-id上传公钥
    ssh-copy-id -i ~/.ssh/id_rsa.pub ${SERVER_USER}@${SERVER_IP}
    
    echo ""
    echo -e "${GREEN}✅ 公钥上传成功！${NC}"
    echo ""
    echo -e "${BLUE}🧪 测试免密登录...${NC}"
    
    # 测试连接
    if ssh -o BatchMode=yes -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_IP} 'echo "连接成功"' 2>/dev/null; then
        echo -e "${GREEN}✅ 免密登录配置成功！${NC}"
        echo ""
        echo -e "${GREEN}现在可以无密码部署了：${NC}"
        echo "  ./deploy-multi-env.sh staging"
        echo "  ./deploy-multi-env.sh production"
    else
        echo -e "${RED}❌ 免密登录测试失败，请手动配置${NC}"
    fi
else
    echo ""
    echo -e "${YELLOW}请按照上面的手动方式配置${NC}"
fi

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}🎉 配置完成！${NC}"
echo -e "${BLUE}=========================================${NC}"

