import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params

    const game = await db.select().from(schema.games).where(eq(schema.games.id, gameId))
    if (game.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const allRounds = await db.select().from(schema.rounds)
      .where(eq(schema.rounds.gameId, gameId)).orderBy(schema.rounds.number)

    const totalScores: Record<string, number> = {}
    const roundSummaries = []

    for (const round of allRounds) {
      const roundScores: Record<string, number> = {}
      const handsInRound = await db.select().from(schema.hands)
        .where(eq(schema.hands.roundId, round.id))

      for (const hand of handsInRound) {
        const events = await db.select().from(schema.handEvents)
          .where(eq(schema.handEvents.handId, hand.id))
        for (const ev of events) {
          const sc = await db.select().from(schema.scoreChanges)
            .where(eq(schema.scoreChanges.eventId, ev.id))
          for (const s of sc) {
            roundScores[s.playerId] = (roundScores[s.playerId] || 0) + s.amount
            totalScores[s.playerId] = (totalScores[s.playerId] || 0) + s.amount
          }
        }
      }

      roundSummaries.push({
        roundId: round.id,
        number: round.number,
        status: round.status,
        scores: roundScores,
      })
    }

    // Sort total scores descending
    const ranking = Object.entries(totalScores)
      .map(([playerId, score]) => ({ playerId, score }))
      .sort((a, b) => b.score - a.score)

    return NextResponse.json({ ranking, roundSummaries })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
  }
}
