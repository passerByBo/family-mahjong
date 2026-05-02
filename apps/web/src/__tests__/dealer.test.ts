import { describe, it, expect } from 'vitest'
import { getNextDealer, getNextRoundStarter } from '../lib/dealer'

const seatOrder = ['A', 'B', 'C', 'D']

describe('getNextDealer', () => {
  it('庄家赢了 → 连庄', () => {
    const result = getNextDealer({
      currentDealerId: 'A',
      winnerId: 'A',
      seatOrder,
      roundStarterId: 'A',
    })
    expect(result.nextDealerId).toBe('A')
    expect(result.isRoundFinished).toBe(false)
  })

  it('庄家输了 → 下一位坐庄', () => {
    const result = getNextDealer({
      currentDealerId: 'A',
      winnerId: 'B',
      seatOrder,
      roundStarterId: 'A',
    })
    expect(result.nextDealerId).toBe('B')
    expect(result.isRoundFinished).toBe(false)
  })

  it('最后一个庄家输了 → 轮次结束 (起始A, 最后D)', () => {
    const result = getNextDealer({
      currentDealerId: 'D',
      winnerId: 'A',
      seatOrder,
      roundStarterId: 'A',
    })
    expect(result.nextDealerId).toBe('A')
    expect(result.isRoundFinished).toBe(true)
  })

  it('起始庄家B, 最后一个庄家A输了 → 轮次结束', () => {
    const result = getNextDealer({
      currentDealerId: 'A',
      winnerId: 'C',
      seatOrder,
      roundStarterId: 'B',
    })
    expect(result.nextDealerId).toBe('B')
    expect(result.isRoundFinished).toBe(true)
  })

  it('起始庄家C, 最后一个庄家B输了 → 轮次结束', () => {
    const result = getNextDealer({
      currentDealerId: 'B',
      winnerId: 'D',
      seatOrder,
      roundStarterId: 'C',
    })
    expect(result.nextDealerId).toBe('C')
    expect(result.isRoundFinished).toBe(true)
  })

  it('中间庄家输了 → 轮次未结束', () => {
    const result = getNextDealer({
      currentDealerId: 'B',
      winnerId: 'D',
      seatOrder,
      roundStarterId: 'A',
    })
    expect(result.nextDealerId).toBe('C')
    expect(result.isRoundFinished).toBe(false)
  })
})

describe('getNextRoundStarter', () => {
  it('A → B', () => {
    expect(getNextRoundStarter('A', seatOrder)).toBe('B')
  })

  it('D → A (循环)', () => {
    expect(getNextRoundStarter('D', seatOrder)).toBe('A')
  })

  it('C → D', () => {
    expect(getNextRoundStarter('C', seatOrder)).toBe('D')
  })
})
