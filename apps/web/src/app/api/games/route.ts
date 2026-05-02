import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, or } from 'drizzle-orm'
import { generateId, now } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let gamesList
    if (status === 'active') {
      gamesList = await db.select().from(schema.games).where(
        or(eq(schema.games.status, 'setup'), eq(schema.games.status, 'playing'))
      )
    } else if (status) {
      gamesList = await db.select().from(schema.games).where(eq(schema.games.status, status))
    } else {
      gamesList = await db.select().from(schema.games)
    }

    // Attach player names to each game
    const result = await Promise.all(gamesList.map(async (game) => {
      const gps = await db.select({
        name: schema.players.name,
      })
        .from(schema.gamePlayers)
        .innerJoin(schema.players, eq(schema.gamePlayers.playerId, schema.players.id))
        .where(eq(schema.gamePlayers.gameId, game.id))
      return { ...game, players: gps }
    }))

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body ?? {}

    const timestamp = now()
    const gameId = generateId()

    await db.insert(schema.games).values({
      id: gameId,
      name: name ?? '',
      status: 'setup',
      createdAt: timestamp,
    })

    const game = await db.select().from(schema.games).where(eq(schema.games.id, gameId))

    return NextResponse.json({
      game: { id: game[0].id, name: game[0].name, status: game[0].status, createdAt: game[0].createdAt },
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
  }
}
