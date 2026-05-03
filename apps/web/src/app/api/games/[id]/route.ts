import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, inArray } from 'drizzle-orm'
import { now } from '@/lib/utils'
import { getGameState } from '@/lib/game-state'

// Helper function to batch delete to avoid SQLite/D1 parameter limits
async function batchDelete<T extends string>(
  ids: T[],
  deleteFunc: (batch: T[]) => Promise<any>,
  batchSize = 100
) {
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize)
    await deleteFunc(batch)
  }
}

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
      // 2. Get all hands for these rounds (using batch queries if needed)
      let handIds: string[] = []
      await batchDelete(roundIds, async (batch) => {
        const hands = await db.select().from(schema.hands).where(
          inArray(schema.hands.roundId, batch)
        )
        handIds.push(...hands.map(h => h.id))
      })

      if (handIds.length > 0) {
        // 3. Get all hand events for these hands (using batch queries if needed)
        let eventIds: string[] = []
        await batchDelete(handIds, async (batch) => {
          const handEvents = await db.select().from(schema.handEvents).where(
            inArray(schema.handEvents.handId, batch)
          )
          eventIds.push(...handEvents.map(e => e.id))
        })

        // 4. Delete score_changes in batches
        if (eventIds.length > 0) {
          await batchDelete(eventIds, async (batch) => {
            await db.delete(schema.scoreChanges).where(
              inArray(schema.scoreChanges.eventId, batch)
            )
          })
        }

        // 5. Delete hand_events in batches
        await batchDelete(handIds, async (batch) => {
          await db.delete(schema.handEvents).where(
            inArray(schema.handEvents.handId, batch)
          )
        })
      }

      // 6. Delete hands in batches
      await batchDelete(roundIds, async (batch) => {
        await db.delete(schema.hands).where(
          inArray(schema.hands.roundId, batch)
        )
      })

      // 7. Delete rounds in batches
      await batchDelete(roundIds, async (batch) => {
        await db.delete(schema.rounds).where(
          inArray(schema.rounds.id, batch)
        )
      })
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
