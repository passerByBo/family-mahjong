import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import { generateId, now } from '@/lib/utils'
import { getGameState } from '@/lib/game-state'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params

    // Get current round
    const currentRounds = await db.select().from(schema.rounds)
      .where(and(eq(schema.rounds.gameId, gameId), eq(schema.rounds.status, 'playing')))
    const currentRound = currentRounds[0]
    if (!currentRound) {
      return NextResponse.json({ error: 'No active round' }, { status: 400 })
    }

    // Get current hand
    const currentHands = await db.select().from(schema.hands)
      .where(eq(schema.hands.roundId, currentRound.id)).orderBy(desc(schema.hands.number))
    const currentHand = currentHands[0]
    if (!currentHand) {
      return NextResponse.json({ error: 'No active hand' }, { status: 400 })
    }

    const timestamp = now()

    // Draw = 连庄, same dealer, next hand, no score changes
    await db.insert(schema.hands).values({
      id: generateId(),
      roundId: currentRound.id,
      dealerId: currentHand.dealerId,
      number: currentHand.number + 1,
      createdAt: timestamp,
    })

    const state = await getGameState(gameId)
    return NextResponse.json(state, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process draw' }, { status: 500 })
  }
}
