'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { getAvatarById } from '@/lib/avatars'

interface DealerPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  players: { id: string; name: string; avatar: string }[]
  onConfirm: (dealerId: string) => void
}

export function DealerPickerDialog({
  open, onOpenChange, players, onConfirm,
}: DealerPickerDialogProps) {
  const [selectedId, setSelectedId] = useState<string>(players[0]?.id ?? '')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>选择起始庄家</DialogTitle>
          <DialogDescription>选择谁先坐庄</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          {players.map(p => {
            const avatar = getAvatarById(p.avatar)
            const isSelected = p.id === selectedId
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`relative flex items-center gap-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                  isSelected ? 'border-yellow-400 bg-yellow-400/10' : 'border-muted hover:bg-muted/50'
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatar?.path} alt={p.name} />
                  <AvatarFallback className="text-sm bg-emerald-600 text-white">
                    {p.name[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{p.name}</span>
                {isSelected && (
                  <Badge className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs">
                    庄
                  </Badge>
                )}
              </button>
            )
          })}
        </div>
        <DialogFooter>
          <Button className="w-full" onClick={() => onConfirm(selectedId)}>
            确认开始
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
