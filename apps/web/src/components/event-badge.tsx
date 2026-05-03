'use client'

import { cn } from '@/lib/utils'

export type EventBadgeType = 'dealer-win' | 'win' | 'dealer-self-draw' | 'self-draw' | 'kong'

interface EventBadgeProps {
  type: EventBadgeType
  playerName: string
  size?: 'default' | 'sm'
  className?: string
}

// Mahjong tile styling configuration
const tileConfig: Record<
  EventBadgeType,
  { borderColor: string; textColor: string; label: string }
> = {
  'dealer-win': {
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-600',
    label: '庄胡',
  },
  win: {
    borderColor: 'border-green-500',
    textColor: 'text-green-600',
    label: '普通胡',
  },
  'dealer-self-draw': {
    borderColor: 'border-blue-500',
    textColor: 'text-blue-600',
    label: '庄自摸',
  },
  'self-draw': {
    borderColor: 'border-purple-500',
    textColor: 'text-purple-600',
    label: '普通自摸',
  },
  kong: {
    borderColor: 'border-orange-500',
    textColor: 'text-orange-600',
    label: '杠',
  },
}

export function EventBadge({ type, playerName, size = 'default', className }: EventBadgeProps) {
  const config = tileConfig[type]
  const isSmall = size === 'sm'

  // Split label into characters for vertical display
  const labelChars = config.label.split('')

  return (
    <div
      className={cn(
        'relative inline-flex flex-col items-center justify-center',
        'bg-gradient-to-br from-gray-50 to-white',
        'border-2 rounded-sm shadow-md',
        'font-bold leading-tight',
        // Size variants - mahjong tile proportions (3:4 ratio)
        isSmall ? 'w-8 h-11 text-[10px] gap-0' : 'w-10 h-14 text-xs gap-0.5',
        config.borderColor,
        config.textColor,
        className
      )}
      title={playerName}
    >
      {/* Vertical text layout */}
      {labelChars.map((char, index) => (
        <span key={index} className="block">
          {char}
        </span>
      ))}
    </div>
  )
}
