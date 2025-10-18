#!/bin/bash

# ⏰ 等待并自动部署脚本
# 每5分钟尝试连接一次，成功后自动部署

SERVER_IP="114.55.117.20"
SERVER_USER="root"
MAX_ATTEMPTS=12  # 最多尝试12次（60分钟）
WAIT_TIME=300    # 每次等待5分钟

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}⏰ 等待SSH连接恢复...${NC}"
echo ""

for i in $(seq 1 $MAX_ATTEMPTS); do
    echo -e "${YELLOW}[尝试 $i/$MAX_ATTEMPTS] $(date '+%H:%M:%S') 测试连接...${NC}"
    
    if ssh -o ConnectTimeout=5 -o BatchMode=yes ${SERVER_USER}@${SERVER_IP} 'exit 0' 2>/dev/null; then
        echo ""
        echo -e "${GREEN}✅ SSH连接恢复！${NC}"
        echo ""
        echo -e "${BLUE}🚀 开始自动部署到staging环境...${NC}"
        echo ""
        
        # 执行部署
        ./deploy-multi-env.sh staging
        
        exit 0
    else
        if [ $i -lt $MAX_ATTEMPTS ]; then
            echo -e "${YELLOW}   连接失败，等待5分钟后重试...${NC}"
            sleep $WAIT_TIME
        fi
    fi
done

echo ""
echo -e "${RED}❌ 已尝试 $MAX_ATTEMPTS 次，仍无法连接${NC}"
echo -e "${YELLOW}建议：${NC}"
echo "  1. 检查服务器是否正常运行"
echo "  2. 联系服务器管理员"
echo "  3. 稍后手动执行: ./deploy-multi-env.sh staging"

