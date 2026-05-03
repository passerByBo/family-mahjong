'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'

interface RoundSummaryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roundNumber: number
  scores: { playerId: string; name: string; amount: number }[]
  events: { playerId: string; type: string; isDealer: boolean }[]
  dealerCounts: Record<string, number>
  onNextRound: () => void
}

export function RoundSummary({
  open, onOpenChange, roundNumber, scores, events, dealerCounts, onNextRound,
}: RoundSummaryProps) {
  const sorted = [...scores].sort((a, b) => b.amount - a.amount)

  // Build stats per player
  const statsMap: Record<string, {
    name: string
    win: number
    winAsDealer: number
    self_draw: number
    selfDrawAsDealer: number
    kong: number
  }> = {}

  for (const s of scores) {
    statsMap[s.playerId] = {
      name: s.name,
      win: 0,
      winAsDealer: 0,
      self_draw: 0,
      selfDrawAsDealer: 0,
      kong: 0
    }
  }

  for (const e of events) {
    if (statsMap[e.playerId]) {
      if (e.type === 'win') {
        statsMap[e.playerId].win++
        if (e.isDealer) statsMap[e.playerId].winAsDealer++
      } else if (e.type === 'self_draw') {
        statsMap[e.playerId].self_draw++
        if (e.isDealer) statsMap[e.playerId].selfDrawAsDealer++
      } else if (e.type === 'kong') {
        statsMap[e.playerId].kong++
      }
    }
  }

  const playerStats = Object.values(statsMap).filter(
    s => s.win > 0 || s.self_draw > 0 || s.kong > 0
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>第{roundNumber}轮结束</DialogTitle>
          <DialogDescription>本轮积分排行</DialogDescription>
        </DialogHeader>

        {/* Statistics section */}
        {playerStats.length > 0 && (
          <div className="space-y-1 py-2">
            <h4 className="text-sm font-semibold text-muted-foreground">本轮统计</h4>
            {playerStats.map(s => {
              const parts: string[] = []
              if (s.win > 0) {
                parts.push(`胡×${s.win}${s.winAsDealer > 0 ? `(坐庄${s.winAsDealer}次)` : ''}`)
              }
              if (s.self_draw > 0) {
                parts.push(`自摸×${s.self_draw}${s.selfDrawAsDealer > 0 ? `(坐庄${s.selfDrawAsDealer}次)` : ''}`)
              }
              if (s.kong > 0) {
                parts.push(`杠×${s.kong}`)
              }
              return (
                <div key={s.name} className="text-sm px-3">
                  <span className="font-medium">{s.name}: </span>
                  {parts.join(' ')}
                </div>
              )
            })}
          </div>
        )}

        {/* Dealer counts section */}
        {Object.keys(dealerCounts).length > 0 && (
          <div className="space-y-1 py-2 border-t">
            <h4 className="text-sm font-semibold text-muted-foreground">坐庄次数</h4>
            {scores.map(s => {
              const count = dealerCounts[s.playerId] || 0
              if (count === 0) return null
              return (
                <div key={s.playerId} className="text-sm px-3">
                  <span className="font-medium">{s.name}: </span>
                  <span>坐庄×{count}次</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Scores ranking */}
        <div className="space-y-2 py-2">
          {sorted.map((s, idx) => (
            <div
              key={s.playerId}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-muted-foreground w-6">
                  {idx + 1}
                </span>
                <span className="font-medium">{s.name}</span>
              </div>
              <span
                className={`text-lg font-bold ${
                  s.amount > 0 ? 'text-green-600' : s.amount < 0 ? 'text-red-600' : 'text-gray-400'
                }`}
              >
                {s.amount > 0 ? `+${s.amount}` : s.amount}
              </span>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button className="w-full" onClick={onNextRound}>
            确认并开始下一轮
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
