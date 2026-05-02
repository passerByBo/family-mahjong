'use client'

import { AVATARS, getAvatarById } from '@/lib/avatars'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface AvatarPickerProps {
  value: string
  onChange: (id: string) => void
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {AVATARS.map((avatar) => (
        <button
          key={avatar.id}
          type="button"
          onClick={() => onChange(avatar.id)}
          className={cn(
            'flex flex-col items-center gap-1 rounded-lg p-2 transition-colors hover:bg-accent',
            value === avatar.id &&
              'ring-2 ring-primary bg-accent'
          )}
        >
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatar.path} alt={avatar.name} />
            <AvatarFallback>{avatar.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{avatar.name}</span>
        </button>
      ))}
    </div>
  )
}
