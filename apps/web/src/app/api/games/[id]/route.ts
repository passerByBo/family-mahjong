import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { now } from '@/lib/utils'
import { getGameState } from '@/lib/game-state'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const state = await getGameState(id)
    if (!state) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    return NextResponse.json(state)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (body.status === 'finished') {
      await db.update(schema.games).set({ status: 'finished', finishedAt: now() }).where(eq(schema.games.id, id))
      const updated = await db.select().from(schema.games).where(eq(schema.games.id, id))
      return NextResponse.json(updated[0])
    }

    return NextResponse.json({ error: 'Invalid update' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if game exists
    const game = await db.select().from(schema.games).where(eq(schema.games.id, id))
    if (game.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Cascade delete in correct order to respect foreign key constraints
    // Order: score_changes → hand_events → hands → rounds → game_players → games

    // 1. Get all rounds for this game
    const rounds = await db.select().from(schema.rounds).where(eq(schema.rounds.gameId, id))
    const roundIds = rounds.map(r => r.id)

    if (roundIds.length > 0) {
      // 2. Get all hands for these rounds
      const hands = await db.select().from(schema.hands).where(
        eq(schema.hands.roundId, roundIds[0])
      )
      const handIds = hands.map(h => h.id)

      if (handIds.length > 0) {
        // 3. Get all hand events for these hands
        const handEvents = await db.select().from(schema.handEvents).where(
          eq(schema.handEvents.handId, handIds[0])
        )
        const eventIds = handEvents.map(e => e.id)

        // 4. Delete score_changes
        if (eventIds.length > 0) {
          for (const eventId of eventIds) {
            await db.delete(schema.scoreChanges).where(eq(schema.scoreChanges.eventId, eventId))
          }
        }

        // 5. Delete hand_events
        for (const handId of handIds) {
          await db.delete(schema.handEvents).where(eq(schema.handEvents.handId, handId))
        }
      }

      // 6. Delete hands
      for (const roundId of roundIds) {
        await db.delete(schema.hands).where(eq(schema.hands.roundId, roundId))
      }

      // 7. Delete rounds
      for (const roundId of roundIds) {
        await db.delete(schema.rounds).where(eq(schema.rounds.id, roundId))
      }
    }

    // 8. Delete game_players
    await db.delete(schema.gamePlayers).where(eq(schema.gamePlayers.gameId, id))

    // 9. Finally, delete the game itself
    await db.delete(schema.games).where(eq(schema.games.id, id))

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete game:', error)
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 })
  }
}
