import { NextRequest, NextResponse } from 'next/server'
import { getDb, type Alert } from '@/lib/db'
import { searchFlights } from '@/lib/amadeus'
import { sendTelegramMessage, formatFlightAlert } from '@/lib/telegram'

const CRON_SECRET = process.env.CRON_SECRET || ''

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = getDb()
  const alerts = db.prepare('SELECT * FROM alerts WHERE active = 1').all() as Alert[]

  if (alerts.length === 0) {
    return NextResponse.json({ message: 'no active alerts', checked: 0 })
  }

  let checked = 0
  let notified = 0

  for (const alert of alerts) {
    try {
      const today = new Date()
      const dateFrom = new Date(alert.date_from)
      const dateTo = new Date(alert.date_to)

      if (dateTo < today) {
        db.prepare('UPDATE alerts SET active = 0 WHERE id = ?').run(alert.id)
        continue
      }

      const searchDate = dateFrom > today ? alert.date_from : today.toISOString().split('T')[0]

      const flights = await searchFlights({
        origin: alert.origin,
        destination: alert.destination,
        departureDate: searchDate,
        adults: alert.adults,
        cabin: alert.cabin,
        maxPrice: alert.max_price || undefined,
      })

      checked++

      if (flights.length > 0) {
        const best = flights[0]

        db.prepare(`
          INSERT INTO price_history (alert_id, price, currency, airline, departure_at, arrival_at, stops, duration, source)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          alert.id, best.price, best.currency, best.airline,
          best.departureAt, best.arrivalAt, best.stops, best.duration, best.source,
        )

        const shouldNotify =
          !alert.last_best_price ||
          best.price < alert.last_best_price * 0.95 ||
          (alert.max_price && best.price <= alert.max_price && (!alert.last_best_price || alert.last_best_price > alert.max_price))

        if (shouldNotify && alert.telegram_chat_id) {
          const msg = formatFlightAlert({
            origin: alert.origin,
            destination: alert.destination,
            price: best.price,
            currency: best.currency,
            airline: best.airlineName,
            departureAt: best.departureAt,
            arrivalAt: best.arrivalAt,
            returnDepartureAt: best.returnDepartureAt,
            stops: best.stops,
            previousPrice: alert.last_best_price || undefined,
          })

          await sendTelegramMessage(msg, alert.telegram_chat_id)
          notified++
        }

        db.prepare(
          'UPDATE alerts SET last_checked = datetime("now"), last_best_price = ? WHERE id = ?'
        ).run(best.price, alert.id)
      } else {
        db.prepare('UPDATE alerts SET last_checked = datetime("now") WHERE id = ?').run(alert.id)
      }

      await new Promise(r => setTimeout(r, 1000))
    } catch (err) {
      console.error(`Error checking alert ${alert.id}:`, err)
    }
  }

  return NextResponse.json({ checked, notified, total: alerts.length })
}
