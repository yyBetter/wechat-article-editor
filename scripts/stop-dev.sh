#!/bin/bash
# 停止本地开发环境

echo "🛑 停止本地开发环境..."
echo ""

# 从PID文件读取进程ID
if [ -f /tmp/wechat-editor-dev.pid ]; then
    PIDS=$(cat /tmp/wechat-editor-dev.pid)
    echo "📍 从PID文件读取: $PIDS"
    
    for pid in $PIDS; do
        if ps -p $pid > /dev/null; then
            echo "  终止进程 $pid"
            kill $pid 2>/dev/null
        fi
    done
    
    rm /tmp/wechat-editor-dev.pid
fi

# 确保端口清理
echo ""
echo "🧹 清理端口..."

kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port)
    if [ ! -z "$pids" ]; then
        echo "  终止端口 $port 上的进程: $pids"
        echo "$pids" | xargs kill -9 2>/dev/null
    fi
}

kill_port 3001
kill_port 3002

echo ""
echo "✅ 本地开发环境已停止"
echo ""
echo "📝 日志文件保留在:"
echo "  /tmp/wechat-editor-backend.log"
echo "  /tmp/wechat-editor-frontend.log"
echo ""

