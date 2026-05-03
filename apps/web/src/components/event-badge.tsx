'use client'

import { cn } from '@/lib/utils'

export type EventBadgeType = 'dealer-win' | 'win' | 'dealer-self-draw' | 'self-draw' | 'kong'

interface EventBadgeProps {
  type: EventBadgeType
  playerName: string
  size?: 'default' | 'sm'
  className?: string
}

const badgeConfig: Record<EventBadgeType, { bg: string; text: string; icon: string; label: string }> = {
  'dealer-win': { bg: 'bg-yellow-500', text: 'text-yellow-950', icon: '🟡', label: '庄胡' },
  'win': { bg: 'bg-green-500', text: 'text-white', icon: '🟢', label: '胡' },
  'dealer-self-draw': { bg: 'bg-blue-500', text: 'text-white', icon: '🔵', label: '庄自摸' },
  'self-draw': { bg: 'bg-purple-500', text: 'text-white', icon: '🟣', label: '自摸' },
  'kong': { bg: 'bg-orange-500', text: 'text-white', icon: '🟠', label: '杠' },
}

export function EventBadge({ type, playerName, size = 'default', className }: EventBadgeProps) {
  const config = badgeConfig[type]
  const isSmall = size === 'sm'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium shadow-sm whitespace-nowrap',
        isSmall ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
        config.bg,
        config.text,
        className
      )}
    >
      <span className={isSmall ? 'text-[8px]' : 'text-[10px]'}>{config.icon}</span>
      <span className={cn('truncate', isSmall ? 'max-w-[3rem]' : 'max-w-[4rem]')}>{playerName}</span>
      <span className="font-semibold">{config.label}</span>
    </div>
  )
}
