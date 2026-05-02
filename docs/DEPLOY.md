# 家庭麻将计分板 — 完整部署指南

## 整体架构

```
┌──────────────┐     push      ┌──────────────────┐    构建+部署    ┌─────────────────────┐
│   本地开发    │ ──────────▶  │  GitHub Actions   │ ────────────▶ │  Cloudflare Pages   │
│              │              │  (自动 CI/CD)      │               │  (托管应用)          │
│ better-sqlite│              │                    │               │         │            │
│ + local.db   │              └──────────────────┘               │         ▼            │
└──────────────┘                                                  │  ┌─────────────┐    │
                                                                  │  │ Cloudflare   │    │
                                                                  │  │ D1 数据库    │    │
                                                                  │  │ (SQLite)     │    │
                                                                  │  └─────────────┘    │
                                                                  └─────────────────────┘
```

**工作原理**：
- 你在本地写代码、测试，用的是本地 SQLite 数据库
- 代码推送到 GitHub main 分支后，GitHub Actions 自动构建
- 构建产物自动部署到 Cloudflare Pages
- 线上应用连接 Cloudflare D1 数据库（也是 SQLite，但在云端）

---

## 清单总览

| 序号 | 步骤 | 在哪里操作 | 预计耗时 |
|------|------|-----------|---------|
| 1 | 获取 Cloudflare Account ID | Cloudflare 网页 | 1 分钟 |
| 2 | 创建 Cloudflare API Token | Cloudflare 网页 | 3 分钟 |
| 3 | 配置 GitHub Secrets | GitHub 网页 | 2 分钟 |
| 4 | 安装 wrangler 并登录 | 本地终端 | 3 分钟 |
| 5 | 初始化 D1 数据库表结构 | 本地终端 | 2 分钟 |
| 6 | 代码适配 Cloudflare | Claude 完成 | — |
| 7 | 推送代码触发部署 | 本地终端 | 1 分钟 |
| 8 | 在 Cloudflare 绑定 D1 | Cloudflare 网页 | 3 分钟 |
| 9 | 绑定自定义域名（可选） | Cloudflare 网页 | 5 分钟 |

---
---

## 第一步：获取 Cloudflare Account ID

**在哪里操作**：Cloudflare 网页后台

1. 打开浏览器，登录 https://dash.cloudflare.com
2. 登录后看浏览器地址栏，URL 格式如下：
   ```
   https://dash.cloudflare.com/a1b2c3d4e5f6g7h8
                                 ^^^^^^^^^^^^^^^^
                                 这一串就是你的 Account ID
   ```
3. 或者：点击左侧菜单 **Workers & Pages** → 页面右侧会显示 **Account ID**
4. **复制并保存这个 Account ID**

> 示例：`a1b2c3d4e5f6789012345678abcdef00`（32 位十六进制字符串）

---

## 第二步：创建 Cloudflare API Token

**在哪里操作**：Cloudflare 网页后台

API Token 是让 GitHub Actions 有权限把代码部署到你的 Cloudflare 账户。

1. 打开 https://dash.cloudflare.com/profile/api-tokens
   - 或者：右上角头像 → **My Profile** → 左侧 **API Tokens**
2. 点击 **Create Token** 按钮
3. 页面会显示几个模板，滚动到最下面，选择 **Custom token** 旁边的 **Get started**
4. 填写 Token 配置：

   **Token name（名称）**：
   ```
   family-mahjong-deploy
   ```

   **Permissions（权限）**：点击 **+ Add more** 添加以下 3 条：

   | Permission 1 | Permission 2 | Permission 3 |
   |---|---|---|
   | Account | Cloudflare Pages | Edit |
   | Account | D1 | Edit |
   | Account | Workers Scripts | Edit |

   具体操作：
   - 第一个下拉框选 `Account`
   - 第二个下拉框选 `Cloudflare Pages`
   - 第三个下拉框选 `Edit`
   - 点击 **+ Add more** 重复上面步骤添加 D1 和 Workers Scripts

   **Account Resources（账户范围）**：
   - 选择 `Include` → `你的账户名`（或 All accounts）

   **Zone Resources**：不需要配置（留空）

   **Client IP Address Filtering**：不需要配置（留空）

   **TTL**：不需要配置（留空，永不过期）

5. 点击 **Continue to summary**
6. 确认权限无误后，点击 **Create Token**
7. **立即复制 Token 并保存到安全的地方**

> ⚠️ 这个 Token 只显示一次！关闭页面后无法再查看。如果丢失需要重新创建。
>
> 示例：`Abc123XYZ_this-is-a-fake-token-example`

---

## 第三步：配置 GitHub Secrets

**在哪里操作**：GitHub 网页

GitHub Secrets 是加密存储的环境变量，GitHub Actions 部署时会用到。

1. 打开 https://github.com/passerByBo/family-mahjong/settings/secrets/actions
   - 或者：进入仓库页面 → 顶部 **Settings** → 左侧 **Secrets and variables** → **Actions**
2. 点击 **New repository secret** 按钮
3. 添加第一个 Secret：
   - **Name**：`CLOUDFLARE_API_TOKEN`
   - **Secret**：粘贴第二步创建的 API Token
   - 点击 **Add secret**
4. 再次点击 **New repository secret**，添加第二个：
   - **Name**：`CLOUDFLARE_ACCOUNT_ID`
   - **Secret**：粘贴第一步获取的 Account ID
   - 点击 **Add secret**

添加完成后，Secrets 列表应该显示：
```
CLOUDFLARE_ACCOUNT_ID    Updated just now
CLOUDFLARE_API_TOKEN     Updated just now
```

---

## 第四步：安装 wrangler 并登录

**在哪里操作**：本地终端（Mac Terminal）

wrangler 是 Cloudflare 的命令行工具，用来管理 D1 数据库。

### 4.1 安装 wrangler

打开终端，执行：
```bash
npm install -g wrangler
```

安装完成后验证：
```bash
wrangler --version
```
应该显示类似 `3.x.x` 的版本号。

### 4.2 登录 Cloudflare

```bash
wrangler login
```

执行后：
- 终端会显示一个 URL
- 浏览器会自动打开 Cloudflare 授权页面
- 点击 **Allow** 授权
- 终端显示 `Successfully logged in` 表示成功

### 4.3 验证登录

```bash
wrangler whoami
```

应该显示你的 Cloudflare 账户名和 Account ID。

---

## 第五步：初始化 D1 数据库表结构

**在哪里操作**：本地终端

D1 数据库已经创建了，但里面还没有表。需要把建表语句执行到远程数据库。

### 5.1 执行建表迁移

```bash
# 确保在项目根目录
cd /Users/admin/work/projects/shixiaobo2026/family-mahjong

# 执行迁移 SQL
wrangler d1 execute family-mahjong --remote --file=apps/web/src/lib/db/migrations/0000_boring_ken_ellis.sql
```

终端会显示 SQL 内容并询问确认，输入 `y` 回车。

### 5.2 验证表是否创建成功

```bash
wrangler d1 execute family-mahjong --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

应该看到以下 7 张表：
```
game_players
games
hand_events
hands
players
rounds
score_changes
```

> 如果报错 `database not found`，检查 wrangler.toml 中的 database_name 是否和你在 Cloudflare 创建时的名字一致。
> 可以用 `wrangler d1 list` 查看所有数据库。

---

## 第六步：代码适配 Cloudflare（Claude 完成）

**这一步由 Claude 完成，你不需要手动操作。**

Claude 会修改以下文件：

| 文件 | 改动内容 |
|------|---------|
| `wrangler.toml` | 填入 D1 数据库 ID，添加 nodejs_compat |
| `apps/web/src/lib/db/index.ts` | 支持双模式：本地用 better-sqlite3，线上用 D1 |
| `apps/web/next.config.js` | 添加 OpenNext Cloudflare 适配器 |
| `apps/web/package.json` | 添加 `@opennextjs/cloudflare` 依赖 |
| `.github/workflows/deploy.yml` | 修正构建和部署命令 |

改完后 Claude 会提交代码并推送到 main 分支，自动触发 GitHub Actions 部署。

---

## 第七步：首次部署后绑定 D1 数据库

**在哪里操作**：Cloudflare 网页后台

> ⚠️ 这一步很关键！首次部署后应用还连不上数据库，需要手动绑定。

1. 登录 https://dash.cloudflare.com
2. 左侧菜单 → **Workers & Pages**
3. 找到 `family-mahjong` 项目，点击进入
4. 顶部选择 **Settings** 标签
5. 左侧找到 **Bindings**
6. 点击 **Add** 按钮
7. 选择 **D1 Database**
8. 填写：
   - **Variable name**：`DB`（必须是大写 DB，和代码中一致）
   - **D1 Database**：下拉选择 `family-mahjong`
9. 点击 **Save**

### 重新部署使绑定生效

绑定保存后，需要重新部署一次：
- 方法 1：在 Cloudflare Pages 项目页面点击 **Deployments** → 找到最新部署 → 点击 **Retry deployment**
- 方法 2：在本地随便改个文件 push 一下触发重新部署

---

## 第八步：绑定自定义域名（可选）

**在哪里操作**：Cloudflare 网页后台

> 前提：你的域名已经在 Cloudflare 管理（DNS 托管在 Cloudflare）

1. 进入 `family-mahjong` Pages 项目
2. 顶部选择 **Custom domains** 标签
3. 点击 **Set up a custom domain**
4. 输入你想要的二级域名，例如：`mahjong.yourdomain.com`
5. 点击 **Continue**
6. Cloudflare 会自动添加一条 CNAME DNS 记录
7. 点击 **Activate domain**
8. 等待几分钟 DNS 生效

生效后就可以通过 `https://mahjong.yourdomain.com` 访问了。

> 即使不绑定自定义域名，Cloudflare 也会自动分配一个 `family-mahjong.pages.dev` 域名可以直接使用。

---

## 日常开发部署流程

代码适配完成后，以后的日常流程非常简单：

```bash
# 1. 本地开发和测试
npm run dev

# 2. 改完代码后提交
git add .
git commit -m "你的提交信息"

# 3. 推送到 GitHub，自动部署
git push origin main

# 4. 查看部署状态
# 打开 https://github.com/passerByBo/family-mahjong/actions
# 或者 Cloudflare Dashboard → Workers & Pages → family-mahjong → Deployments
```

每次 push 到 main 分支，GitHub Actions 会自动：
1. 拉取代码
2. 安装依赖（npm install）
3. 构建项目（next build + opennextjs-cloudflare）
4. 部署到 Cloudflare Pages
5. 部署完成后线上自动更新

---

## 常用命令速查

```bash
# === 本地开发 ===
npm run dev                    # 启动本地开发服务器 (http://localhost:3000)
npm run build                  # 本地构建测试

# === 数据库管理 ===
wrangler d1 list               # 查看所有 D1 数据库
wrangler d1 execute family-mahjong --remote --command="SELECT * FROM players"    # 查询线上数据
wrangler d1 execute family-mahjong --remote --command="SELECT * FROM games"      # 查询线上牌局

# === 部署相关 ===
git push origin main           # 推送代码，自动触发部署
wrangler pages deployment list --project-name=family-mahjong   # 查看部署历史

# === 调试 ===
wrangler pages deployment tail --project-name=family-mahjong   # 实时查看线上日志
```

---

## 故障排查

### GitHub Actions 部署失败

**现象**：GitHub Actions 页面显示红色 ✗

**排查步骤**：
1. 打开 https://github.com/passerByBo/family-mahjong/actions
2. 点击失败的 workflow run
3. 查看具体哪一步报错

**常见原因**：
- `Error: Authentication error` → GitHub Secrets 中的 CLOUDFLARE_API_TOKEN 不正确
- `Error: Account not found` → CLOUDFLARE_ACCOUNT_ID 不正确
- `Build failed` → 代码有编译错误，先在本地 `npm run build` 确认能通过

### 页面能访问但数据为空 / 报错

**现象**：打开网站白屏或显示错误

**排查步骤**：
1. 检查 D1 绑定是否配置（第七步）
2. 检查绑定的 Variable name 是否为 `DB`（大写）
3. 检查 D1 数据库表是否已创建（第五步）
4. 查看线上日志：`wrangler pages deployment tail --project-name=family-mahjong`

### 自定义域名不生效

**现象**：域名访问显示错误或无法解析

**排查步骤**：
1. 确认域名 DNS 托管在 Cloudflare
2. 在 Cloudflare DNS 页面检查是否有对应的 CNAME 记录
3. 等待 5-10 分钟 DNS 传播
4. 用 `dig mahjong.yourdomain.com` 检查 DNS 解析

### 本地开发正常但线上不正常

**现象**：本地一切正常，部署后功能异常

**可能原因**：
- D1 和 better-sqlite3 的行为差异（极少见，因为 D1 就是 SQLite）
- 环境判断逻辑有误，检查 `db/index.ts`
- Cloudflare Pages 的 Node.js 兼容性问题，检查是否用了 Node.js 特有 API
