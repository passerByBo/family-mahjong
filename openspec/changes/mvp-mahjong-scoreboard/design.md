# Design: 家庭麻将计分板 MVP

## 架构概览

```
┌─────────────────────────────────────────────────┐
│                  Cloudflare Pages                │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │            Next.js 15 (App Router)        │  │
│  │                                           │  │
│  │  ┌─────────────┐    ┌─────────────────┐  │  │
│  │  │   Pages     │    │   API Routes    │  │  │
│  │  │  (React +   │───▶│  /api/players   │  │  │
│  │  │  shadcn/ui) │    │  /api/games     │  │  │
│  │  │             │    │  /api/rounds    │  │  │
│  │  └─────────────┘    └────────┬────────┘  │  │
│  │                              │            │  │
│  └──────────────────────────────┼────────────┘  │
│                                 │                │
│                    ┌────────────▼────────────┐   │
│                    │    Cloudflare D1        │   │
│                    │    (SQLite)             │   │
│                    └─────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## 目录结构

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # 根布局
│   │   ├── page.tsx                   # 首页 (牌局列表)
│   │   ├── players/
│   │   │   └── page.tsx               # 玩家管理
│   │   ├── games/
│   │   │   ├── new/
│   │   │   │   └── page.tsx           # 创建牌局
│   │   │   └── [id]/
│   │   │       ├── page.tsx           # 打牌界面 (核心)
│   │   │       └── summary/
│   │   │           └── page.tsx       # 牌局总结
│   │   ├── history/
│   │   │   └── page.tsx               # 历史牌局
│   │   └── api/
│   │       ├── players/
│   │       │   └── route.ts           # GET/POST 玩家
│   │       └── games/
│   │           ├── route.ts           # GET/POST 牌局
│   │           └── [id]/
│   │               ├── route.ts       # GET/PUT 牌局详情
│   │               ├── rounds/
│   │               │   └── route.ts   # GET/POST 轮次
│   │               ├── hands/
│   │               │   └── route.ts   # POST 记录一局
│   │               ├── events/
│   │               │   └── route.ts   # POST 记录事件(杠/胡/自摸)
│   │               ├── swap/
│   │               │   └── route.ts   # POST 换人
│   │               └── undo/
│   │                   └── route.ts   # POST 撤销
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui 组件
│   │   ├── mahjong-table.tsx          # 麻将桌主组件
│   │   ├── player-seat.tsx            # 玩家座位组件
│   │   ├── score-board.tsx            # 积分面板
│   │   ├── action-buttons.tsx         # 杠/胡/自摸按钮
│   │   ├── round-summary.tsx          # 轮次结算弹窗
│   │   ├── player-picker.tsx          # 选择玩家组件
│   │   ├── avatar-picker.tsx          # 选择头像组件
│   │   └── game-status-bar.tsx        # 底部状态栏
│   │
│   ├── lib/
│   │   ├── db.ts                      # D1 数据库客户端
│   │   ├── scoring.ts                 # 积分计算引擎
│   │   ├── dealer.ts                  # 庄家轮转逻辑
│   │   ├── avatars.ts                 # 预设头像配置
│   │   └── utils.ts                   # 通用工具
│   │
│   └── hooks/
│       ├── use-game.ts                # 游戏状态管理
│       └── use-undo.ts                # 撤销功能
│
└── public/
    └── avatars/                       # 预设头像图片
        ├── avatar-01.svg
        ├── ...
        └── avatar-16.svg
```

---

## 核心模块设计

### 1. 积分计算引擎 (scoring.ts)

纯函数,无副作用,易于测试。

```
输入: {
  eventType: 'kong' | 'win' | 'self_draw'
  playerId: string        // 杠者/胡者/自摸者
  dealerId: string        // 当前庄家
  allPlayerIds: string[]  // 当前4位在场玩家
}

输出: ScoreChange[] = [
  { playerId: 'A', amount: +4 },
  { playerId: 'B', amount: -2 },
  { playerId: 'C', amount: -1 },
  { playerId: 'D', amount: -1 },
]
```

计算逻辑:

```
kong (杠):
  杠者: +3
  其他三家: 各 -1

win (胡牌):
  if 胡者 == 庄家:
    庄家: +6, 其他三家: 各 -2
  else:
    胡者: +4, 庄家: -2, 其他闲家: 各 -1

self_draw (自摸):
  if 自摸者 == 庄家:
    庄家: +12, 其他三家: 各 -4
  else:
    自摸者: +8, 庄家: -4, 其他闲家: 各 -2
```

### 2. 庄家轮转引擎 (dealer.ts)

```
输入: {
  currentDealerId: string
  winnerId: string
  seatOrder: string[]     // 座位顺序 [A, B, C, D]
  roundStarterId: string  // 本轮起始庄家
}

输出: {
  nextDealerId: string
  isRoundFinished: boolean
}

逻辑:
  if eventType == 'kong':
    庄家不变, 轮次不结束

  if 庄家赢了 (winnerId == currentDealerId):
    连庄, nextDealerId = currentDealerId
    isRoundFinished = false

  if 庄家输了:
    nextDealerId = seatOrder 中 currentDealer 的下一位

    判断轮次是否结束:
      已坐过庄的玩家集合 包含所有4人
      且 currentDealer 是本轮最后一个应该坐庄的人
      → isRoundFinished = true

轮次结束判断详解:
  起始庄家为 B, 座位顺序 [A, B, C, D]
  坐庄顺序应为: B → C → D → A
  当 A 坐庄且输了 → 一轮结束

  即: 当 currentDealer 是 roundStarter 的前一位 且输了
      → isRoundFinished = true
```

### 3. 撤销机制 (use-undo.ts)

```
策略: 基于事件溯源

每次操作记录一个 HandEvent + 对应的 ScoreChange[]
撤销 = 删除最近的 HandEvent + 回滚 ScoreChange

撤销需要处理的边界情况:
  - 撤销胡牌 → 庄家可能需要回退
  - 撤销杠 → 只回滚积分,庄家不变
  - 撤销跨轮 → 如果刚结算了一轮,需要回退轮结算

MVP 简化: 只支持撤销当前轮内的最近一次操作
```

### 4. 换人逻辑

```
换人操作:
  1. 将离场玩家的 GamePlayer.is_active = false, left_at = now
  2. 检查新玩家是否曾在此牌局中:
     - 是 (老人回来): 恢复 is_active = true, left_at = null
       积分继承之前冻结的分数
     - 否 (新人): 创建新 GamePlayer, 积分从 0 开始
  3. 新玩家继承离场玩家的 seat_position
  4. 庄家轮转顺序不变 (按座位)
```

---

## API 设计

### 玩家管理

```
GET    /api/players          获取所有玩家
POST   /api/players          创建玩家 { name, avatar }
PUT    /api/players/[id]     编辑玩家
DELETE /api/players/[id]     删除玩家
```

### 牌局管理

```
GET    /api/games            获取牌局列表 (?status=playing|finished)
POST   /api/games            创建牌局 { playerIds, seatOrder, startDealerId }
GET    /api/games/[id]       获取牌局详情 (含当前状态、积分)
PUT    /api/games/[id]       更新牌局 (结束牌局)
```

### 游戏操作

```
POST   /api/games/[id]/events    记录事件 { type: kong|win|self_draw, playerId }
POST   /api/games/[id]/undo      撤销上一次操作
POST   /api/games/[id]/swap      换人 { outPlayerId, inPlayerId }
POST   /api/games/[id]/seats     换位次 { seatOrder, newDealerId? }
```

### 统计查询

```
GET    /api/games/[id]/rounds         获取牌局所有轮次
GET    /api/games/[id]/rounds/[rid]   获取某轮明细 (含每局事件和积分)
GET    /api/games/[id]/summary        获取牌局总结 (总积分 + 每轮汇总)
```

---

## 前端状态管理

```
打牌界面的状态:

GameState {
  game: Game
  players: GamePlayer[]          // 当前在场的4位玩家
  currentRound: Round            // 当前轮
  currentDealer: string          // 当前庄家 ID
  roundScores: Map<playerId, number>  // 本轮积分
  totalScores: Map<playerId, number>  // 总积分 (已结算)
  hands: Hand[]                  // 当前轮的局列表
  lastEvent: HandEvent | null    // 最近事件 (用于撤销)
}

状态更新流程:
  用户点击 [杠/胡/自摸]
    → 调用 POST /api/games/[id]/events
    → 后端计算积分、判断庄家变更、判断轮次结束
    → 返回更新后的完整 GameState
    → 前端刷新显示
```

---

## 数据库 Schema (D1 SQL)

```sql
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE games (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'playing',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT
);

CREATE TABLE game_players (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id),
  player_id TEXT NOT NULL REFERENCES players(id),
  seat_position INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  left_at TEXT
);

CREATE TABLE rounds (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id),
  number INTEGER NOT NULL,
  starter_id TEXT NOT NULL REFERENCES players(id),
  status TEXT NOT NULL DEFAULT 'playing',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE hands (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL REFERENCES rounds(id),
  dealer_id TEXT NOT NULL REFERENCES players(id),
  number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE hand_events (
  id TEXT PRIMARY KEY,
  hand_id TEXT NOT NULL REFERENCES hands(id),
  type TEXT NOT NULL,
  player_id TEXT NOT NULL REFERENCES players(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE score_changes (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES hand_events(id),
  player_id TEXT NOT NULL REFERENCES players(id),
  amount INTEGER NOT NULL
);

CREATE INDEX idx_game_players_game ON game_players(game_id);
CREATE INDEX idx_rounds_game ON rounds(game_id);
CREATE INDEX idx_hands_round ON hands(round_id);
CREATE INDEX idx_hand_events_hand ON hand_events(hand_id);
CREATE INDEX idx_score_changes_event ON score_changes(event_id);
CREATE INDEX idx_score_changes_player ON score_changes(player_id);
```

---

## 预设头像方案

使用 DiceBear API 或开源 SVG 头像库,预生成 16 个风格统一的卡通头像,存为 SVG 文件放在 public/avatars/ 下。

头像列表:
```
avatar-01 ~ avatar-16
风格: 可爱卡通动物 (猫、狗、兔、熊、狐狸、熊猫、企鹅、老虎等)
格式: SVG (矢量,体积小)
```

---

## 关键交互设计

### 打牌界面布局 (移动端优先)

```
┌─────────────────────────────────┐
│         [对面玩家 C]            │
│      头像 名字 本轮:+5         │
│      [杠] [胡] [自摸]          │
│                                 │
│ [左侧B]    🀄     [右侧D]     │
│ 头像       麻将桌    头像      │
│ 名字                 名字      │
│ +3                   -6        │
│ [杠][胡]          [杠][胡]     │
│ [自摸]            [自摸]       │
│                                 │
│       [当前玩家 A] 🎲庄        │
│      头像 名字 本轮:+8         │
│      [杠] [胡] [自摸]          │
│                                 │
├─────────────────────────────────┤
│ 第1轮 | 第5局 | 庄:A (连庄x2)  │
│ [流局] [撤销] [换人] [更多...]  │
└─────────────────────────────────┘
```

### 操作确认弹窗

点击 [胡] 或 [自摸] 后弹出确认:

```
┌─────────────────────────────┐
│   玩家A 胡牌                │
│                             │
│   积分变化:                 │
│   A: +6  (庄家胡)           │
│   B: -2                    │
│   C: -2                    │
│   D: -2                    │
│                             │
│   [取消]        [确认]      │
└─────────────────────────────┘
```

### 轮次结算弹窗

一轮结束时自动弹出:

```
┌─────────────────────────────┐
│   第1轮结束                 │
│                             │
│   本轮积分:                 │
│   1. A: +15 👑              │
│   2. C: +3                 │
│   3. B: -5                 │
│   4. D: -13                │
│                             │
│   已结算到总积分             │
│                             │
│   [查看明细]  [开始下一轮]   │
└─────────────────────────────┘
```
