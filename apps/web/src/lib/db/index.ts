import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import * as schema from './schema'

type AppDb = BetterSQLite3Database<typeof schema>

let _db: AppDb | null = null

function getDb(): AppDb {
  if (_db) return _db

  // Cloudflare 环境：通过 getCloudflareContext 获取 D1 binding
  // Check if we're in Cloudflare Workers environment
  try {
    const { env } = getCloudflareContext()
    // D1 drizzle API 兼容 better-sqlite3 drizzle API
    const d1Database = (env as unknown as Record<string, unknown>).DB
    if (d1Database) {
      _db = drizzleD1(d1Database, { schema }) as unknown as AppDb
      return _db
    }
  } catch {
    // fallback to local sqlite
  }

  // 本地开发：使用 better-sqlite3
  // In local dev, use local.db in the current working directory
  const sqlite = new Database('local.db')
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  _db = drizzle(sqlite, { schema })
  return _db
}

// Proxy 让现有代码 import { db } from '@/lib/db' 无需改动
export const db: AppDb = new Proxy({} as AppDb, {
  get(_target, prop: string | symbol) {
    const instance = getDb()
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof value === 'function') {
      return (value as Function).bind(instance)
    }
    return value
  },
})

export { schema }
