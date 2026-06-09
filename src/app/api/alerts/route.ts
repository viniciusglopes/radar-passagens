import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const alerts = db.prepare('SELECT * FROM alerts ORDER BY created_at DESC').all()
  return NextResponse.json({ alerts })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { origin, destination, date_from, date_to, max_price, adults, cabin } = body

  if (!origin || !destination || !date_from || !date_to) {
    return NextResponse.json({ error: 'origin, destination, date_from, date_to required' }, { status: 400 })
  }

  const db = getDb()
  const result = db.prepare(`
    INSERT INTO alerts (origin, destination, date_from, date_to, max_price, adults, cabin, telegram_chat_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    origin.toUpperCase(), destination.toUpperCase(), date_from, date_to,
    max_price || null, adults || 1, cabin || 'ECONOMY',
    process.env.TELEGRAM_CHAT_ID || '194543050',
  )

  return NextResponse.json({ id: result.lastInsertRowid })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, active } = body

  if (id === undefined || active === undefined) {
    return NextResponse.json({ error: 'id and active required' }, { status: 400 })
  }

  const db = getDb()
  db.prepare('UPDATE alerts SET active = ? WHERE id = ?').run(active, id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const db = getDb()
  db.prepare('DELETE FROM alerts WHERE id = ?').run(id)
  return NextResponse.json({ ok: true })
}
