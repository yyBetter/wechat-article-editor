# 项目组织结构说明

## 📁 目录结构规范

### 根目录文件
- `README.md` - 项目主文档
- `CLAUDE.md` - AI 助手使用说明
- `TROUBLESHOOTING.md` - 问题排查指南
- `LOCAL_ONLY_MODE.md` - 本地模式说明
- `package.json` - 项目依赖配置
- `vite.config.ts` - Vite 构建配置
- `tsconfig.json` - TypeScript 配置

### 源代码 (`src/`)
```
src/
├── components/        # React 组件
│   ├── auth/         # 认证相关组件
│   ├── DonationButton.tsx
│   ├── DonationModal.tsx
│   ├── Editor.tsx
│   └── ...
├── hooks/            # 自定义 React Hooks
├── pages/            # 页面组件
├── styles/           # 样式文件
├── templates/        # 文档模板
├── types/            # TypeScript 类型定义
├── utils/            # 工具函数
└── main.tsx          # 入口文件
```

### 文档 (`docs/`)
```
docs/
├── 大纲功能说明.md
├── 错别字检查使用说明.md
├── Phase1实施完成报告.md
└── archive/          # 归档的临时文档和完成记录
    ├── ⚡立即修复.md
    ├── 🎉错别字检查集成完成.md
    ├── 📋大纲功能已完成.md
    └── ...
```

### 测试 (`tests/`)
- 所有测试文件和测试用例
- 包括单元测试、集成测试、E2E测试

### 脚本 (`scripts/`)
```
scripts/
├── aliyun-auto-deploy.sh    # 阿里云自动部署
├── create-deploy-package.sh # 创建部署包
├── START_LOCAL.sh           # 本地启动脚本
└── 完全本地化.sh            # 本地化配置脚本
```

### 服务器 (`server/`)
```
server/
├── src/              # 服务器源代码
├── scripts/          # 服务器相关脚本
├── prisma/           # 数据库配置
└── uploads/          # 上传文件存储
```

### 公共资源 (`public/`)
- 公开访问的静态资源
- favicon、图片等

## 📝 文件命名规范

### 组件文件
- 使用 PascalCase：`DonationButton.tsx`
- 一个文件一个主要组件

### 工具函数
- 使用 kebab-case：`donation-tracker.ts`
- 或 camelCase：`donationTracker.ts`

### 样式文件
- 使用 kebab-case：`outline-panel.css`
- 与组件对应时使用相同名称

### 文档文件
- 中文文档使用清晰的中文名称
- 英文文档使用 UPPERCASE 或 kebab-case
- 避免使用 emoji 作为正式文件名（仅用于临时标记）

## 🗑️ 不应提交的文件

以下文件类型应添加到 `.gitignore`：
- `*.log` - 日志文件
- `*.tmp` - 临时文件
- `*.tar.gz` - 压缩包
- `dist/` - 构建产物
- `node_modules/` - 依赖包
- `.DS_Store` - macOS 系统文件
- `*.local` - 本地配置文件

## 📋 文档管理规则

1. **正式文档** → `docs/`
   - 功能说明
   - API 文档
   - 用户指南

2. **临时文档** → `docs/archive/`
   - 开发记录
   - 完成报告
   - 临时笔记

3. **根目录文档**
   - 只保留核心文档（README、TROUBLESHOOTING 等）
   - 避免堆积过多文件

## 🔄 定期清理

建议每个重要版本发布后：
1. 将完成的功能记录移到 `docs/archive/`
2. 删除过期的测试文件
3. 清理不再使用的组件和工具
4. 更新 README 和文档

