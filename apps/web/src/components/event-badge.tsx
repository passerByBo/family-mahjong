'use client'

import { cn } from '@/lib/utils'

export type EventBadgeType = 'dealer-win' | 'win' | 'dealer-self-draw' | 'self-draw' | 'kong'

interface EventBadgeProps {
  type: EventBadgeType
  playerName: string
  size?: 'default' | 'sm'
  className?: string
}

// Mahjong tile styling configuration - simplified with single characters
const tileConfig: Record<
  EventBadgeType,
  { bgColor: string; textColor: string; label: string }
> = {
  'dealer-win': {
    bgColor: 'bg-yellow-500',
    textColor: 'text-white',
    label: '庄胡',
  },
  win: {
    bgColor: 'bg-green-500',
    textColor: 'text-white',
    label: '胡',
  },
  'dealer-self-draw': {
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    label: '庄炸',
  },
  'self-draw': {
    bgColor: 'bg-purple-500',
    textColor: 'text-white',
    label: '炸',
  },
  kong: {
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
    label: '杠',
  },
}

export function EventBadge({ type, playerName, size = 'default', className }: EventBadgeProps) {
  const config = tileConfig[type]
  const isSmall = size === 'sm'

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        'border-2 rounded-sm shadow-sm',
        'font-bold',
        'pointer-events-auto',
        // Compact mahjong tile - single character display
        isSmall ? 'w-8 h-11 text-base' : 'w-10 h-14 text-lg',
        config.bgColor,
        config.textColor,
        className
      )}
      title={playerName}
    >
      {config.label}
    </div>
  )
}
