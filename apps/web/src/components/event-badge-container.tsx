'use client'

import { EventBadge, type EventBadgeType } from './event-badge'

export interface HandEvent {
  id: string
  type: EventBadgeType
  playerName: string
}

interface EventBadgeContainerProps {
  events: HandEvent[]
  className?: string
}

export function EventBadgeContainer({ events, className }: EventBadgeContainerProps) {
  if (events.length === 0) return null

  return (
    <div className={`flex gap-1.5 overflow-x-auto scrollbar-hide ${className || ''}`}>
      {events.map((event) => (
        <EventBadge key={event.id} type={event.type} playerName={event.playerName} />
      ))}
    </div>
  )
}
