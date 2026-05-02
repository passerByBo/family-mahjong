# Tasks: 家庭麻将计分板 MVP

## Phase 1: 基础设施

### Task 1.1: 项目初始化与依赖安装
- [x] 修复 pnpm 或切换到 npm workspaces
- [x] 安装所有依赖 (next, react, tailwindcss, shadcn/ui 等)
- [x] 初始化 shadcn/ui (`npx shadcn-ui@latest init`)
- [x] 验证 `dev` 命令能正常启动
- **产出**: 项目能跑起来,访问 localhost:3000 看到默认页面

### Task 1.2: 数据库 Schema 与 ORM
- [x] 创建 D1 数据库 migration 文件 (7张表)
- [x] 选择并配置 ORM (Drizzle ORM 推荐)
- [x] 定义所有表的 TypeScript schema
- [ ] 编写 seed 脚本 (预置测试数据)
- [x] 本地开发使用 wrangler d1 模拟
- **产出**: 数据库表结构就绪,可以本地读写

### Task 1.3: 预设头像资源
- [x] 使用 DiceBear 或开源库生成 16 个卡通头像 SVG
- [x] 放入 public/avatars/ 目录
- [x] 创建 avatars.ts 配置文件 (id → 文件路径映射)
- **产出**: 16 个头像可用

---

## Phase 2: 用户管理模块

### Task 2.1: 玩家 API
- [x] `GET /api/players` 获取所有玩家
- [x] `POST /api/players` 创建玩家 (name + avatar)
- [x] `PUT /api/players/[id]` 编辑玩家
- [x] `DELETE /api/players/[id]` 删除玩家
- **产出**: 玩家 CRUD API 可用

### Task 2.2: 玩家管理页面
- [x] `/players` 玩家列表页面
- [x] 创建玩家表单 (输入名称 + 选择头像)
- [x] 头像选择器组件 (avatar-picker)
- [x] 编辑/删除玩家功能
- [x] 安装需要的 shadcn/ui 组件 (Button, Input, Dialog, Card 等)
- **产出**: 可以创建、编辑、删除玩家

---

## Phase 3: 牌局管理模块

### Task 3.1: 牌局 API
- [x] `POST /api/games` 创建牌局 (playerIds, seatOrder, startDealerId)
- [x] `GET /api/games` 获取牌局列表 (支持 status 过滤)
- [x] `GET /api/games/[id]` 获取牌局详情 (含当前状态)
- [x] `PUT /api/games/[id]` 结束牌局
- **产出**: 牌局 CRUD API 可用

### Task 3.2: 创建牌局页面
- [x] `/games/new` 创建牌局页面
- [x] 从玩家列表选择 4 人 (player-picker 组件)
- [x] 拖拽或选择设置座位顺序
- [x] 选择起始庄家
- [x] 创建后跳转到打牌界面
- **产出**: 可以创建新牌局

### Task 3.3: 首页与牌局列表
- [x] `/` 首页: 显示进行中的牌局 + 新建牌局入口
- [x] `/history` 历史牌局列表
- [x] 牌局卡片: 显示玩家、日期、状态、总分
- [x] 点击进行中的牌局 → 继续打牌
- [x] 点击已结束的牌局 → 查看总结
- **产出**: 首页和历史页面可用

---

## Phase 4: 核心打牌功能

### Task 4.1: 积分计算引擎
- [x] 实现 `scoring.ts` 纯函数
- [x] 5 种事件的积分计算 (杠、庄家胡、庄家自摸、闲家胡、闲家自摸)
- [x] 编写单元测试覆盖所有场景
- [x] 验证所有场景积分总和为 0
- **产出**: 积分计算逻辑正确且有测试保障

### Task 4.2: 庄家轮转引擎
- [x] 实现 `dealer.ts` 纯函数
- [x] 连庄逻辑
- [x] 换庄逻辑 (按座位顺序)
- [x] 轮次结束判断
- [x] 下一轮起始庄家计算
- [x] 编写单元测试
- **产出**: 庄家轮转逻辑正确且有测试保障

### Task 4.3: 游戏操作 API
- [x] `POST /api/games/[id]/events` 记录事件 (杠/胡/自摸)
  - 调用积分引擎计算分数
  - 调用庄家引擎判断庄家变更
  - 判断轮次是否结束,自动结算
  - 返回更新后的游戏状态
- [x] `POST /api/games/[id]/undo` 撤销上一次操作
- **产出**: 核心游戏操作 API 可用

### Task 4.4: 麻将桌界面
- [x] `mahjong-table.tsx` 主组件 (4人围坐布局)
- [x] `player-seat.tsx` 玩家座位 (头像、名字、积分、庄家标识)
- [x] `action-buttons.tsx` 操作按钮 (杠/胡/自摸)
- [x] `game-status-bar.tsx` 底部状态栏 (轮次、局数、庄家)
- [x] 移动端适配 (响应式布局)
- **产出**: 麻将桌 UI 可用

### Task 4.5: 打牌交互逻辑
- [x] 点击 [杠] → 直接记录,更新积分
- [x] 点击 [胡]/[自摸] → 弹出确认弹窗,显示积分变化
- [x] 确认后调用 API,刷新界面
- [x] 庄家自动切换 (UI 标识更新)
- [x] 轮次结束弹窗 (显示本轮积分,结算到总分)
- [x] 自动开始下一轮
- [x] [撤销] 按钮功能
- [x] [流局] 按钮 (不记分,不换庄)
- **产出**: 完整的打牌交互流程

---

## Phase 5: 换人与换位

### Task 5.1: 换人功能
- [x] `POST /api/games/[id]/swap` 换人 API
  - 离场玩家冻结积分
  - 新人从 0 开始 / 老人恢复冻结积分
  - 继承座位
- [x] 换人 UI (选择离场玩家 → 选择入场玩家)
- **产出**: 中途换人功能可用

### Task 5.2: 换位次功能
- [x] `POST /api/games/[id]/seats` 换位次 API
- [x] 换位次 UI (拖拽或选择调整座位)
- [x] 换位后可重新设置起始庄家
- **产出**: 换位次功能可用

---

## Phase 6: 积分统计

### Task 6.1: 积分查询 API
- [x] `GET /api/games/[id]/summary` 牌局总结
- [x] `GET /api/games/[id]/rounds` 所有轮次列表
- [x] `GET /api/games/[id]/rounds/[rid]` 某轮明细
- **产出**: 积分查询 API 可用

### Task 6.2: 牌局总结页面
- [x] `/games/[id]/summary` 总结页面
- [x] 总积分排行
- [x] 可展开查看每轮明细
- [x] 每轮可展开查看每局事件
- **产出**: 牌局总结页面可用

---

## Phase 7: 部署

### Task 7.1: Cloudflare 部署配置
- [ ] 配置 wrangler.toml (D1 绑定)
- [ ] 创建 Cloudflare D1 数据库
- [ ] 运行 migration
- [ ] 配置 Next.js for Cloudflare Pages (@cloudflare/next-on-pages)
- [ ] 手动部署验证
- **产出**: 应用成功部署到 Cloudflare

### Task 7.2: GitHub Actions CI/CD
- [ ] 配置 deploy.yml workflow
- [ ] push to main → 自动构建 + 部署
- [ ] 配置 GitHub Secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
- **产出**: 推送代码自动部署

---

## 实施顺序与依赖

```
Phase 1 (基础设施)
  ↓
Phase 2 (用户管理) ← 可独立开发
  ↓
Phase 3 (牌局管理) ← 依赖 Phase 2
  ↓
Phase 4 (核心打牌) ← 依赖 Phase 3, 最重要
  ↓
Phase 5 (换人换位) ← 依赖 Phase 4
  ↓
Phase 6 (积分统计) ← 依赖 Phase 4
  ↓
Phase 7 (部署) ← 可以在 Phase 4 完成后就部署
```

## 预估工作量

| Phase | 描述 | Tasks |
|-------|------|-------|
| 1 | 基础设施 | 3 |
| 2 | 用户管理 | 2 |
| 3 | 牌局管理 | 3 |
| 4 | 核心打牌 | 5 |
| 5 | 换人换位 | 2 |
| 6 | 积分统计 | 2 |
| 7 | 部署 | 2 |
| **合计** | | **19 tasks** |
