'use client'

import { EventBadge } from './event-badge'
import { type HandEvent } from './event-badge-container'

interface Player {
  id: string
  name: string
  seatPosition: number
}

interface TableCenterBadgesProps {
  handEvents: HandEvent[]
  players: Player[]
}

export function TableCenterBadges({ handEvents, players }: TableCenterBadgesProps) {
  console.log('🔍 TableCenterBadges - Received handEvents:', handEvents)
  console.log('🔍 TableCenterBadges - Received players:', players)

  if (handEvents.length === 0) {
    console.log('🔍 TableCenterBadges - No events, returning null')
    return null
  }

  // Group events by player seat position
  const eventsByPosition: Record<number, HandEvent[]> = {
    1: [],
    2: [],
    3: [],
    4: []
  }

  handEvents.forEach(event => {
    const player = players.find(p => p.name === event.playerName)
    if (player) {
      eventsByPosition[player.seatPosition].push(event)
    }
  })

  console.log('✅ TableCenterBadges - Events grouped by position:', eventsByPosition)
  console.log('✅ TableCenterBadges - Badges will appear in front of each player like real mahjong')

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
      <div className="grid grid-cols-3 grid-rows-3 gap-3 w-full h-full p-4">
        {/* Top row - Player at seat 3 */}
        <div className="col-start-2 row-start-1 flex flex-wrap gap-2 justify-center items-start">
          {eventsByPosition[3].map(event => (
            <EventBadge
              key={event.id}
              type={event.type}
              playerName={event.playerName}
              size="default"
            />
          ))}
        </div>

        {/* Right column - Player at seat 2 */}
        <div className="col-start-3 row-start-2 flex flex-col flex-wrap gap-2 items-end justify-center">
          {eventsByPosition[2].map(event => (
            <EventBadge
              key={event.id}
              type={event.type}
              playerName={event.playerName}
              size="default"
            />
          ))}
        </div>

        {/* Bottom row - Player at seat 1 */}
        <div className="col-start-2 row-start-3 flex flex-wrap gap-2 justify-center items-end">
          {eventsByPosition[1].map(event => (
            <EventBadge
              key={event.id}
              type={event.type}
              playerName={event.playerName}
              size="default"
            />
          ))}
        </div>

        {/* Left column - Player at seat 4 */}
        <div className="col-start-1 row-start-2 flex flex-col flex-wrap gap-2 items-start justify-center">
          {eventsByPosition[4].map(event => (
            <EventBadge
              key={event.id}
              type={event.type}
              playerName={event.playerName}
              size="default"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
