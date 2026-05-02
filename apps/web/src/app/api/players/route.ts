import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { generateId, now } from '@/lib/utils'

export async function GET() {
  try {
    const allPlayers = await db.select().from(schema.players)
    const mapped = allPlayers.map(p => ({ id: p.id, name: p.name, avatarId: p.avatar, createdAt: p.createdAt }))
    return NextResponse.json(mapped)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, avatarId } = body

    if (!name || !avatarId) {
      return NextResponse.json({ error: 'name and avatarId are required' }, { status: 400 })
    }

    const player = {
      id: generateId(),
      name,
      avatar: avatarId,
      createdAt: now(),
    }

    await db.insert(schema.players).values(player)
    return NextResponse.json({ id: player.id, name: player.name, avatarId, createdAt: player.createdAt }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })
  }
}
