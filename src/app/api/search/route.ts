import { NextRequest, NextResponse } from 'next/server'
import { searchFlights } from '@/lib/amadeus'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams

  if (params.get('history')) {
    const db = getDb()
    const searches = db.prepare(
      'SELECT * FROM searches ORDER BY searched_at DESC LIMIT 50'
    ).all()
    return NextResponse.json({ searches })
  }

  const origin = params.get('origin')
  const destination = params.get('destination')
  const departureDate = params.get('departureDate')

  if (!origin || !destination || !departureDate) {
    return NextResponse.json({ error: 'origin, destination, departureDate required' }, { status: 400 })
  }

  try {
    const flights = await searchFlights({
      origin,
      destination,
      departureDate,
      returnDate: params.get('returnDate') || undefined,
      adults: parseInt(params.get('adults') || '1'),
      cabin: params.get('cabin') || 'ECONOMY',
      maxPrice: params.get('maxPrice') ? parseFloat(params.get('maxPrice')!) : undefined,
    })

    const db = getDb()
    db.prepare(`
      INSERT INTO searches (origin, destination, departure_date, return_date, adults, cabin, results_count, best_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      origin, destination, departureDate,
      params.get('returnDate'),
      parseInt(params.get('adults') || '1'),
      params.get('cabin') || 'ECONOMY',
      flights.length,
      flights[0]?.price || null,
    )

    return NextResponse.json({ flights })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
