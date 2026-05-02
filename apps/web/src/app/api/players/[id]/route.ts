import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { now } from '@/lib/utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, avatarId } = body

    const existing = await db.select().from(schema.players).where(eq(schema.players.id, id))
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const updates: Record<string, string> = {}
    if (name !== undefined) updates.name = name
    if (avatarId !== undefined) updates.avatar = avatarId

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    await db.update(schema.players).set(updates).where(eq(schema.players.id, id))
    const updated = await db.select().from(schema.players).where(eq(schema.players.id, id))
    const p = updated[0]
    return NextResponse.json({ id: p.id, name: p.name, avatarId: p.avatar, createdAt: p.createdAt })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.select().from(schema.players).where(eq(schema.players.id, id))
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    await db.delete(schema.players).where(eq(schema.players.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 })
  }
}
