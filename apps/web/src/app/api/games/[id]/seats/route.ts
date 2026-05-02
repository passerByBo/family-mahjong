import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    const body = await request.json()
    const { seatOrder, newDealerId } = body as {
      seatOrder: { playerId: string; position: number }[]
      newDealerId?: string
    }

    if (!seatOrder || !Array.isArray(seatOrder)) {
      return NextResponse.json({ error: 'seatOrder is required' }, { status: 400 })
    }

    // Update seat positions
    for (const seat of seatOrder) {
      await db.update(schema.gamePlayers)
        .set({ seatPosition: seat.position })
        .where(and(
          eq(schema.gamePlayers.gameId, gameId),
          eq(schema.gamePlayers.playerId, seat.playerId),
          eq(schema.gamePlayers.isActive, true),
        ))
    }

    // Update dealer if provided
    if (newDealerId) {
      const currentRounds = await db.select().from(schema.rounds)
        .where(and(eq(schema.rounds.gameId, gameId), eq(schema.rounds.status, 'playing')))
      const currentRound = currentRounds[0]
      if (currentRound) {
        const currentHands = await db.select().from(schema.hands)
          .where(eq(schema.hands.roundId, currentRound.id)).orderBy(desc(schema.hands.number))
        const currentHand = currentHands[0]
        if (currentHand) {
          await db.update(schema.hands)
            .set({ dealerId: newDealerId })
            .where(eq(schema.hands.id, currentHand.id))
        }
      }
    }

    // Return updated state
    const game = await db.select().from(schema.games).where(eq(schema.games.id, gameId))
    const gp = await db.select().from(schema.gamePlayers)
      .where(and(eq(schema.gamePlayers.gameId, gameId), eq(schema.gamePlayers.isActive, true)))
    const latestRounds = await db.select().from(schema.rounds)
      .where(and(eq(schema.rounds.gameId, gameId), eq(schema.rounds.status, 'playing')))
    const latestRound = latestRounds[0]
    let latestHand = null
    if (latestRound) {
      const lh = await db.select().from(schema.hands)
        .where(eq(schema.hands.roundId, latestRound.id)).orderBy(desc(schema.hands.number))
      latestHand = lh[0] || null
    }

    return NextResponse.json({
      game: game[0], gamePlayers: gp, currentRound: latestRound, currentHand: latestHand,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update seats' }, { status: 500 })
  }
}
