# 前端构建阶段
FROM node:18-alpine as frontend-build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# 后端生产镜像
FROM node:18-alpine as backend

WORKDIR /app/server

# 安装后端依赖
COPY server/package*.json ./
RUN npm ci --only=production

# 复制后端源码
COPY server/src ./src
COPY server/prisma ./prisma
COPY server/tsconfig.json ./

# 构建后端
RUN npm run build

# 生成Prisma客户端
RUN npx prisma generate

# 创建上传目录
RUN mkdir -p uploads/images
RUN mkdir -p logs

# 设置权限
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

# 暴露端口
EXPOSE 3002

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# 启动命令
CMD ["npm", "start"]