'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Game {
  id: string
  status: string
  createdAt: string
  finishedAt: string | null
}

interface GameWithPlayers extends Game {
  playerNames: string[]
  totalScores: Record<string, number>
}

export default function HistoryPage() {
  const router = useRouter()
  const [games, setGames] = useState<GameWithPlayers[]>([])
  const [loading, setLoading] = useState(true)
  const [playerMap, setPlayerMap] = useState<Record<string, string>>({})

  const fetchData = useCallback(async () => {
    try {
      const [gamesRes, playersRes] = await Promise.all([
        fetch('/api/games?status=finished'),
        fetch('/api/players'),
      ])

      let pMap: Record<string, string> = {}
      if (playersRes.ok) {
        const players = await playersRes.json()
        players.forEach((p: { id: string; name: string }) => { pMap[p.id] = p.name })
        setPlayerMap(pMap)
      }

      if (gamesRes.ok) {
        const gamesList: Game[] = await gamesRes.json()
        // Fetch summary for each game to get player scores
        const gamesWithDetails: GameWithPlayers[] = []
        for (const game of gamesList) {
          try {
            const summaryRes = await fetch(`/api/games/${game.id}/summary`)
            if (summaryRes.ok) {
              const summary = await summaryRes.json()
              const playerIds = summary.ranking.map((r: { playerId: string }) => r.playerId)
              const scores: Record<string, number> = {}
              summary.ranking.forEach((r: { playerId: string; score: number }) => {
                scores[r.playerId] = r.score
              })
              gamesWithDetails.push({
                ...game,
                playerNames: playerIds.map((id: string) => pMap[id] || '未知'),
                totalScores: scores,
              })
            }
          } catch {
            gamesWithDetails.push({ ...game, playerNames: [], totalScores: {} })
          }
        }
        setGames(gamesWithDetails.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ))
      }
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const formatScore = (score: number) => {
    if (score > 0) return `+${score}`
    return `${score}`
  }

  const scoreColor = (score: number) => {
    if (score > 0) return 'text-green-600'
    if (score < 0) return 'text-red-600'
    return 'text-gray-400'
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 px-4 pt-8 pb-6 text-white">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold drop-shadow">历史牌局</h1>
          <Button variant="outline" size="sm" onClick={() => router.push('/')} className="bg-white/20 hover:bg-white/30 text-white border-0">
            返回首页
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto -mt-3">

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">加载中...</div>
        ) : games.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">还没有已结束的牌局</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {games.map(game => {
              const scores = Object.entries(game.totalScores)
                .map(([playerId, score]) => ({ playerId, name: playerMap[playerId] || '未知', score }))
                .sort((a, b) => b.score - a.score)

              return (
                <Card
                  key={game.id}
                  className="cursor-pointer hover:bg-accent/50 transition-all shadow-sm hover:shadow-md"
                  onClick={() => router.push(`/games/${game.id}/summary`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(game.createdAt)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {game.playerNames.join(' / ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {scores.map(s => (
                        <div key={s.playerId} className="text-center">
                          <div className="text-xs text-muted-foreground truncate">{s.name}</div>
                          <div className={`text-sm font-bold ${scoreColor(s.score)}`}>
                            {formatScore(s.score)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
