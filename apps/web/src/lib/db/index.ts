import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import path from 'path'

type AppDb = BetterSQLite3Database<typeof schema>

let _db: AppDb | null = null

function getDb(): AppDb {
  if (_db) return _db

  // Cloudflare 环境：通过 getCloudflareContext 获取 D1 binding
  if (process.env.NODE_ENV === 'production') {
    try {
      // Dynamic imports to avoid bundling in local dev
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getCloudflareContext } = require('@opennextjs/cloudflare')
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { drizzle: drizzleD1 } = require('drizzle-orm/d1')
      const { env } = getCloudflareContext()
      // D1 drizzle API 兼容 better-sqlite3 drizzle API
      _db = drizzleD1(env.DB, { schema }) as unknown as AppDb
      return _db
    } catch {
      // fallback to local sqlite
    }
  }

  // 本地开发：使用 better-sqlite3
  const DB_PATH = path.join(process.cwd(), 'local.db')
  const sqlite = new Database(DB_PATH)
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
