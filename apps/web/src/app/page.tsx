'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Plus, Users, History, PlayCircle, Settings } from 'lucide-react'

interface Game {
  id: string
  name: string | null
  status: string
  createdAt: string
  players: { name: string }[]
}

export default function Home() {
  const router = useRouter()
  const [activeGames, setActiveGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [gameName, setGameName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function fetchActiveGames() {
      try {
        const res = await fetch('/api/games?status=active')
        if (res.ok) {
          const data = await res.json()
          setActiveGames(data)
        }
      } catch (error) {
        console.error('获取牌局失败:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchActiveGames()
  }, [])
  const openCreateDialog = () => {
    const today = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
    setGameName(`${today}牌局`)
    setCreateOpen(true)
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: gameName.trim() || undefined }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/games/${data.game.id}`)
      }
    } catch (error) {
      console.error('创建牌局失败:', error)
    } finally {
      setCreating(false)
    }
  }

  const statusLabel = (s: string) => s === 'setup' ? '设置中' : '进行中'
  const statusVariant = (s: string) => s === 'setup' ? 'secondary' as const : 'default' as const

  return (
    <div className="min-h-screen pb-20">
      {/* Hero section */}
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-600 px-4 pt-10 pb-8 text-white">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">家庭麻将计分板</h1>
          <p className="text-emerald-200/80">记录每一局的精彩</p>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto -mt-4">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Button
            size="lg"
            className="h-20 text-base bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg shadow-amber-500/25 border-0"
            onClick={openCreateDialog}
          >
            <Plus className="h-5 w-5 mr-2" />
            创建牌局
          </Button>
          <Button asChild variant="outline" size="lg" className="h-20 text-base shadow-md hover:shadow-lg transition-shadow">
            <Link href="/players">
              <Users className="h-5 w-5 mr-2" />
              玩家管理
            </Link>
          </Button>
        </div>

        {!loading && activeGames.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">当前牌局</h2>
            <div className="space-y-3">
              {activeGames.map((game) => (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <Card className="hover:bg-accent/50 transition-all cursor-pointer mb-3 shadow-md hover:shadow-lg overflow-hidden">
                    <CardContent className="flex items-center justify-between p-4 relative">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${game.status === 'setup' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                      <div className="flex items-center gap-3 pl-2">
                        {game.status === 'setup' ? (
                          <Settings className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <PlayCircle className="h-5 w-5 text-primary" />
                        )}
                        <div>
                          <p className="font-medium">{game.name || '未命名牌局'}</p>
                          <p className="text-xs text-muted-foreground">
                            {game.players.length > 0
                              ? game.players.map(p => p.name).join('、')
                              : '暂无玩家'}
                            {' · '}
                            {new Date(game.createdAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={statusVariant(game.status)}>{statusLabel(game.status)}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <Button asChild variant="link">
            <Link href="/history">
              <History className="h-4 w-4 mr-1" />
              历史牌局
            </Link>
          </Button>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>创建牌局</DialogTitle>
            <DialogDescription>输入牌局名称，创建后选人入座</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="牌局名称"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              maxLength={30}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
