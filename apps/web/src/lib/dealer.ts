export interface DealerInput {
  currentDealerId: string
  winnerId: string        // 胡牌/自摸者
  seatOrder: string[]     // 座位顺序 [A, B, C, D]
  roundStarterId: string  // 本轮起始庄家
}

export interface DealerResult {
  nextDealerId: string
  isRoundFinished: boolean
}

/**
 * 庄家轮转逻辑
 *
 * 庄家赢了 → 连庄
 * 庄家输了 → 下一位坐庄 (按座位顺序)
 *
 * 一轮结束条件:
 *   起始庄家的前一位坐庄且输了
 *   即每人都坐过庄,最后一个庄家也输了
 */
export function getNextDealer(input: DealerInput): DealerResult {
  const { currentDealerId, winnerId, seatOrder, roundStarterId } = input

  // 庄家赢了 → 连庄
  if (winnerId === currentDealerId) {
    return { nextDealerId: currentDealerId, isRoundFinished: false }
  }

  // 庄家输了 → 下一位坐庄
  const currentIndex = seatOrder.indexOf(currentDealerId)
  const nextIndex = (currentIndex + 1) % seatOrder.length
  const nextDealerId = seatOrder[nextIndex]

  // 判断轮次是否结束:
  // 本轮最后一个庄家 = 起始庄家的前一位
  // 如果当前庄家就是最后一个庄家,且输了 → 轮次结束
  const starterIndex = seatOrder.indexOf(roundStarterId)
  const lastDealerIndex = (starterIndex - 1 + seatOrder.length) % seatOrder.length
  const lastDealerId = seatOrder[lastDealerIndex]

  const isRoundFinished = currentDealerId === lastDealerId

  return { nextDealerId, isRoundFinished }
}

/**
 * 计算下一轮的起始庄家
 * 规则: 上一轮起始庄家的下一位
 */
export function getNextRoundStarter(
  currentStarterId: string,
  seatOrder: string[]
): string {
  const currentIndex = seatOrder.indexOf(currentStarterId)
  const nextIndex = (currentIndex + 1) % seatOrder.length
  return seatOrder[nextIndex]
}
