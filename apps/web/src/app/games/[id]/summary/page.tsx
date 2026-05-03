'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RoundSummaryData {
  roundId: string
  number: number
  status: string
  scores: Record<string, number>
}

interface PlayerStats {
  totalWins: number
  dealerWins: number
  nonDealerWins: number
  totalSelfDraws: number
  dealerSelfDraws: number
  nonDealerSelfDraws: number
  totalKongs: number
}

interface SummaryData {
  ranking: { playerId: string; score: number }[]
  roundSummaries: RoundSummaryData[]
  playerStats: Record<string, PlayerStats>
}

export default function GameSummaryPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.id as string

  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [playerMap, setPlayerMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, playersRes] = await Promise.all([
        fetch(`/api/games/${gameId}/summary`),
        fetch('/api/players'),
      ])
      if (summaryRes.ok) {
        setSummary(await summaryRes.json())
      }
      if (playersRes.ok) {
        const players = await playersRes.json()
        const map: Record<string, string> = {}
        players.forEach((p: { id: string; name: string }) => { map[p.id] = p.name })
        setPlayerMap(map)
      }
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [gameId])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleRound = (roundId: string) => {
    const next = new Set(expandedRounds)
    if (next.has(roundId)) next.delete(roundId)
    else next.add(roundId)
    setExpandedRounds(next)
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">加载中...</div>
  }

  if (!summary) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">数据加载失败</div>
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="px-4 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">牌局总结</h1>

        {/* Total ranking */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">总积分排行</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.ranking.map((r, idx) => (
              <div
                key={r.playerId}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${idx === 0 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                    {idx + 1}
                  </span>
                  <span className="font-medium text-lg">{playerMap[r.playerId] || '未知'}</span>
                </div>
                <span className={`text-2xl font-bold ${scoreColor(r.score)}`}>
                  {formatScore(r.score)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Player Statistics */}
        {summary.playerStats && Object.keys(summary.playerStats).length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-3 mt-6">详细统计</h2>
            <div className="space-y-3 mb-6">
              {summary.ranking.map((r) => {
                const stats = summary.playerStats[r.playerId]
                if (!stats) return null

                return (
                  <Card key={r.playerId}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        {playerMap[r.playerId] || '未知'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Wins */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground mb-1">胡牌次数</div>
                          <div className="text-2xl font-bold">{stats.totalWins}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            坐庄: {stats.dealerWins} | 普通: {stats.nonDealerWins}
                          </div>
                        </div>

                        {/* Self-draws */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground mb-1">自摸次数</div>
                          <div className="text-2xl font-bold">{stats.totalSelfDraws}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            坐庄: {stats.dealerSelfDraws} | 普通: {stats.nonDealerSelfDraws}
                          </div>
                        </div>

                        {/* Kongs */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground mb-1">杠次数</div>
                          <div className="text-2xl font-bold">{stats.totalKongs}</div>
                        </div>

                        {/* Win Rate */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground mb-1">坐庄胡率</div>
                          <div className="text-2xl font-bold">
                            {stats.dealerWins > 0
                              ? `${((stats.dealerWins / stats.totalWins) * 100).toFixed(0)}%`
                              : '0%'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}

        {/* Round details */}
        <h2 className="text-lg font-semibold mb-3">每轮明细</h2>
        <div className="space-y-3 mb-6">
          {summary.roundSummaries.map(round => {
            const isExpanded = expandedRounds.has(round.roundId)
            const roundScores = Object.entries(round.scores)
              .map(([playerId, score]) => ({ playerId, score }))
              .sort((a, b) => b.score - a.score)

            return (
              <Card key={round.roundId}>
                <CardContent
                  className="p-3 cursor-pointer"
                  onClick={() => toggleRound(round.roundId)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">第{round.number}轮</span>
                    <span className="text-sm text-muted-foreground">
                      {isExpanded ? '收起' : '展开'}
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 space-y-2">
                      {roundScores.map(rs => (
                        <div key={rs.playerId} className="flex justify-between items-center px-2">
                          <span className="text-sm">{playerMap[rs.playerId] || '未知'}</span>
                          <span className={`text-sm font-bold ${scoreColor(rs.score)}`}>
                            {formatScore(rs.score)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Button className="w-full" size="lg" onClick={() => router.push('/')}>
          返回首页
        </Button>
      </div>
    </div>
  )
}
