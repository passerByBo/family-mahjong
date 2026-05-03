'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarById } from '@/lib/avatars'
import { RefreshCw, Loader2 } from 'lucide-react'
import { EventBadgeContainer, type HandEvent } from './event-badge-container'

interface PlayerSeatProps {
  player: { id: string; name: string; avatar: string }
  score: number
  totalScore?: number
  isDealer: boolean
  position: 'bottom' | 'right' | 'top' | 'left'
  onKong?: () => void
  onWin?: () => void
  onSelfDraw?: () => void
  onRemove?: () => void
  onSwap?: () => void
  showActions?: boolean
  actionLoading?: boolean
  loadingAction?: 'kong' | 'win' | 'self_draw'
  handEvents?: HandEvent[]
}

function formatScore(score: number): string {
  if (score > 0) return `+${score}`
  return `${score}`
}

function scoreColor(score: number): string {
  if (score > 0) return 'text-green-500'
  if (score < 0) return 'text-red-500'
  return 'text-gray-400'
}

const positionStyles: Record<string, string> = {
  bottom: 'flex-col items-center',
  top: 'flex-col items-center',
  left: 'flex-row items-center',
  right: 'flex-row-reverse items-center',
}

export function PlayerSeat({
  player, score, totalScore, isDealer, position, onKong, onWin, onSelfDraw,
  onRemove, onSwap, showActions, actionLoading, loadingAction, handEvents
}: PlayerSeatProps) {
  const avatar = getAvatarById(player.avatar)
  const isVertical = position === 'bottom' || position === 'top'
  const disabled = actionLoading || false

  return (
    <div className={`flex gap-1.5 ${positionStyles[position]}`}>
      <div className="relative">
        <Avatar className={`h-14 w-14 ${isDealer ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-emerald-800' : ''}`}>
          <AvatarImage src={avatar?.path} alt={player.name} />
          <AvatarFallback className="text-sm bg-emerald-600 text-white">
            {player.name[0]}
          </AvatarFallback>
        </Avatar>
        {isDealer && (
          <span className="absolute -top-1 -right-1 text-xs bg-yellow-400 text-yellow-900 rounded-full w-5 h-5 flex items-center justify-center font-bold">
            庄
          </span>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold cursor-pointer hover:bg-red-600"
          >
            ×
          </button>
        )}
        {onSwap && (
          <button
            onClick={onSwap}
            className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-amber-600 shadow-md"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className={`flex flex-col ${position === 'right' ? 'items-end' : position === 'left' ? 'items-start' : 'items-center'}`}>
        <span className="text-white text-sm font-medium truncate max-w-[4rem]">{player.name}</span>
        <span className={`text-sm font-bold ${scoreColor(score)}`}>
          {formatScore(score)}
        </span>
        {totalScore !== undefined && totalScore !== 0 && (
          <span className={`text-xs ${scoreColor(totalScore)} opacity-70`}>
            总{formatScore(totalScore)}
          </span>
        )}
        {handEvents && handEvents.length > 0 && (
          <div className="mt-1">
            <EventBadgeContainer events={handEvents} />
          </div>
        )}
        {showActions && (onKong || onWin || onSelfDraw) && (
          <div className={`flex gap-1.5 mt-1.5 ${isVertical ? 'flex-row' : 'flex-col'}`}>
            {onKong && (
              <button
                onClick={onKong}
                disabled={disabled}
                className="bg-blue-600 text-white text-sm font-medium px-3 py-1.5 min-w-[3rem] rounded-lg cursor-pointer hover:bg-blue-700 shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:active:scale-100 flex items-center justify-center gap-1"
              >
                {loadingAction === 'kong' && <Loader2 className="h-3 w-3 animate-spin" />}
                杠
              </button>
            )}
            {onWin && (
              <button
                onClick={onWin}
                disabled={disabled}
                className="bg-orange-500 text-white text-sm font-medium px-3 py-1.5 min-w-[3rem] rounded-lg cursor-pointer hover:bg-orange-600 shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-orange-500 disabled:active:scale-100 flex items-center justify-center gap-1"
              >
                {loadingAction === 'win' && <Loader2 className="h-3 w-3 animate-spin" />}
                胡
              </button>
            )}
            {onSelfDraw && (
              <button
                onClick={onSelfDraw}
                disabled={disabled}
                className="bg-red-600 text-white text-sm font-medium px-3 py-1.5 min-w-[3rem] rounded-lg cursor-pointer hover:bg-red-700 shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600 disabled:active:scale-100 flex items-center justify-center gap-1"
              >
                {loadingAction === 'self_draw' && <Loader2 className="h-3 w-3 animate-spin" />}
                自摸
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
