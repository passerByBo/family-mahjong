'use client'

import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { getAvatarById } from '@/lib/avatars'

interface SwapPlayerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  outPlayerId: string
  inGamePlayers: { id: string; name: string; avatar: string }[]
  onSelectInGame: (playerId: string) => void
  onSelectOutside: (playerId: string) => void
}

interface Player {
  id: string
  name: string
  avatar: string
}

export function SwapPlayerDialog({
  open, onOpenChange, outPlayerId, inGamePlayers, onSelectInGame, onSelectOutside,
}: SwapPlayerDialogProps) {
  const [allPlayers, setAllPlayers] = useState<Player[]>([])

  useEffect(() => {
    if (!open) return
    fetch('/api/players')
      .then(res => res.json())
      .then(data => setAllPlayers(data))
      .catch(() => setAllPlayers([]))
  }, [open])

  const inGameIds = inGamePlayers.map(p => p.id)
  const otherInGame = inGamePlayers.filter(p => p.id !== outPlayerId)
  const outsidePlayers = allPlayers.filter(p => !inGameIds.includes(p.id))
  const outPlayerName = inGamePlayers.find(p => p.id === outPlayerId)?.name || ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>换人 — {outPlayerName}</DialogTitle>
          <DialogDescription>选择在场玩家互换位置，或选择场外玩家替换</DialogDescription>
        </DialogHeader>

        {otherInGame.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">在场玩家（互换位置）</p>
            <div className="grid grid-cols-2 gap-2">
              {otherInGame.map(p => {
                const avatar = getAvatarById(p.avatar)
                return (
                  <button
                    key={p.id}
                    onClick={() => { onSelectInGame(p.id); onOpenChange(false) }}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-amber-300/50 bg-amber-50/50 hover:bg-amber-100/70 transition-colors cursor-pointer"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatar?.path} alt={p.name} />
                      <AvatarFallback className="text-xs bg-emerald-600 text-white">{p.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{p.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {outsidePlayers.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">场外玩家（替换上场）</p>
            <div className="grid grid-cols-2 gap-2">
              {outsidePlayers.map(p => {
                const avatar = getAvatarById(p.avatar)
                return (
                  <button
                    key={p.id}
                    onClick={() => { onSelectOutside(p.id); onOpenChange(false) }}
                    className="flex items-center gap-2 p-2.5 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatar?.path} alt={p.name} />
                      <AvatarFallback className="text-xs bg-emerald-600 text-white">{p.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{p.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {otherInGame.length === 0 && outsidePlayers.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <p>没有可选的玩家</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
