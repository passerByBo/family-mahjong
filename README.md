# 家庭麻将记分

一个基于 Next.js 15 的家庭麻将游戏记分应用，使用 Cloudflare Pages 和 D1 数据库部署。

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **构建工具**: Turbo (Monorepo)
- **包管理**: pnpm
- **部署**: Cloudflare Pages
- **数据库**: Cloudflare D1

## 项目结构

```
family-mahjong/
├── apps/
│   └── web/                 # Next.js 应用
│       ├── src/
│       │   ├── app/        # App Router 页面
│       │   ├── components/ # React 组件
│       │   └── lib/        # 工具函数
│       └── public/         # 静态资源
├── packages/
│   └── shared/             # 共享代码包
│       ├── src/
│       │   ├── types/      # TypeScript 类型定义
│       │   └── utils/      # 工具函数
└── .github/
    └── workflows/          # CI/CD 配置
```

## 开发

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 7.0.0

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建

```bash
pnpm build
```

### 代码检查

```bash
pnpm lint
```

### 代码格式化

```bash
pnpm format
```

## 部署

### Cloudflare Pages 部署

1. 在 Cloudflare Dashboard 创建 D1 数据库
2. 更新 `wrangler.toml` 中的 `database_id`
3. 在 GitHub 仓库设置中添加以下 Secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
4. 推送代码到 `main` 分支，GitHub Actions 会自动部署

## 许可证

MIT
