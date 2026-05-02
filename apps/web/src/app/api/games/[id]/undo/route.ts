import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params

    // Get current playing round
    const currentRounds = await db.select().from(schema.rounds)
      .where(and(eq(schema.rounds.gameId, gameId), eq(schema.rounds.status, 'playing')))
    let currentRound = currentRounds[0]

    // If no playing round, check if we need to revert a just-finished round
    if (!currentRound) {
      const allRounds = await db.select().from(schema.rounds)
        .where(eq(schema.rounds.gameId, gameId)).orderBy(desc(schema.rounds.number))
      if (allRounds.length < 2) {
        return NextResponse.json({ error: 'Nothing to undo' }, { status: 400 })
      }
      // Delete the newest round (just created) and reopen previous
      const newestRound = allRounds[0]
      const prevRound = allRounds[1]

      // Delete hands in newest round
      const newHands = await db.select().from(schema.hands).where(eq(schema.hands.roundId, newestRound.id))
      for (const h of newHands) {
        await db.delete(schema.hands).where(eq(schema.hands.id, h.id))
      }
      await db.delete(schema.rounds).where(eq(schema.rounds.id, newestRound.id))
      await db.update(schema.rounds).set({ status: 'playing' }).where(eq(schema.rounds.id, prevRound.id))
      currentRound = { ...prevRound, status: 'playing' }
    }

    // Get hands in current round
    const handsInRound = await db.select().from(schema.hands)
      .where(eq(schema.hands.roundId, currentRound.id)).orderBy(desc(schema.hands.number))

    // Find the latest event across all hands in this round
    let latestEvent = null
    let eventHand = null
    for (const h of handsInRound) {
      const events = await db.select().from(schema.handEvents)
        .where(eq(schema.handEvents.handId, h.id)).orderBy(desc(schema.handEvents.createdAt))
      if (events.length > 0) {
        latestEvent = events[0]
        eventHand = h
        break
      }
    }

    if (!latestEvent || !eventHand) {
      return NextResponse.json({ error: 'Nothing to undo' }, { status: 400 })
    }

    // Delete score changes for this event
    await db.delete(schema.scoreChanges).where(eq(schema.scoreChanges.eventId, latestEvent.id))
    // Delete the event
    await db.delete(schema.handEvents).where(eq(schema.handEvents.id, latestEvent.id))

    // If the event was win/self_draw, we need to rollback the hand/dealer change
    if (latestEvent.type === 'win' || latestEvent.type === 'self_draw') {
      // The latest hand (handsInRound[0]) was created after this event, delete it
      const latestHand = handsInRound[0]
      if (latestHand && latestHand.id !== eventHand.id) {
        // Delete the hand that was created as a result of this win/self_draw
        await db.delete(schema.hands).where(eq(schema.hands.id, latestHand.id))
      }
    }

    // Return updated state
    const game = await db.select().from(schema.games).where(eq(schema.games.id, gameId))
    const gp = await db.select().from(schema.gamePlayers)
      .where(and(eq(schema.gamePlayers.gameId, gameId), eq(schema.gamePlayers.isActive, true)))
    const latestRounds = await db.select().from(schema.rounds)
      .where(and(eq(schema.rounds.gameId, gameId), eq(schema.rounds.status, 'playing')))
    const latestRound = latestRounds[0]
    let latestHandResult = null
    if (latestRound) {
      const lh = await db.select().from(schema.hands)
        .where(eq(schema.hands.roundId, latestRound.id)).orderBy(desc(schema.hands.number))
      latestHandResult = lh[0] || null
    }

    return NextResponse.json({
      game: game[0], gamePlayers: gp, currentRound: latestRound, currentHand: latestHandResult,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to undo' }, { status: 500 })
  }
}
