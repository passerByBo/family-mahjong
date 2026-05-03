'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { type EventBadgeType } from './event-badge'
import { Button } from '@/components/ui/button'

interface ScoreChange {
  playerId: string
  playerName: string
  amount: number
}

interface EventFloatingCardProps {
  type: EventBadgeType
  playerName: string
  scoreChanges: ScoreChange[]
  countdown?: number
  onConfirm?: () => void
  onCancel?: () => void
  onComplete?: () => void
}

const typeLabels: Record<EventBadgeType, string> = {
  'dealer-win': '庄家胡牌',
  'win': '胡牌',
  'dealer-self-draw': '庄家自摸',
  'self-draw': '自摸',
  'kong': '杠',
}

const getEventColors = (type: EventBadgeType) => {
  switch (type) {
    case 'dealer-win':
      return { bg: 'bg-yellow-500', backdrop: 'bg-yellow-500/20', text: 'text-yellow-950' }
    case 'win':
      return { bg: 'bg-green-500', backdrop: 'bg-green-500/20', text: 'text-green-950' }
    case 'dealer-self-draw':
      return { bg: 'bg-blue-500', backdrop: 'bg-blue-500/20', text: 'text-blue-950' }
    case 'self-draw':
      return { bg: 'bg-purple-500', backdrop: 'bg-purple-500/20', text: 'text-purple-950' }
    case 'kong':
      return { bg: 'bg-orange-500', backdrop: 'bg-orange-500/20', text: 'text-orange-950' }
  }
}

export function EventFloatingCard({
  type,
  playerName,
  scoreChanges,
  countdown: initialCountdown,
  onConfirm,
  onCancel,
  onComplete
}: EventFloatingCardProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [shrinking, setShrinking] = useState(false)
  const [countdown, setCountdown] = useState(initialCountdown || 0)

  const isConfirmationMode = initialCountdown !== undefined && onConfirm && onCancel

  useEffect(() => {
    setMounted(true)
    requestAnimationFrame(() => {
      setVisible(true)
    })

    if (isConfirmationMode && initialCountdown) {
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            setShrinking(true)
            setTimeout(() => {
              onConfirm?.()
            }, 500)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    } else {
      const timer = setTimeout(() => {
        setShrinking(true)
        setTimeout(() => {
          onComplete?.()
        }, 500)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isConfirmationMode, initialCountdown, onConfirm, onComplete])

  const handleCancel = () => {
    setShrinking(true)
    setTimeout(() => {
      onCancel?.()
    }, 300)
  }

  if (!mounted) return null

  const colors = getEventColors(type)

  const content = (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`${colors.bg} rounded-2xl shadow-2xl p-6 max-w-sm w-[90vw] pointer-events-auto transition-all duration-500 ${
          shrinking ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-3">
            <h3 className={`text-xl font-bold ${colors.text}`}>{typeLabels[type]}</h3>
            {isConfirmationMode && countdown > 0 && (
              <div className={`text-3xl font-bold ${colors.text} min-w-[2rem] text-center`}>
                {countdown}
              </div>
            )}
          </div>
          <p className={`text-sm ${colors.text} opacity-80 mt-1`}>{playerName}</p>
        </div>
        <div className="space-y-2">
          <p className={`text-sm font-medium ${colors.text} opacity-90`}>积分变化:</p>
          {scoreChanges.map((sc) => (
            <div key={sc.playerId} className={`flex justify-between items-center px-3 py-2 ${colors.bg} brightness-95 rounded-lg`}>
              <span className={`text-sm font-medium ${colors.text}`}>{sc.playerName}</span>
              <span
                className={`text-sm font-bold ${colors.text} ${
                  sc.amount > 0 ? 'opacity-100' : sc.amount < 0 ? 'opacity-70' : 'opacity-40'
                }`}
              >
                {sc.amount > 0 ? `+${sc.amount}` : sc.amount}
              </span>
            </div>
          ))}
        </div>
        {isConfirmationMode && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={handleCancel}
              className={`${colors.text} border-current hover:bg-black/10`}
            >
              取消
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
