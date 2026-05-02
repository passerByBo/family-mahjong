import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// 玩家
export const players = sqliteTable('players', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  avatar: text('avatar').notNull(),
  createdAt: text('created_at').notNull(),
})

// 牌局
export const games = sqliteTable('games', {
  id: text('id').primaryKey(),
  name: text('name'),
  status: text('status').notNull().default('setup'), // setup | playing | finished
  createdAt: text('created_at').notNull(),
  finishedAt: text('finished_at'),
})

// 牌局玩家 (支持换人, 可能 >4 人)
export const gamePlayers = sqliteTable('game_players', {
  id: text('id').primaryKey(),
  gameId: text('game_id').notNull().references(() => games.id),
  playerId: text('player_id').notNull().references(() => players.id),
  seatPosition: integer('seat_position').notNull(), // 1-4
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  joinedAt: text('joined_at').notNull(),
  leftAt: text('left_at'),
})

// 轮
export const rounds = sqliteTable('rounds', {
  id: text('id').primaryKey(),
  gameId: text('game_id').notNull().references(() => games.id),
  number: integer('number').notNull(),
  starterId: text('starter_id').notNull().references(() => players.id),
  status: text('status').notNull().default('playing'), // playing | finished
  createdAt: text('created_at').notNull(),
})

// 局
export const hands = sqliteTable('hands', {
  id: text('id').primaryKey(),
  roundId: text('round_id').notNull().references(() => rounds.id),
  dealerId: text('dealer_id').notNull().references(() => players.id),
  number: integer('number').notNull(),
  createdAt: text('created_at').notNull(),
})

// 局内事件 (杠/胡/自摸)
export const handEvents = sqliteTable('hand_events', {
  id: text('id').primaryKey(),
  handId: text('hand_id').notNull().references(() => hands.id),
  type: text('type').notNull(), // kong | win | self_draw
  playerId: text('player_id').notNull().references(() => players.id),
  createdAt: text('created_at').notNull(),
})

// 积分变化
export const scoreChanges = sqliteTable('score_changes', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => handEvents.id),
  playerId: text('player_id').notNull().references(() => players.id),
  amount: integer('amount').notNull(),
})
