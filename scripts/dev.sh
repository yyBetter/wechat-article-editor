#!/bin/bash
# 本地开发环境一键启动脚本

echo "🚀 启动本地开发环境..."
echo ""

# 检查端口占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# 终止端口进程
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo "  终止端口 $port 上的进程 (PID: $pid)"
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

# 检查并清理端口
echo "📍 检查端口状态..."
if check_port 3001; then
    echo "  ⚠️  端口 3001 被占用"
    kill_port 3001
fi

if check_port 3002; then
    echo "  ⚠️  端口 3002 被占用"
    kill_port 3002
fi

echo "  ✅ 端口已清理"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "📦 项目路径: $PROJECT_ROOT"
echo ""

# 启动后端
echo "🔧 启动后端服务 (端口 3002)..."
cd server
# 设置开发环境变量
export NODE_ENV=development
npm run dev > /tmp/wechat-editor-backend.log 2>&1 &
BACKEND_PID=$!
echo "  ✅ 后端启动 (PID: $BACKEND_PID)"
echo "  📝 日志文件: /tmp/wechat-editor-backend.log"
cd ..

# 等待后端启动
echo ""
echo "⏳ 等待后端服务就绪..."
for i in {1..10}; do
    if curl -s http://localhost:3002/health > /dev/null; then
        echo "  ✅ 后端服务已就绪"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "  ❌ 后端服务启动超时"
        echo "  请查看日志: tail -f /tmp/wechat-editor-backend.log"
        exit 1
    fi
    sleep 1
done

# 启动前端
echo ""
echo "🎨 启动前端服务 (端口 3001)..."
npm run dev > /tmp/wechat-editor-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "  ✅ 前端启动 (PID: $FRONTEND_PID)"
echo "  📝 日志文件: /tmp/wechat-editor-frontend.log"

# 等待前端启动
echo ""
echo "⏳ 等待前端服务就绪..."
for i in {1..15}; do
    if curl -s http://localhost:3001 > /dev/null; then
        echo "  ✅ 前端服务已就绪"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "  ❌ 前端服务启动超时"
        echo "  请查看日志: tail -f /tmp/wechat-editor-frontend.log"
        exit 1
    fi
    sleep 1
done

echo ""
echo "🎉 ========================================="
echo "✅ 本地开发环境启动成功！"
echo "🎉 ========================================="
echo ""
echo "📊 服务信息:"
echo "  前端: http://localhost:3001"
echo "  后端: http://localhost:3002"
echo "  健康检查: http://localhost:3002/health"
echo "  API状态: http://localhost:3002/api/status"
echo ""
echo "🔑 测试账号:"
echo "  邮箱: dev@local.com"
echo "  密码: password123"
echo ""
echo "📝 查看日志:"
echo "  后端: tail -f /tmp/wechat-editor-backend.log"
echo "  前端: tail -f /tmp/wechat-editor-frontend.log"
echo ""
echo "🛑 停止服务:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "  或运行: ./scripts/stop-dev.sh"
echo ""
echo "🌐 现在打开浏览器访问: http://localhost:3001"
echo ""

# 保存PID以便后续停止
echo "$BACKEND_PID $FRONTEND_PID" > /tmp/wechat-editor-dev.pid

