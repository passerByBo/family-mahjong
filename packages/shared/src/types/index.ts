// 玩家类型
export interface Player {
  id: string
  name: string
  avatar?: string
}

// 游戏记录类型
export interface GameRecord {
  id: string
  date: string
  players: Player[]
  scores: Record<string, number>
  winner?: string
  createdAt: string
  updatedAt: string
}

// 游戏统计类型
export interface PlayerStats {
  playerId: string
  totalGames: number
  wins: number
  totalScore: number
  averageScore: number
  winRate: number
}
