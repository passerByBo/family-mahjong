import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { now } from '@/lib/utils'
import { getGameState } from '@/lib/game-state'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const state = await getGameState(id)
    if (!state) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    return NextResponse.json(state)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (body.status === 'finished') {
      await db.update(schema.games).set({ status: 'finished', finishedAt: now() }).where(eq(schema.games.id, id))
      const updated = await db.select().from(schema.games).where(eq(schema.games.id, id))
      return NextResponse.json(updated[0])
    }

    return NextResponse.json({ error: 'Invalid update' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 })
  }
}
