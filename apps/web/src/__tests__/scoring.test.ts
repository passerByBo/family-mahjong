import { describe, it, expect } from 'vitest'
import { calculateScore } from '../lib/scoring'

const players = ['A', 'B', 'C', 'D']

function sumScores(changes: { amount: number }[]) {
  return changes.reduce((sum, c) => sum + c.amount, 0)
}

describe('calculateScore', () => {
  describe('杠 (kong)', () => {
    it('杠者 +3, 其他各 -1', () => {
      const result = calculateScore({
        eventType: 'kong',
        playerId: 'A',
        dealerId: 'A',
        allPlayerIds: players,
      })
      expect(result.find(r => r.playerId === 'A')?.amount).toBe(3)
      expect(result.find(r => r.playerId === 'B')?.amount).toBe(-1)
      expect(result.find(r => r.playerId === 'C')?.amount).toBe(-1)
      expect(result.find(r => r.playerId === 'D')?.amount).toBe(-1)
      expect(sumScores(result)).toBe(0)
    })

    it('闲家杠也是一样的', () => {
      const result = calculateScore({
        eventType: 'kong',
        playerId: 'B',
        dealerId: 'A',
        allPlayerIds: players,
      })
      expect(result.find(r => r.playerId === 'B')?.amount).toBe(3)
      expect(sumScores(result)).toBe(0)
    })
  })

  describe('庄家胡 (dealer win)', () => {
    it('庄家 +6, 其他各 -2', () => {
      const result = calculateScore({
        eventType: 'win',
        playerId: 'A',
        dealerId: 'A',
        allPlayerIds: players,
      })
      expect(result.find(r => r.playerId === 'A')?.amount).toBe(6)
      expect(result.find(r => r.playerId === 'B')?.amount).toBe(-2)
      expect(result.find(r => r.playerId === 'C')?.amount).toBe(-2)
      expect(result.find(r => r.playerId === 'D')?.amount).toBe(-2)
      expect(sumScores(result)).toBe(0)
    })
  })

  describe('庄家自摸 (dealer self_draw)', () => {
    it('庄家 +12, 其他各 -4', () => {
      const result = calculateScore({
        eventType: 'self_draw',
        playerId: 'A',
        dealerId: 'A',
        allPlayerIds: players,
      })
      expect(result.find(r => r.playerId === 'A')?.amount).toBe(12)
      expect(result.find(r => r.playerId === 'B')?.amount).toBe(-4)
      expect(result.find(r => r.playerId === 'C')?.amount).toBe(-4)
      expect(result.find(r => r.playerId === 'D')?.amount).toBe(-4)
      expect(sumScores(result)).toBe(0)
    })
  })

  describe('闲家胡 (non-dealer win)', () => {
    it('闲家 +4, 庄家 -2, 其他闲家各 -1', () => {
      const result = calculateScore({
        eventType: 'win',
        playerId: 'B',
        dealerId: 'A',
        allPlayerIds: players,
      })
      expect(result.find(r => r.playerId === 'B')?.amount).toBe(4)
      expect(result.find(r => r.playerId === 'A')?.amount).toBe(-2)
      expect(result.find(r => r.playerId === 'C')?.amount).toBe(-1)
      expect(result.find(r => r.playerId === 'D')?.amount).toBe(-1)
      expect(sumScores(result)).toBe(0)
    })
  })

  describe('闲家自摸 (non-dealer self_draw)', () => {
    it('闲家 +8, 庄家 -4, 其他闲家各 -2', () => {
      const result = calculateScore({
        eventType: 'self_draw',
        playerId: 'C',
        dealerId: 'A',
        allPlayerIds: players,
      })
      expect(result.find(r => r.playerId === 'C')?.amount).toBe(8)
      expect(result.find(r => r.playerId === 'A')?.amount).toBe(-4)
      expect(result.find(r => r.playerId === 'B')?.amount).toBe(-2)
      expect(result.find(r => r.playerId === 'D')?.amount).toBe(-2)
      expect(sumScores(result)).toBe(0)
    })
  })

  describe('所有场景积分总和为 0', () => {
    const scenarios = [
      { eventType: 'kong' as const, playerId: 'A', dealerId: 'A' },
      { eventType: 'kong' as const, playerId: 'B', dealerId: 'A' },
      { eventType: 'win' as const, playerId: 'A', dealerId: 'A' },
      { eventType: 'win' as const, playerId: 'B', dealerId: 'A' },
      { eventType: 'self_draw' as const, playerId: 'A', dealerId: 'A' },
      { eventType: 'self_draw' as const, playerId: 'B', dealerId: 'A' },
      { eventType: 'self_draw' as const, playerId: 'C', dealerId: 'A' },
    ]

    scenarios.forEach(({ eventType, playerId, dealerId }) => {
      it(`${eventType} by ${playerId} (dealer=${dealerId}) sums to 0`, () => {
        const result = calculateScore({
          eventType,
          playerId,
          dealerId,
          allPlayerIds: players,
        })
        expect(sumScores(result)).toBe(0)
      })
    })
  })
})
