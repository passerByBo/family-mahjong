import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import { generateId, now } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    const body = await request.json()
    const { outPlayerId, inPlayerId } = body

    if (!outPlayerId || !inPlayerId) {
      return NextResponse.json({ error: 'outPlayerId and inPlayerId are required' }, { status: 400 })
    }

    // Find the outgoing player's game_player record
    const outGp = await db.select().from(schema.gamePlayers)
      .where(and(
        eq(schema.gamePlayers.gameId, gameId),
        eq(schema.gamePlayers.playerId, outPlayerId),
        eq(schema.gamePlayers.isActive, true),
      ))
    if (outGp.length === 0) {
      return NextResponse.json({ error: 'Outgoing player not found in game' }, { status: 404 })
    }

    const seatPosition = outGp[0].seatPosition
    const timestamp = now()

    // Deactivate outgoing player
    await db.update(schema.gamePlayers)
      .set({ isActive: false, leftAt: timestamp })
      .where(eq(schema.gamePlayers.id, outGp[0].id))

    // Check if incoming player was previously in this game
    const existingGp = await db.select().from(schema.gamePlayers)
      .where(and(
        eq(schema.gamePlayers.gameId, gameId),
        eq(schema.gamePlayers.playerId, inPlayerId),
      ))

    if (existingGp.length > 0) {
      // Restore existing record
      await db.update(schema.gamePlayers)
        .set({ isActive: true, leftAt: null, seatPosition })
        .where(eq(schema.gamePlayers.id, existingGp[0].id))
    } else {
      // Create new game_player inheriting seat
      await db.insert(schema.gamePlayers).values({
        id: generateId(), gameId, playerId: inPlayerId,
        seatPosition, isActive: true, joinedAt: timestamp,
      })
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

    // If the swapped-out player was the current dealer, update dealer to the incoming player
    if (latestHand && latestHand.dealerId === outPlayerId) {
      await db.update(schema.hands)
        .set({ dealerId: inPlayerId })
        .where(eq(schema.hands.id, latestHand.id))
      latestHand = { ...latestHand, dealerId: inPlayerId }
    }

    return NextResponse.json({
      game: game[0], gamePlayers: gp, currentRound: latestRound, currentHand: latestHand,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to swap player' }, { status: 500 })
  }
}
