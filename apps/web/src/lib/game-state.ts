import { db, schema } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'

export async function getGamePlayersWithInfo(gameId: string) {
  const rows = await db.select({
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
  return rows
}

export async function getGameState(gameId: string) {
  const game = await db.select().from(schema.games).where(eq(schema.games.id, gameId))
  if (game.length === 0) return null

  const gp = await getGamePlayersWithInfo(gameId)

  if (game[0].status === 'setup') {
    return {
      game: game[0],
      gamePlayers: gp,
      currentRound: null,
      currentHand: null,
      totalScores: {},
      roundScores: {},
    }
  }

  const allRounds = await db.select().from(schema.rounds)
    .where(eq(schema.rounds.gameId, gameId)).orderBy(desc(schema.rounds.number))

  const currentRound = allRounds[0]
  if (!currentRound) return { game: game[0], gamePlayers: gp, currentRound: null, currentHand: null, totalScores: {}, roundScores: {}, hands: [], events: [] }

  const handsInRound = await db.select().from(schema.hands)
    .where(eq(schema.hands.roundId, currentRound.id)).orderBy(desc(schema.hands.number))

  const currentHand = handsInRound[0]

  // Get events from CURRENT hand only (not all hands in round)
  const currentHandEvents = currentHand
    ? await db.select().from(schema.handEvents).where(eq(schema.handEvents.handId, currentHand.id))
    : []

  // Map to simple structure for frontend
  const events = currentHandEvents.map(ev => ({
    playerId: ev.playerId,
    type: ev.type,
  }))

  // Also get all events with score changes for score calculation
  const allRoundEvents = []
  for (const h of handsInRound) {
    const handEvents = await db.select().from(schema.handEvents).where(eq(schema.handEvents.handId, h.id))
    for (const ev of handEvents) {
      const sc = await db.select().from(schema.scoreChanges).where(eq(schema.scoreChanges.eventId, ev.id))
      allRoundEvents.push({ ...ev, scoreChanges: sc })
    }
  }

  // Total scores from finished rounds
  const totalScores: Record<string, number> = {}
  const finishedRounds = allRounds.filter(r => r.status === 'finished')
  for (const r of finishedRounds) {
    const rHands = await db.select().from(schema.hands).where(eq(schema.hands.roundId, r.id))
    for (const h of rHands) {
      const hEvents = await db.select().from(schema.handEvents).where(eq(schema.handEvents.handId, h.id))
      for (const ev of hEvents) {
        const sc = await db.select().from(schema.scoreChanges).where(eq(schema.scoreChanges.eventId, ev.id))
        for (const s of sc) {
          totalScores[s.playerId] = (totalScores[s.playerId] || 0) + s.amount
        }
      }
    }
  }

  // Round scores (current round) - use all events in round
  const roundScores: Record<string, number> = {}
  for (const ev of allRoundEvents) {
    for (const s of ev.scoreChanges) {
      roundScores[s.playerId] = (roundScores[s.playerId] || 0) + s.amount
    }
  }

  return {
    game: game[0],
    gamePlayers: gp,
    currentRound,
    currentHand,
    totalScores,
    roundScores,
    hands: handsInRound.reverse(),
    events,
  }
}
