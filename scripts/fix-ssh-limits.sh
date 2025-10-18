#!/bin/bash
# SSH连接限制修复脚本

SERVER="root@114.55.117.20"

echo "🔧 开始修复SSH连接限制..."

ssh $SERVER 'bash -s' << 'ENDSSH'
# 1. 备份原SSH配置
echo "📦 备份SSH配置..."
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)

# 2. 检查是否已经配置过
if grep -q "优化SSH连接限制" /etc/ssh/sshd_config; then
    echo "⚠️  SSH配置已优化过，跳过..."
else
    echo "⚙️  添加SSH优化配置..."
    cat >> /etc/ssh/sshd_config << 'EOF'

# ========== 优化SSH连接限制 ==========
MaxStartups 100:30:200
MaxSessions 100
LoginGraceTime 120
ClientAliveInterval 60
ClientAliveCountMax 3
EOF
fi

# 3. 测试配置文件语法
echo "✅ 测试SSH配置语法..."
sshd -t
if [ $? -ne 0 ]; then
    echo "❌ SSH配置语法错误！恢复备份..."
    cp /etc/ssh/sshd_config.backup.$(date +%Y%m%d)* /etc/ssh/sshd_config
    exit 1
fi

# 4. 重启SSH服务
echo "🔄 重启SSH服务..."
systemctl restart sshd

# 5. 验证服务状态
echo "📊 SSH服务状态："
systemctl status sshd --no-pager | head -10

# 6. 显示当前配置
echo ""
echo "📋 当前SSH配置："
grep -E "^(MaxStartups|MaxSessions|LoginGraceTime|ClientAlive)" /etc/ssh/sshd_config

echo ""
echo "✅ SSH连接限制修复完成！"
ENDSSH

echo ""
echo "🎉 修复完成！现在可以正常使用SSH了。"

