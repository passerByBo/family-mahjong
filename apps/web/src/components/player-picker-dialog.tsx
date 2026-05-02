'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { getAvatarById } from '@/lib/avatars'

interface PlayerPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  excludePlayerIds: string[]
  onSelect: (playerId: string) => void
}

interface Player {
  id: string
  name: string
  avatar: string
}

export function PlayerPickerDialog({
  open, onOpenChange, excludePlayerIds, onSelect,
}: PlayerPickerDialogProps) {
  const [players, setPlayers] = useState<Player[]>([])

  useEffect(() => {
    if (!open) return
    fetch('/api/players')
      .then(res => res.json())
      .then(data => setPlayers(data))
      .catch(() => setPlayers([]))
  }, [open])

  const available = players.filter(p => !excludePlayerIds.includes(p.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>选择玩家</DialogTitle>
          <DialogDescription>点击选择一位玩家入座</DialogDescription>
        </DialogHeader>
        {available.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>没有可选的玩家</p>
            <Link href="/players" className="text-primary underline text-sm mt-2 inline-block">
              去添加玩家
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 py-2">
            {available.map(p => {
              const avatar = getAvatarById(p.avatar)
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelect(p.id)
                    onOpenChange(false)
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={avatar?.path} alt={p.name} />
                    <AvatarFallback className="text-sm bg-emerald-600 text-white">
                      {p.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{p.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
