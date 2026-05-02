import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roundId: string }> }
) {
  try {
    const { id: gameId, roundId } = await params

    // Verify round belongs to game
    const round = await db.select().from(schema.rounds)
      .where(eq(schema.rounds.id, roundId))
    if (round.length === 0 || round[0].gameId !== gameId) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    // Get all hands in this round
    const handsInRound = await db.select().from(schema.hands)
      .where(eq(schema.hands.roundId, roundId)).orderBy(schema.hands.number)

    const handsWithEvents = []
    for (const hand of handsInRound) {
      const events = await db.select().from(schema.handEvents)
        .where(eq(schema.handEvents.handId, hand.id))

      const eventsWithScores = []
      for (const ev of events) {
        const sc = await db.select().from(schema.scoreChanges)
          .where(eq(schema.scoreChanges.eventId, ev.id))
        eventsWithScores.push({ ...ev, scoreChanges: sc })
      }

      handsWithEvents.push({ ...hand, events: eventsWithScores })
    }

    return NextResponse.json({ round: round[0], hands: handsWithEvents })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch round detail' }, { status: 500 })
  }
}
