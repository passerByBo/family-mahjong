'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { AvatarPicker } from '@/components/avatar-picker'
import { getAvatarById } from '@/lib/avatars'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'

interface Player {
  id: string
  name: string
  avatarId: string
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null)
  const [name, setName] = useState('')
  const [avatarId, setAvatarId] = useState('avatar-01')
  const [saving, setSaving] = useState(false)

  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch('/api/players')
      if (res.ok) {
        const data = await res.json()
        setPlayers(data)
      }
    } catch (error) {
      console.error('获取玩家列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  const openAddDialog = () => {
    setEditingPlayer(null)
    setName('')
    setAvatarId('avatar-01')
    setDialogOpen(true)
  }

  const openEditDialog = (player: Player) => {
    setEditingPlayer(player)
    setName(player.name)
    setAvatarId(player.avatarId)
    setDialogOpen(true)
  }

  const openDeleteDialog = (player: Player) => {
    setDeletingPlayer(player)
    setDeleteDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editingPlayer) {
        await fetch(`/api/players/${editingPlayer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), avatarId }),
        })
      } else {
        await fetch('/api/players', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), avatarId }),
        })
      }
      setDialogOpen(false)
      fetchPlayers()
    } catch (error) {
      console.error('保存玩家失败:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingPlayer) return
    try {
      await fetch(`/api/players/${deletingPlayer.id}`, { method: 'DELETE' })
      setDeleteDialogOpen(false)
      setDeletingPlayer(null)
      fetchPlayers()
    } catch (error) {
      console.error('删除玩家失败:', error)
    }
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 px-4 pt-8 pb-6 text-white">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold drop-shadow">玩家管理</h1>
          <Button size="sm" onClick={openAddDialog} className="bg-white/20 hover:bg-white/30 text-white border-0">
            <Plus className="h-4 w-4 mr-1" />
            添加玩家
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto -mt-3">

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">加载中...</div>
        ) : players.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">还没有玩家，点击添加</p>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-1" />
                添加玩家
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {players.map((player) => {
              const avatar = getAvatarById(player.avatarId)
              return (
                <Card key={player.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={avatar?.path} alt={player.name} />
                        <AvatarFallback>{player.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(player)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(player)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 添加/编辑 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>{editingPlayer ? '编辑玩家' : '添加玩家'}</DialogTitle>
            <DialogDescription>
              {editingPlayer ? '修改玩家信息' : '输入玩家名称并选择头像'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-2 block">名称</label>
              <Input
                placeholder="请输入玩家名称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">头像</label>
              <AvatarPicker value={avatarId} onChange={setAvatarId} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除玩家 &ldquo;{deletingPlayer?.name}&rdquo; 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
