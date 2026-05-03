'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { type EventBadgeType } from './event-badge'

interface ScoreChange {
  playerId: string
  playerName: string
  amount: number
}

interface EventFloatingCardProps {
  type: EventBadgeType
  playerName: string
  scoreChanges: ScoreChange[]
  onComplete: () => void
}

const typeLabels: Record<EventBadgeType, string> = {
  'dealer-win': '庄家胡牌',
  'win': '胡牌',
  'dealer-self-draw': '庄家自摸',
  'self-draw': '自摸',
  'kong': '杠',
}

export function EventFloatingCard({ type, playerName, scoreChanges, onComplete }: EventFloatingCardProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [shrinking, setShrinking] = useState(false)

  useEffect(() => {
    setMounted(true)
    requestAnimationFrame(() => {
      setVisible(true)
    })

    const timer = setTimeout(() => {
      setShrinking(true)
      setTimeout(() => {
        onComplete()
      }, 500)
    }, 3000)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!mounted) return null

  const content = (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-[90vw] transition-all duration-500 ${
          shrinking ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">{typeLabels[type]}</h3>
          <p className="text-sm text-gray-600 mt-1">{playerName}</p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">积分变化:</p>
          {scoreChanges.map((sc) => (
            <div key={sc.playerId} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">{sc.playerName}</span>
              <span
                className={`text-sm font-bold ${
                  sc.amount > 0 ? 'text-green-600' : sc.amount < 0 ? 'text-red-600' : 'text-gray-400'
                }`}
              >
                {sc.amount > 0 ? `+${sc.amount}` : sc.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
