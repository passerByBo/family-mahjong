'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'

interface GameStatusBarProps {
  roundNumber: number
  handNumber: number
  dealerName: string
  gameId: string
  allPlayers: { id: string; name: string }[]
  availablePlayers: { id: string; name: string }[]
  onDraw: () => void
  onUndo: () => void
  onSwap: (outPlayerId: string, inPlayerId: string) => void
  onSeatChange: (seatOrder: { playerId: string; position: number }[]) => void
  onEndGame: () => void
}

export function GameStatusBar({
  roundNumber, handNumber, dealerName, gameId,
  allPlayers, availablePlayers,
  onDraw, onUndo, onSwap, onSeatChange, onEndGame,
}: GameStatusBarProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [swapDialogOpen, setSwapDialogOpen] = useState(false)
  const [seatDialogOpen, setSeatDialogOpen] = useState(false)
  const [endDialogOpen, setEndDialogOpen] = useState(false)
  const [drawDialogOpen, setDrawDialogOpen] = useState(false)
  const [undoDialogOpen, setUndoDialogOpen] = useState(false)
  const [swapOut, setSwapOut] = useState<string>('')
  const [swapIn, setSwapIn] = useState<string>('')
  const [seatOrder, setSeatOrder] = useState<{ playerId: string; position: number }[]>([])

  const openSwapDialog = () => {
    setSwapOut('')
    setSwapIn('')
    setSwapDialogOpen(true)
    setMoreOpen(false)
  }

  const openSeatDialog = () => {
    setSeatOrder(allPlayers.map((p, i) => ({ playerId: p.id, position: i + 1 })))
    setSeatDialogOpen(true)
    setMoreOpen(false)
  }

  const swapSeatPositions = (idx1: number, idx2: number) => {
    const newOrder = [...seatOrder]
    const temp = newOrder[idx1].position
    newOrder[idx1] = { ...newOrder[idx1], position: newOrder[idx2].position }
    newOrder[idx2] = { ...newOrder[idx2], position: temp }
    setSeatOrder(newOrder.sort((a, b) => a.position - b.position))
  }

  // Players not currently in the game (for swap-in)
  const outsidePlayers = availablePlayers.filter(
    p => !allPlayers.some(ap => ap.id === p.id)
  )

  return (
    <>
      {/* Status info */}
      <div className="flex items-center justify-between px-4 py-2 bg-emerald-900/80 text-white text-sm">
        <div className="flex gap-3">
          <span>第{roundNumber}轮</span>
          <span>第{handNumber}局</span>
          <span>庄: {dealerName}</span>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-900/60">
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-white/30 text-white bg-transparent hover:bg-white/10"
          onClick={() => setDrawDialogOpen(true)}
        >
          流局
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-white/30 text-white bg-transparent hover:bg-white/10"
          onClick={() => setUndoDialogOpen(true)}
        >
          撤销
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-white/30 text-white bg-transparent hover:bg-white/10"
          onClick={openSwapDialog}
        >
          换人
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-white/30 text-white bg-transparent hover:bg-white/10"
          onClick={() => setMoreOpen(!moreOpen)}
        >
          更多...
        </Button>
      </div>

      {/* More options */}
      {moreOpen && (
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-900/40">
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-white/30 text-white bg-transparent hover:bg-white/10"
            onClick={openSeatDialog}
          >
            换位次
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-red-400/50 text-red-300 bg-transparent hover:bg-red-900/30"
            onClick={() => { setEndDialogOpen(true); setMoreOpen(false) }}
          >
            结束牌局
          </Button>
        </div>
      )}

      {/* Draw dialog */}
      <Dialog open={drawDialogOpen} onOpenChange={setDrawDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>流局</DialogTitle>
            <DialogDescription>本局流局，不计分，继续下一局。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDrawDialogOpen(false)}>取消</Button>
            <Button onClick={() => { onDraw(); setDrawDialogOpen(false) }}>确认流局</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Undo dialog */}
      <Dialog open={undoDialogOpen} onOpenChange={setUndoDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>撤销</DialogTitle>
            <DialogDescription>撤销上一次操作，此操作不可恢复。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUndoDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={() => { onUndo(); setUndoDialogOpen(false) }}>确认撤销</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Swap player dialog - PLACEHOLDER_SWAP */}
      <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>换人</DialogTitle>
            <DialogDescription>选择要替换的玩家</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-2 block">换出玩家</label>
              <div className="grid grid-cols-2 gap-2">
                {allPlayers.map(p => (
                  <Button
                    key={p.id}
                    variant={swapOut === p.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSwapOut(p.id)}
                  >
                    {p.name}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">换入玩家</label>
              {outsidePlayers.length === 0 ? (
                <p className="text-sm text-muted-foreground">没有可替换的玩家</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {outsidePlayers.map(p => (
                    <Button
                      key={p.id}
                      variant={swapIn === p.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSwapIn(p.id)}
                    >
                      {p.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwapDialogOpen(false)}>取消</Button>
            <Button
              disabled={!swapOut || !swapIn}
              onClick={() => { onSwap(swapOut, swapIn); setSwapDialogOpen(false) }}
            >
              确认换人
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Seat change dialog */}
      <Dialog open={seatDialogOpen} onOpenChange={setSeatDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>换位次</DialogTitle>
            <DialogDescription>点击两个位置交换座位</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {['下 (自己)', '右', '上 (对面)', '左'].map((label, idx) => {
              const seat = seatOrder[idx]
              const player = seat ? allPlayers.find(p => p.id === seat.playerId) : null
              return (
                <div key={idx} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm text-muted-foreground w-20">{label}</span>
                  <span className="text-sm font-medium flex-1">{player?.name || '-'}</span>
                  <div className="flex gap-1">
                    {idx > 0 && (
                      <Button size="sm" variant="ghost" onClick={() => swapSeatPositions(idx, idx - 1)}>
                        上移
                      </Button>
                    )}
                    {idx < 3 && (
                      <Button size="sm" variant="ghost" onClick={() => swapSeatPositions(idx, idx + 1)}>
                        下移
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeatDialogOpen(false)}>取消</Button>
            <Button onClick={() => { onSeatChange(seatOrder); setSeatDialogOpen(false) }}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End game dialog */}
      <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>结束牌局</DialogTitle>
            <DialogDescription>确定要结束当前牌局吗？结束后将跳转到牌局总结页面。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEndDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={() => { onEndGame(); setEndDialogOpen(false) }}>
              结束牌局
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
