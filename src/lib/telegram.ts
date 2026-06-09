const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const DEFAULT_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '194543050'

export async function sendTelegramMessage(
  text: string,
  chatId: string = DEFAULT_CHAT_ID
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false

  const res = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: undefined,
      }),
    }
  )

  return res.ok
}

export function formatFlightAlert(alert: {
  origin: string
  destination: string
  price: number
  currency: string
  airline: string
  departureAt: string
  arrivalAt: string
  returnDepartureAt?: string
  stops: number
  previousPrice?: number
}): string {
  const { origin, destination, price, currency, airline, departureAt, stops, previousPrice } = alert

  const depDate = new Date(departureAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const stopsText = stops === 0 ? 'Direto' : `${stops} parada${stops > 1 ? 's' : ''}`

  let msg = `RADAR DE PASSAGENS\n\n`
  msg += `${origin} -> ${destination}\n`
  msg += `Preco: R$ ${price.toFixed(2)}\n`

  if (previousPrice && previousPrice > price) {
    const diff = previousPrice - price
    const pct = ((diff / previousPrice) * 100).toFixed(0)
    msg += `Queda de R$ ${diff.toFixed(2)} (-${pct}%)\n`
  }

  msg += `Cia: ${airline}\n`
  msg += `Saida: ${depDate}\n`
  msg += `${stopsText}\n`

  if (alert.returnDepartureAt) {
    const retDate = new Date(alert.returnDepartureAt).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    msg += `Volta: ${retDate}\n`
  }

  return msg
}
