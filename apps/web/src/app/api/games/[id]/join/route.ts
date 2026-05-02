import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { generateId, now } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    const body = await request.json()
    const { playerId, seatPosition } = body

    // Validate game exists and is in setup
    const game = await db.select().from(schema.games).where(eq(schema.games.id, gameId))
    if (game.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }
    if (game[0].status !== 'setup') {
      return NextResponse.json({ error: 'Game is not in setup phase' }, { status: 400 })
    }

    // Validate seatPosition
    if (!seatPosition || seatPosition < 1 || seatPosition > 4) {
      return NextResponse.json({ error: 'seatPosition must be between 1 and 4' }, { status: 400 })
    }

    // Check seat not already occupied
    const existingSeat = await db.select().from(schema.gamePlayers).where(
      and(
        eq(schema.gamePlayers.gameId, gameId),
        eq(schema.gamePlayers.seatPosition, seatPosition),
        eq(schema.gamePlayers.isActive, true)
      )
    )
    if (existingSeat.length > 0) {
      return NextResponse.json({ error: 'Seat is already occupied' }, { status: 400 })
    }

    // Check player not already seated
    const existingPlayer = await db.select().from(schema.gamePlayers).where(
      and(
        eq(schema.gamePlayers.gameId, gameId),
        eq(schema.gamePlayers.playerId, playerId),
        eq(schema.gamePlayers.isActive, true)
      )
    )
    if (existingPlayer.length > 0) {
      return NextResponse.json({ error: 'Player is already seated in this game' }, { status: 400 })
    }

    // Create gamePlayer record
    await db.insert(schema.gamePlayers).values({
      id: generateId(),
      gameId,
      playerId,
      seatPosition,
      isActive: true,
      joinedAt: now(),
    })

    // Return updated list of gamePlayers with player info
    const gamePlayers = await db.select({
      id: schema.gamePlayers.id,
      playerId: schema.gamePlayers.playerId,
      name: schema.players.name,
      avatar: schema.players.avatar,
      seatPosition: schema.gamePlayers.seatPosition,
      isActive: schema.gamePlayers.isActive,
    })
      .from(schema.gamePlayers)
      .innerJoin(schema.players, eq(schema.gamePlayers.playerId, schema.players.id))
      .where(and(eq(schema.gamePlayers.gameId, gameId), eq(schema.gamePlayers.isActive, true)))

    return NextResponse.json({ gamePlayers }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to join game' }, { status: 500 })
  }
}
