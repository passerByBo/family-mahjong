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
        'border-[3px] rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.4)]',
        'font-bold leading-tight',
        'pointer-events-auto',
        // Size variants - mahjong tile proportions (3:4 ratio) - increased size for better visibility
        isSmall ? 'w-12 h-16 text-sm gap-0.5' : 'w-14 h-[4.5rem] text-base gap-1',
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
