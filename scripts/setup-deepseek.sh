#!/bin/bash

# DeepSeek API 快速配置脚本

echo "🔑 DeepSeek API 配置工具"
echo "=========================="
echo ""

# 检查是否在正确的目录
if [ ! -f "server/.env" ]; then
  echo "❌ 错误：请在项目根目录运行此脚本"
  exit 1
fi

# 读取用户输入的API密钥
echo "📝 请输入你的DeepSeek API密钥："
echo "   (格式：sk-xxxxxxxxxxxxxxxx)"
echo "   (在 https://platform.deepseek.com/ 获取)"
echo ""
read -p "API密钥: " DEEPSEEK_KEY

# 验证输入
if [ -z "$DEEPSEEK_KEY" ]; then
  echo "❌ 错误：密钥不能为空"
  exit 1
fi

if [[ ! "$DEEPSEEK_KEY" =~ ^sk- ]]; then
  echo "⚠️  警告：密钥格式可能不正确（通常以 sk- 开头）"
  read -p "是否继续？(y/n): " CONTINUE
  if [ "$CONTINUE" != "y" ]; then
    echo "❌ 已取消"
    exit 1
  fi
fi

# 备份原配置
echo ""
echo "📦 备份原配置..."
cp server/.env server/.env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ 备份完成: server/.env.backup.$(date +%Y%m%d_%H%M%S)"

# 更新配置
echo ""
echo "⚙️  更新配置..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s|DEEPSEEK_API_KEY=.*|DEEPSEEK_API_KEY=$DEEPSEEK_KEY|" server/.env
else
  # Linux
  sed -i "s|DEEPSEEK_API_KEY=.*|DEEPSEEK_API_KEY=$DEEPSEEK_KEY|" server/.env
fi

echo "✅ 配置已更新"

# 验证配置
echo ""
echo "🔍 验证配置..."
CURRENT_KEY=$(grep "DEEPSEEK_API_KEY" server/.env | cut -d'=' -f2)
if [ "$CURRENT_KEY" = "$DEEPSEEK_KEY" ]; then
  echo "✅ 配置验证成功"
else
  echo "❌ 配置验证失败，请手动检查 server/.env"
  exit 1
fi

# 询问是否重启服务
echo ""
read -p "🔄 是否重启后端服务？(y/n): " RESTART
if [ "$RESTART" = "y" ]; then
  echo ""
  echo "🔄 重启服务..."
  
  # 停止旧服务
  pkill -f "tsx watch src/index.ts"
  sleep 2
  
  # 启动新服务
  cd server
  npm run dev > /tmp/server.log 2>&1 &
  
  echo "✅ 服务已重启"
  echo "📊 查看日志: tail -f /tmp/server.log"
  
  # 等待服务启动
  sleep 3
  
  # 显示日志
  echo ""
  echo "📋 最近的日志:"
  echo "----------------------------------------"
  tail -10 /tmp/server.log
  echo "----------------------------------------"
fi

echo ""
echo "🎉 配置完成！"
echo ""
echo "📚 下一步："
echo "   1. 刷新浏览器测试AI适配功能"
echo "   2. 查看 DeepSeek配置指南.md 了解更多"
echo "   3. 在 https://platform.deepseek.com/usage 查看用量"
echo ""
echo "💡 提示："
echo "   - Mock模式（无密钥）：预设内容"
echo "   - 真实模式（有密钥）：AI智能适配"
echo ""
echo "🔒 安全提醒："
echo "   - 不要将密钥提交到Git"
echo "   - 不要分享给他人"
echo "   - 定期查看用量防止滥用"
echo ""

