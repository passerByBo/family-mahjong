'use client'

import { PlayerSeat } from '@/components/player-seat'
import { EmptySeat } from '@/components/empty-seat'
import { type HandEvent } from './event-badge-container'

interface Player {
  id: string
  name: string
  avatar: string
  seatPosition: number
}

interface GameState {
  players: Player[]
  dealerId: string
  roundNumber: number
  handNumber: number
  roundScores: Record<string, number>
  totalScores: Record<string, number>
  gameId: string
  gameStatus: 'setup' | 'playing' | 'finished'
  gameName?: string
}

interface MahjongTableProps {
  gameState: GameState
  onAction: (result: unknown) => void
  onAddPlayer?: (seatPosition: number) => void
  onRemovePlayer?: (seatPosition: number) => void
  onKong?: (playerId: string) => void
  onWin?: (playerId: string) => void
  onSelfDraw?: (playerId: string) => void
  onSwapPlayer?: (playerId: string) => void
  actionLoading?: boolean
  loadingPlayerId?: string
  loadingAction?: 'kong' | 'win' | 'self_draw'
  handEvents?: HandEvent[]
}

export function MahjongTable({
  gameState, onAction, onAddPlayer, onRemovePlayer, onKong, onWin, onSelfDraw, onSwapPlayer,
  actionLoading, loadingPlayerId, loadingAction, handEvents,
}: MahjongTableProps) {
  const { players, dealerId, roundNumber, handNumber, roundScores, totalScores, gameStatus, gameName } = gameState

  const positionLabels: Array<'bottom' | 'right' | 'top' | 'left'> = ['bottom', 'right', 'top', 'left']
  const seatPositions = [1, 2, 3, 4]

  // Build a map of seatPosition -> player
  const seatMap: Record<number, Player | undefined> = {}
  for (const p of players) {
    seatMap[p.seatPosition] = p
  }

  function renderSeat(seatPos: number, position: 'bottom' | 'right' | 'top' | 'left') {
    const player = seatMap[seatPos]
    if (!player) {
      return (
        <EmptySeat
          position={position}
          onAdd={() => onAddPlayer?.(seatPos)}
        />
      )
    }

    const score = roundScores[player.id] || 0
    const total = totalScores[player.id] || 0
    const isDealer = player.id === dealerId

    if (gameStatus === 'setup') {
      return (
        <PlayerSeat
          player={player}
          score={score}
          isDealer={isDealer}
          position={position}
          onRemove={() => onRemovePlayer?.(seatPos)}
        />
      )
    }

    const playerEvents = handEvents?.filter(e => e.playerName === player.name) || []
    const isLoadingPlayer = loadingPlayerId === player.id

    return (
      <PlayerSeat
        player={player}
        score={score}
        totalScore={total}
        isDealer={isDealer}
        position={position}
        showActions={gameStatus === 'playing'}
        onKong={onKong ? () => onKong(player.id) : undefined}
        onWin={onWin ? () => onWin(player.id) : undefined}
        onSelfDraw={onSelfDraw ? () => onSelfDraw(player.id) : undefined}
        onSwap={onSwapPlayer && gameStatus === 'playing' ? () => onSwapPlayer(player.id) : undefined}
        actionLoading={actionLoading}
        loadingAction={isLoadingPlayer ? loadingAction : undefined}
        handEvents={playerEvents}
      />
    )
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div
        className="relative bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-800 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5),inset_0_2px_20px_rgba(0,0,0,0.3)] border-4 border-emerald-900 aspect-square"
        style={{ width: 'min(90vw, calc(100dvh - 10rem))', maxWidth: '100%' }}
      >
        {/* Center info */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {gameStatus === 'setup' ? (
              <div className="text-emerald-400/60 text-xs">点击 + 入座</div>
            ) : (
              <>
                {gameName && <div className="text-emerald-300/50 text-xs font-medium mb-0.5">{gameName}</div>}
                <div className="text-emerald-400/60 text-xs">第{roundNumber}轮 第{handNumber}局</div>
              </>
            )}
          </div>
        </div>

        {/* Top player */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2">
          {renderSeat(3, 'top')}
        </div>

        {/* Bottom player */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          {renderSeat(1, 'bottom')}
        </div>

        {/* Left player */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2">
          {renderSeat(4, 'left')}
        </div>

        {/* Right player */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {renderSeat(2, 'right')}
        </div>
      </div>
    </div>
  )
}
