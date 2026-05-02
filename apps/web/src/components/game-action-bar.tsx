'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'

interface GameActionBarProps {
  roundNumber: number
  handNumber: number
  dealerName: string
  players: { id: string; name: string }[]
  onDraw: () => void
  onUndo: () => void
  onEndGame: () => void
  onSetDealer: (playerId: string) => void
  onBack: () => void
}

export function GameActionBar({
  roundNumber, handNumber, dealerName, players,
  onDraw, onUndo, onEndGame, onSetDealer, onBack,
}: GameActionBarProps) {
  const [drawDialogOpen, setDrawDialogOpen] = useState(false)
  const [undoDialogOpen, setUndoDialogOpen] = useState(false)
  const [endDialogOpen, setEndDialogOpen] = useState(false)
  const [dealerDialogOpen, setDealerDialogOpen] = useState(false)

  return (
    <>
      <div className="bg-emerald-950/90 backdrop-blur-sm border-t border-emerald-700/50 px-4 py-2 space-y-2">
        {/* Status line */}
        <div className="flex items-center justify-center gap-4 text-emerald-300/80 text-sm">
          <span>第{roundNumber}轮</span>
          <span className="text-emerald-600">·</span>
          <span>第{handNumber}局</span>
          <span className="text-emerald-600">·</span>
          <span>庄: {dealerName}</span>
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-1.5 justify-center">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 max-w-[4.5rem] border-yellow-500/50 text-yellow-300 bg-emerald-900/50 hover:bg-yellow-900/30 text-xs"
            onClick={() => setDealerDialogOpen(true)}
          >
            设庄
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 max-w-[4.5rem] border-emerald-600/50 text-emerald-200 bg-emerald-900/50 hover:bg-emerald-800/70 text-xs"
            onClick={() => setDrawDialogOpen(true)}
          >
            流局
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 max-w-[4.5rem] border-emerald-600/50 text-emerald-200 bg-emerald-900/50 hover:bg-emerald-800/70 text-xs"
            onClick={() => setUndoDialogOpen(true)}
          >
            撤销
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 max-w-[4.5rem] border-red-500/40 text-red-300 bg-emerald-900/50 hover:bg-red-900/30 text-xs"
            onClick={() => setEndDialogOpen(true)}
          >
            结束
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 max-w-[4.5rem] border-emerald-600/50 text-emerald-200 bg-emerald-900/50 hover:bg-emerald-800/70 text-xs"
            onClick={onBack}
          >
            返回
          </Button>
        </div>
      </div>

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

      {/* Set dealer dialog */}
      <Dialog open={dealerDialogOpen} onOpenChange={setDealerDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>设置庄家</DialogTitle>
            <DialogDescription>选择庄家，将从该庄家开始新一轮</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {players.map(p => (
              <Button
                key={p.id}
                variant="outline"
                className="h-12"
                onClick={() => { onSetDealer(p.id); setDealerDialogOpen(false) }}
              >
                {p.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
