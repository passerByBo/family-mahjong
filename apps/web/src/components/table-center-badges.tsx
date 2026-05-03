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

  console.log('✅ TableCenterBadges - Rendering', handEvents.length, 'badges in CENTER of table')
  console.log('✅ TableCenterBadges - These badges should PERSIST and appear in TABLE CENTER, not above avatars')

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
      {/* DEBUG: Temporary visible border to see container */}
      <div className="absolute inset-0 border-4 border-pink-500/50 pointer-events-none" />

      <div className="relative w-[80%] h-[80%] flex items-center justify-center">
        {/* DEBUG: Temporary visible border for inner container */}
        <div className="absolute inset-0 border-4 border-blue-500/50 pointer-events-none" />

        {/* Center badges - truly centered in the table */}
        <div className="flex flex-wrap gap-2 justify-center items-center max-w-[60%]">
          {handEvents.map(event => (
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
