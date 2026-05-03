'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { MahjongTable } from '@/components/mahjong-table'
import { GameActionBar } from '@/components/game-action-bar'
import { RoundSummary } from '@/components/round-summary'
import { PlayerPickerDialog } from '@/components/player-picker-dialog'
import { SwapPlayerDialog } from '@/components/swap-player-dialog'
import { DealerPickerDialog } from '@/components/dealer-picker-dialog'
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

  // Playing mode state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ type: EventType; playerId: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const submitRef = useRef<() => void>(() => {})

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

  // Countdown auto-confirm for win/self-draw
  useEffect(() => {
    if (confirmOpen && !actionLoading) {
      setCountdown(5)
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!)
            submitRef.current()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (countdownRef.current) clearInterval(countdownRef.current)
      setCountdown(0)
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [confirmOpen, actionLoading])

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
    setActionLoading(true)
    try {
      const res = await fetch(`/api/games/${gameId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'kong', playerId }),
      })
      if (res.ok) await handlePostAction()
    } finally {
      setActionLoading(false)
    }
  }

  const handleWinOrSelfDraw = (type: EventType, playerId: string) => {
    setPendingAction({ type, playerId })
    setConfirmOpen(true)
  }

  const submitPendingAction = async () => {
    if (!pendingAction) return
    if (countdownRef.current) clearInterval(countdownRef.current)
    setActionLoading(true)
    try {
      const res = await fetch(`/api/games/${gameId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: pendingAction.type, playerId: pendingAction.playerId }),
      })
      if (res.ok) await handlePostAction()
    } finally {
      setActionLoading(false)
      setConfirmOpen(false)
      setPendingAction(null)
    }
  }
  submitRef.current = submitPendingAction

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

  const previewChanges = pendingAction
    ? calculateScore({
        eventType: pendingAction.type,
        playerId: pendingAction.playerId,
        dealerId,
        allPlayerIds: activePlayers.map(p => p.id),
      })
    : []
  const getPlayerName = (id: string) => activePlayers.find(p => p.id === id)?.name || '未知'
  const typeLabel = (t: string) => t === 'kong' ? '杠' : t === 'win' ? '胡' : '自摸'

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
        />
      </div>

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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>确认操作</DialogTitle>
            <DialogDescription>
              {pendingAction && `${getPlayerName(pendingAction.playerId)} ${typeLabel(pendingAction.type)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm font-medium text-muted-foreground">积分变化预览:</p>
            {previewChanges.map(sc => (
              <div key={sc.playerId} className="flex justify-between items-center px-2">
                <span className="text-sm">{getPlayerName(sc.playerId)}</span>
                <span className={`text-sm font-bold ${sc.amount > 0 ? 'text-green-600' : sc.amount < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {sc.amount > 0 ? `+${sc.amount}` : sc.amount}
                </span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmOpen(false); setPendingAction(null) }}>取消</Button>
            <Button onClick={submitPendingAction} disabled={actionLoading}>
              {actionLoading ? '提交中...' : countdown > 0 ? `确认 (${countdown}s)` : '确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
