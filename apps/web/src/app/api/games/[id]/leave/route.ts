import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    const body = await request.json()
    const { seatPosition } = body

    // Validate game exists and is in setup
    const game = await db.select().from(schema.games).where(eq(schema.games.id, gameId))
    if (game.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }
    if (game[0].status !== 'setup') {
      return NextResponse.json({ error: 'Game is not in setup phase' }, { status: 400 })
    }

    // Check a gamePlayer exists at that seat
    const existing = await db.select().from(schema.gamePlayers).where(
      and(
        eq(schema.gamePlayers.gameId, gameId),
        eq(schema.gamePlayers.seatPosition, seatPosition),
        eq(schema.gamePlayers.isActive, true)
      )
    )
    if (existing.length === 0) {
      return NextResponse.json({ error: 'No player at that seat' }, { status: 400 })
    }

    // Delete the gamePlayer record
    await db.delete(schema.gamePlayers).where(eq(schema.gamePlayers.id, existing[0].id))

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

    return NextResponse.json({ gamePlayers }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to leave game' }, { status: 500 })
  }
}
