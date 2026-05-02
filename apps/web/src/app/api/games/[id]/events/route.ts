import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import { generateId, now } from '@/lib/utils'
import { calculateScore, type EventType } from '@/lib/scoring'
import { getNextDealer, getNextRoundStarter } from '@/lib/dealer'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    const body = await request.json()
    const { type, playerId } = body as { type: EventType; playerId: string }

    if (!type || !playerId) {
      return NextResponse.json({ error: 'type and playerId are required' }, { status: 400 })
    }

    // Get current round
    const currentRounds = await db.select().from(schema.rounds)
      .where(and(eq(schema.rounds.gameId, gameId), eq(schema.rounds.status, 'playing')))
    const currentRound = currentRounds[0]
    if (!currentRound) {
      return NextResponse.json({ error: 'No active round' }, { status: 400 })
    }

    // Get current hand (latest in round)
    const currentHands = await db.select().from(schema.hands)
      .where(eq(schema.hands.roundId, currentRound.id)).orderBy(desc(schema.hands.number))
    const currentHand = currentHands[0]
    if (!currentHand) {
      return NextResponse.json({ error: 'No active hand' }, { status: 400 })
    }

    // Get active players
    const activePlayers = await db.select().from(schema.gamePlayers)
      .where(and(eq(schema.gamePlayers.gameId, gameId), eq(schema.gamePlayers.isActive, true)))
    const allPlayerIds = activePlayers
      .sort((a, b) => a.seatPosition - b.seatPosition)
      .map(p => p.playerId)

    // Calculate scores
    const scoreChanges = calculateScore({
      eventType: type, playerId, dealerId: currentHand.dealerId, allPlayerIds,
    })

    const timestamp = now()
    const eventId = generateId()

    // Create hand_event
    await db.insert(schema.handEvents).values({
      id: eventId, handId: currentHand.id, type, playerId, createdAt: timestamp,
    })

    // Create score_changes
    for (const sc of scoreChanges) {
      await db.insert(schema.scoreChanges).values({
        id: generateId(), eventId, playerId: sc.playerId, amount: sc.amount,
      })
    }

    // Handle win/self_draw: dealer rotation and round progression
    if (type === 'win' || type === 'self_draw') {
      const seatOrder = allPlayerIds
      const dealerResult = getNextDealer({
        currentDealerId: currentHand.dealerId,
        winnerId: playerId,
        seatOrder,
        roundStarterId: currentRound.starterId,
      })

      if (dealerResult.isRoundFinished) {
        // Finish current round
        await db.update(schema.rounds).set({ status: 'finished' }).where(eq(schema.rounds.id, currentRound.id))

        // Create new round
        const nextStarter = getNextRoundStarter(currentRound.starterId, seatOrder)
        const newRoundId = generateId()
        await db.insert(schema.rounds).values({
          id: newRoundId, gameId, number: currentRound.number + 1,
          starterId: nextStarter, status: 'playing', createdAt: timestamp,
        })

        // Create first hand of new round
        await db.insert(schema.hands).values({
          id: generateId(), roundId: newRoundId, dealerId: nextStarter, number: 1, createdAt: timestamp,
        })
      } else {
        // Create new hand in current round (dealer change or 连庄)
        await db.insert(schema.hands).values({
          id: generateId(), roundId: currentRound.id,
          dealerId: dealerResult.nextDealerId,
          number: currentHand.number + 1, createdAt: timestamp,
        })
      }
    }

    // Return updated game state by fetching via redirect-like approach
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
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
  }
}
