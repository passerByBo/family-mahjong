import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { generateId, now } from '@/lib/utils'
import { getGameState } from '@/lib/game-state'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    const body = await request.json()
    const { startDealerId } = body

    // Validate game exists and is in setup
    const game = await db.select().from(schema.games).where(eq(schema.games.id, gameId))
    if (game.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }
    if (game[0].status !== 'setup') {
      return NextResponse.json({ error: 'Game is not in setup phase' }, { status: 400 })
    }

    // Validate exactly 4 active gamePlayers
    const activePlayers = await db.select().from(schema.gamePlayers).where(
      and(eq(schema.gamePlayers.gameId, gameId), eq(schema.gamePlayers.isActive, true))
    )
    if (activePlayers.length !== 4) {
      return NextResponse.json({ error: 'Exactly 4 players are required to start' }, { status: 400 })
    }

    // Validate startDealerId is one of the 4 players
    const playerIds = activePlayers.map(p => p.playerId)
    if (!playerIds.includes(startDealerId)) {
      return NextResponse.json({ error: 'startDealerId must be one of the 4 players' }, { status: 400 })
    }

    const timestamp = now()
    const roundId = generateId()

    // Update game status to playing
    await db.update(schema.games).set({ status: 'playing' }).where(eq(schema.games.id, gameId))

    // Create round 1
    await db.insert(schema.rounds).values({
      id: roundId,
      gameId,
      number: 1,
      starterId: startDealerId,
      status: 'playing',
      createdAt: timestamp,
    })

    // Create hand 1
    await db.insert(schema.hands).values({
      id: generateId(),
      roundId,
      dealerId: startDealerId,
      number: 1,
      createdAt: timestamp,
    })

    // Return full game state
    const state = await getGameState(gameId)
    return NextResponse.json(state, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start game' }, { status: 500 })
  }
}
