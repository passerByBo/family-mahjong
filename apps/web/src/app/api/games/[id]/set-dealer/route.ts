import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import { generateId, now } from '@/lib/utils'
import { getGameState } from '@/lib/game-state'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    const body = await request.json()
    const { dealerId } = body

    if (!dealerId) {
      return NextResponse.json({ error: 'dealerId is required' }, { status: 400 })
    }

    // Validate game is playing
    const game = await db.select().from(schema.games).where(eq(schema.games.id, gameId))
    if (game.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }
    if (game[0].status !== 'playing') {
      return NextResponse.json({ error: 'Game is not in playing phase' }, { status: 400 })
    }

    // Validate dealerId is an active player
    const activePlayers = await db.select().from(schema.gamePlayers).where(
      and(eq(schema.gamePlayers.gameId, gameId), eq(schema.gamePlayers.isActive, true))
    )
    if (!activePlayers.some(p => p.playerId === dealerId)) {
      return NextResponse.json({ error: 'dealerId must be an active player' }, { status: 400 })
    }

    const timestamp = now()

    // Finish current round
    const currentRounds = await db.select().from(schema.rounds)
      .where(and(eq(schema.rounds.gameId, gameId), eq(schema.rounds.status, 'playing')))
    const currentRound = currentRounds[0]
    if (currentRound) {
      await db.update(schema.rounds)
        .set({ status: 'finished' })
        .where(eq(schema.rounds.id, currentRound.id))
    }

    // Create new round with the chosen dealer as starter
    const allRounds = await db.select().from(schema.rounds)
      .where(eq(schema.rounds.gameId, gameId))
    const newRoundNumber = allRounds.length + 1
    const newRoundId = generateId()

    await db.insert(schema.rounds).values({
      id: newRoundId,
      gameId,
      number: newRoundNumber,
      starterId: dealerId,
      status: 'playing',
      createdAt: timestamp,
    })

    // Create hand 1 in the new round
    await db.insert(schema.hands).values({
      id: generateId(),
      roundId: newRoundId,
      dealerId,
      number: 1,
      createdAt: timestamp,
    })

    const state = await getGameState(gameId)
    return NextResponse.json(state, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to set dealer' }, { status: 500 })
  }
}
