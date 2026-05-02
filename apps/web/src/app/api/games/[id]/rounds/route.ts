import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params

    const allRounds = await db.select().from(schema.rounds)
      .where(eq(schema.rounds.gameId, gameId)).orderBy(schema.rounds.number)

    return NextResponse.json(allRounds)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rounds' }, { status: 500 })
  }
}
