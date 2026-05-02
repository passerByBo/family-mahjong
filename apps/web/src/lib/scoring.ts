export type EventType = 'kong' | 'win' | 'self_draw'

export interface ScoreChange {
  playerId: string
  amount: number
}

export interface ScoreInput {
  eventType: EventType
  playerId: string   // 杠者/胡者/自摸者
  dealerId: string   // 当前庄家
  allPlayerIds: string[] // 当前在场的4位玩家
}

/**
 * 推倒胡积分计算
 *
 * 杠:       杠者 +3, 其他各 -1
 * 庄家胡:   庄 +6, 其他各 -2
 * 庄家自摸: 庄 +12, 其他各 -4
 * 闲家胡:   闲 +4, 庄 -2, 其他闲各 -1
 * 闲家自摸: 闲 +8, 庄 -4, 其他闲各 -2
 */
export function calculateScore(input: ScoreInput): ScoreChange[] {
  const { eventType, playerId, dealerId, allPlayerIds } = input
  const isDealer = playerId === dealerId
  const otherPlayerIds = allPlayerIds.filter(id => id !== playerId)

  if (eventType === 'kong') {
    return [
      { playerId, amount: 3 },
      ...otherPlayerIds.map(id => ({ playerId: id, amount: -1 })),
    ]
  }

  if (eventType === 'win') {
    if (isDealer) {
      // 庄家胡: +6, 其他各 -2
      return [
        { playerId, amount: 6 },
        ...otherPlayerIds.map(id => ({ playerId: id, amount: -2 })),
      ]
    } else {
      // 闲家胡: +4, 庄 -2, 其他闲各 -1
      return [
        { playerId, amount: 4 },
        ...otherPlayerIds.map(id => ({
          playerId: id,
          amount: id === dealerId ? -2 : -1,
        })),
      ]
    }
  }

  if (eventType === 'self_draw') {
    if (isDealer) {
      // 庄家自摸: +12, 其他各 -4
      return [
        { playerId, amount: 12 },
        ...otherPlayerIds.map(id => ({ playerId: id, amount: -4 })),
      ]
    } else {
      // 闲家自摸: +8, 庄 -4, 其他闲各 -2
      return [
        { playerId, amount: 8 },
        ...otherPlayerIds.map(id => ({
          playerId: id,
          amount: id === dealerId ? -4 : -2,
        })),
      ]
    }
  }

  return []
}
