'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MahjongTable } from '@/components/mahjong-table'
import { GameActionBar } from '@/components/game-action-bar'
import { RoundSummary } from '@/components/round-summary'
import { PlayerPickerDialog } from '@/components/player-picker-dialog'
import { SwapPlayerDialog } from '@/components/swap-player-dialog'
import { DealerPickerDialog } from '@/components/dealer-picker-dialog'
import { EventFloatingCard } from '@/components/event-floating-card'
import { type HandEvent } from '@/components/event-badge-container'
import { type EventBadgeType } from '@/components/event-badge'
import { calculateScore, type EventType } from '@/lib/scoring'
import { ArrowLeft } from 'lucide-react'

interface PlayerInfo {
  id: string
  name: string
  avatar: string
  seatPosition: number
}

interface GameData {
  game: { id: string; name: string | null; status: string }
  gamePlayers: { playerId: string; name: string; avatar: string; seatPosition: number; isActive: boolean }[]
  currentRound: { id: string; number: number; starterId: string; status: string } | null
  currentHand: { id: string; dealerId: string; number: number } | null
  totalScores: Record<string, number>
  roundScores: Record<string, number>
  events?: { playerId: string; type: string }[]
}

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.id as string

  const [gameData, setGameData] = useState<GameData | null>(null)
  const [loading, setLoading] = useState(true)
  // Setup mode state
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSeat, setPickerSeat] = useState<number>(1)
  const [dealerPickerOpen, setDealerPickerOpen] = useState(false)

      const [actionLoading, setActionLoading] = useState(false)
  const [loadingPlayerId, setLoadingPlayerId] = useState<string>('')
  const [loadingAction, setLoadingAction] = useState<EventType | undefined>(undefined)
      
  // Event visualization state
  const [handEvents, setHandEvents] = useState<HandEvent[]>([])
  const [floatingEvent, setFloatingEvent] = useState<{
    type: EventBadgeType
    playerName: string
    scoreChanges: { playerId: string; playerName: string; amount: number }[]
    countdown?: number
    onConfirm?: () => void
    onCancel?: () => void
  } | null>(null)
  const [currentHandId, setCurrentHandId] = useState<string>('')

  // Round summary state
  const [roundSummaryOpen, setRoundSummaryOpen] = useState(false)
  const [prevRoundNumber, setPrevRoundNumber] = useState<number>(1)
  const [prevRoundScores, setPrevRoundScores] = useState<{ playerId: string; name: string; amount: number }[]>([])
  const [prevRoundEvents, setPrevRoundEvents] = useState<{ playerId: string; type: string; isDealer: boolean }[]>([])
  const [prevRoundDealerCounts, setPrevRoundDealerCounts] = useState<Record<string, number>>({})

  // Swap player state
  const [swapPickerOpen, setSwapPickerOpen] = useState(false)
  const [swapOutPlayerId, setSwapOutPlayerId] = useState<string>('')
  const fetchGameState = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${gameId}`)
      if (res.ok) {
        const data: GameData = await res.json()
        setGameData(data)
        if (data.game.status === 'finished') {
          router.replace(`/games/${gameId}/summary`)
        }
      }
    } catch (error) {
      console.error('获取游戏状态失败:', error)
    } finally {
      setLoading(false)
    }
  }, [gameId, router])

  useEffect(() => { fetchGameState() }, [fetchGameState])

  // Clear hand events when hand changes
  useEffect(() => {
    if (gameData?.currentHand?.id && gameData.currentHand.id !== currentHandId) {
      setCurrentHandId(gameData.currentHand.id)
      setHandEvents([])
    }
  }, [gameData?.currentHand?.id, currentHandId])

  

  // --- Setup mode handlers ---
  const handleAddPlayer = (seatPosition: number) => {
    setPickerSeat(seatPosition)
    setPickerOpen(true)
  }

  const handlePlayerSelected = async (playerId: string) => {
    setPickerOpen(false)
    await fetch(`/api/games/${gameId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, seatPosition: pickerSeat }),
    })
    fetchGameState()
  }

  const handleRemovePlayer = async (seatPosition: number) => {
    await fetch(`/api/games/${gameId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatPosition }),
    })
    fetchGameState()
  }

  // --- Playing mode handlers ---
  const handleKong = async (playerId: string) => {
    if (actionLoading) return
    setActionLoading(true)
    setLoadingPlayerId(playerId)
    setLoadingAction('kong')
    try {
      const res = await fetch(`/api/games/${gameId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'kong', playerId }),
      })
      if (res.ok) {
        // Add badge directly to state without showing second popup
        const playerName = activePlayers.find(p => p.id === playerId)?.name || '未知'
        const newEvent: HandEvent = {
          id: `${Date.now()}-${Math.random()}`,
          type: 'kong',
          playerName,
        }
        setHandEvents(prev => [...prev, newEvent])
        await handlePostAction()
      }
    } finally {
      setActionLoading(false)
      setLoadingPlayerId('')
      setLoadingAction(undefined)
    }
  }

  const handleWinOrSelfDraw = (type: EventType, playerId: string) => {
    if (actionLoading || floatingEvent) return
    
    const playerName = activePlayers.find(p => p.id === playerId)?.name || '未知'
    const isDealer = playerId === dealerId
    
    let badgeType: EventBadgeType
    if (type === 'win') {
      badgeType = isDealer ? 'dealer-win' : 'win'
    } else {
      badgeType = isDealer ? 'dealer-self-draw' : 'self-draw'
    }
    
    const scoreChanges = calculateScore({
      eventType: type,
      playerId,
      dealerId,
      allPlayerIds: activePlayers.map(p => p.id),
    }).map(sc => ({
      playerId: sc.playerId,
      playerName: activePlayers.find(p => p.id === sc.playerId)?.name || '未知',
      amount: sc.amount,
    }))
    
    setFloatingEvent({
      type: badgeType,
      playerName,
      scoreChanges,
      countdown: 3,
      onConfirm: async () => {
        setFloatingEvent(null)
        setActionLoading(true)
        setLoadingPlayerId(playerId)
        setLoadingAction(type)
        try {
          const res = await fetch(`/api/games/${gameId}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, playerId }),
          })
          if (res.ok) {
            // Add badge directly to state without showing second popup
            const newEvent: HandEvent = {
              id: `${Date.now()}-${Math.random()}`,
              type: badgeType,
              playerName,
            }
            setHandEvents(prev => [...prev, newEvent])
            await handlePostAction()
          }
        } finally {
          setActionLoading(false)
          setLoadingPlayerId('')
          setLoadingAction(undefined)
        }
      },
      onCancel: () => {
        setFloatingEvent(null)
      }
    })
  }

  const handlePostAction = async () => {
    const prevRound = gameData?.currentRound
    const res = await fetch(`/api/games/${gameId}`)
    if (res.ok) {
      const newData: GameData = await res.json()
      setGameData(newData)
      if (prevRound && newData.currentRound && newData.currentRound.number > prevRound.number) {
        // Round ended - fetch complete scores for the finished round
        const roundRes = await fetch(`/api/games/${gameId}/rounds/${prevRound.id}`)
        if (roundRes.ok) {
          const roundData = await roundRes.json()
          const roundScores: Record<string, number> = {}
          const roundEvents: { playerId: string; type: string; isDealer: boolean }[] = []
          const dealerCounts: Record<string, number> = {}

          // Calculate total scores and collect events from all hands in the finished round
          for (const hand of roundData.hands) {
            const dealerId = hand.dealerId
            // Count dealer occurrences
            dealerCounts[dealerId] = (dealerCounts[dealerId] || 0) + 1

            for (const ev of hand.events) {
              // Track if this event was by the dealer
              const isDealer = ev.playerId === dealerId
              roundEvents.push({ playerId: ev.playerId, type: ev.type, isDealer })
              for (const sc of ev.scoreChanges) {
                roundScores[sc.playerId] = (roundScores[sc.playerId] || 0) + sc.amount
              }
            }
          }

          setPrevRoundNumber(prevRound.number)
          setPrevRoundScores(Object.entries(roundScores).map(([pid, amt]) => ({
            playerId: pid,
            name: newData.gamePlayers.find(gp => gp.playerId === pid)?.name || '未知',
            amount: amt,
          })))
          setPrevRoundEvents(roundEvents)
          setPrevRoundDealerCounts(dealerCounts)
          setRoundSummaryOpen(true)
        }
      }
    }
  }

  const handleUndo = async () => {
    await fetch(`/api/games/${gameId}/undo`, { method: 'POST' })
    fetchGameState()
  }

  const handleDraw = async () => {
    await fetch(`/api/games/${gameId}/draw`, { method: 'POST' })
    fetchGameState()
  }

  const handleSwap = async (outPlayerId: string, inPlayerId: string) => {
    await fetch(`/api/games/${gameId}/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outPlayerId, inPlayerId }),
    })
    fetchGameState()
  }

  const handleSwapPlayer = (playerId: string) => {
    setSwapOutPlayerId(playerId)
    setSwapPickerOpen(true)
  }

  // Swap with an in-game player = position swap via seats API
  const handleSwapInGame = async (inPlayerId: string) => {
    setSwapPickerOpen(false)
    if (!swapOutPlayerId || !gameData) return
    const outPlayer = activePlayers.find(p => p.id === swapOutPlayerId)
    const inPlayer = activePlayers.find(p => p.id === inPlayerId)
    if (!outPlayer || !inPlayer) return
    const newSeatOrder = activePlayers.map(p => {
      if (p.id === swapOutPlayerId) return { playerId: p.id, position: inPlayer.seatPosition }
      if (p.id === inPlayerId) return { playerId: p.id, position: outPlayer.seatPosition }
      return { playerId: p.id, position: p.seatPosition }
    })
    await handleSeatChange(newSeatOrder)
  }

  // Swap with an outside player = replacement via swap API
  const handleSwapOutside = async (inPlayerId: string) => {
    setSwapPickerOpen(false)
    if (swapOutPlayerId) {
      await handleSwap(swapOutPlayerId, inPlayerId)
    }
  }

  const handleSeatChange = async (seatOrder: { playerId: string; position: number }[]) => {
    await fetch(`/api/games/${gameId}/seats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatOrder }),
    })
    fetchGameState()
  }

  const handleEndGame = async () => {
    await fetch(`/api/games/${gameId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'finished' }),
    })
    router.push(`/games/${gameId}/summary`)
  }

  const handleSetDealer = async (newDealerId: string) => {
    // Set dealer and start a new round from this dealer
    await fetch(`/api/games/${gameId}/set-dealer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealerId: newDealerId }),
    })
    fetchGameState()
  }

  if (loading || !gameData) {
    return <div className="h-[100dvh] flex items-center justify-center bg-emerald-900 text-emerald-400/60">加载中...</div>
  }

  const isSetup = gameData.game.status === 'setup'
  const activePlayers: PlayerInfo[] = gameData.gamePlayers
    .filter(gp => gp.isActive)
    .sort((a, b) => a.seatPosition - b.seatPosition)
    .map(gp => ({ id: gp.playerId, name: gp.name, avatar: gp.avatar, seatPosition: gp.seatPosition }))

  const seatedPlayerIds = activePlayers.map(p => p.id)
  const allSeated = activePlayers.length === 4
  const dealerId = gameData.currentHand?.dealerId || ''
  const dealerName = activePlayers.find(p => p.id === dealerId)?.name || ''
  const roundNumber = gameData.currentRound?.number || 1
  const handNumber = gameData.currentHand?.number || 1

  

  const handleStartGame = async (startDealerId: string) => {
    setDealerPickerOpen(false)
    await fetch(`/api/games/${gameId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDealerId }),
    })
    fetchGameState()
  }

  return (
    <div className="h-[100dvh] bg-emerald-900 flex flex-col overflow-hidden">
      {/* Top bar — only in setup mode */}
      {isSetup && (
        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-950/60 text-white shrink-0">
          <Link href="/"><ArrowLeft className="h-5 w-5" /></Link>
          <span className="font-medium text-sm">{gameData.game.name || '新牌局'}</span>
          <span className="text-xs text-white/50 ml-auto">选人入座</span>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-2 min-h-0">
        <MahjongTable
          gameState={{
            players: activePlayers,
            dealerId,
            roundNumber,
            handNumber,
            roundScores: gameData.roundScores || {},
            totalScores: gameData.totalScores || {},
            gameId,
            gameStatus: isSetup ? 'setup' : 'playing',
            gameName: gameData.game.name || undefined,
          }}
          onAction={() => {}}
          onAddPlayer={handleAddPlayer}
          onRemovePlayer={handleRemovePlayer}
          onKong={handleKong}
          onWin={(pid) => handleWinOrSelfDraw('win', pid)}
          onSelfDraw={(pid) => handleWinOrSelfDraw('self_draw', pid)}
          onSwapPlayer={handleSwapPlayer}
          actionLoading={actionLoading}
          loadingPlayerId={loadingPlayerId}
          loadingAction={loadingAction}
          handEvents={handEvents}
        />
      </div>

      {floatingEvent && (
        <EventFloatingCard
          type={floatingEvent.type}
          playerName={floatingEvent.playerName}
          scoreChanges={floatingEvent.scoreChanges}
          countdown={floatingEvent.countdown}
          onConfirm={floatingEvent.onConfirm}
          onCancel={floatingEvent.onCancel}
        />
      )}

      {isSetup && allSeated && (
        <div className="px-4 pb-3 shrink-0">
          <Button
            size="lg"
            className="w-full h-12 text-lg bg-yellow-500 hover:bg-yellow-600 text-yellow-950"
            onClick={() => setDealerPickerOpen(true)}
          >
            选庄家并开始
          </Button>
        </div>
      )}

      {!isSetup && (
        <GameActionBar
          roundNumber={roundNumber}
          handNumber={handNumber}
          dealerName={dealerName}
          players={activePlayers.map(p => ({ id: p.id, name: p.name }))}
          onDraw={handleDraw}
          onUndo={handleUndo}
          onEndGame={handleEndGame}
          onSetDealer={handleSetDealer}
          onBack={() => router.push('/')}
        />
      )}

      <PlayerPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        excludePlayerIds={seatedPlayerIds}
        onSelect={handlePlayerSelected}
      />

      <DealerPickerDialog
        open={dealerPickerOpen}
        onOpenChange={setDealerPickerOpen}
        players={activePlayers}
        onConfirm={handleStartGame}
      />

      

      <RoundSummary
        open={roundSummaryOpen}
        onOpenChange={setRoundSummaryOpen}
        roundNumber={prevRoundNumber}
        scores={prevRoundScores}
        events={prevRoundEvents}
        dealerCounts={prevRoundDealerCounts}
        onNextRound={() => setRoundSummaryOpen(false)}
      />

      <SwapPlayerDialog
        open={swapPickerOpen}
        onOpenChange={setSwapPickerOpen}
        outPlayerId={swapOutPlayerId}
        inGamePlayers={activePlayers.map(p => ({ id: p.id, name: p.name, avatar: p.avatar }))}
        onSelectInGame={handleSwapInGame}
        onSelectOutside={handleSwapOutside}
      />
    </div>
  )
}
