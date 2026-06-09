const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY || ''
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET || ''
const AMADEUS_BASE_URL = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com'

let cachedToken: { token: string; expiresAt: number } | null = null

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  const res = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: AMADEUS_API_KEY,
      client_secret: AMADEUS_API_SECRET,
    }),
  })

  if (!res.ok) {
    throw new Error(`Amadeus auth failed: ${res.status}`)
  }

  const data = await res.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return cachedToken.token
}

export interface FlightOffer {
  price: number
  currency: string
  airline: string
  airlineName: string
  departureAt: string
  arrivalAt: string
  returnDepartureAt?: string
  returnArrivalAt?: string
  stops: number
  duration: string
  segments: FlightSegment[]
  source: string
}

export interface FlightSegment {
  departure: { iataCode: string; at: string }
  arrival: { iataCode: string; at: string }
  carrierCode: string
  number: string
  duration: string
}

export interface SearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults?: number
  cabin?: string
  maxPrice?: number
  nonStop?: boolean
}

const AIRLINE_NAMES: Record<string, string> = {
  G3: 'Gol', JJ: 'Latam', AD: 'Azul', LA: 'Latam',
  AA: 'American Airlines', UA: 'United', DL: 'Delta',
  BA: 'British Airways', AF: 'Air France', LH: 'Lufthansa',
  IB: 'Iberia', TP: 'TAP Portugal', AV: 'Avianca',
  CM: 'Copa Airlines', AR: 'Aerolineas Argentinas',
  EK: 'Emirates', QR: 'Qatar Airways', TK: 'Turkish Airlines',
}

export async function searchFlights(params: SearchParams): Promise<FlightOffer[]> {
  const token = await getToken()

  const query = new URLSearchParams({
    originLocationCode: params.origin,
    destinationLocationCode: params.destination,
    departureDate: params.departureDate,
    adults: String(params.adults || 1),
    travelClass: params.cabin || 'ECONOMY',
    currencyCode: 'BRL',
    max: '20',
  })

  if (params.returnDate) {
    query.set('returnDate', params.returnDate)
  }
  if (params.nonStop) {
    query.set('nonStop', 'true')
  }
  if (params.maxPrice) {
    query.set('maxPrice', String(params.maxPrice))
  }

  const res = await fetch(
    `${AMADEUS_BASE_URL}/v2/shopping/flight-offers?${query}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Amadeus search failed: ${res.status} - ${err}`)
  }

  const data = await res.json()
  const offers: FlightOffer[] = (data.data || []).map((offer: any) => {
    const itineraries = offer.itineraries || []
    const outbound = itineraries[0]
    const inbound = itineraries[1]
    const firstSegment = outbound?.segments?.[0]
    const lastOutboundSegment = outbound?.segments?.[outbound.segments.length - 1]
    const carrierCode = firstSegment?.carrierCode || ''

    const result: FlightOffer = {
      price: parseFloat(offer.price?.grandTotal || '0'),
      currency: offer.price?.currency || 'BRL',
      airline: carrierCode,
      airlineName: AIRLINE_NAMES[carrierCode] || carrierCode,
      departureAt: firstSegment?.departure?.at || '',
      arrivalAt: lastOutboundSegment?.arrival?.at || '',
      stops: (outbound?.segments?.length || 1) - 1,
      duration: outbound?.duration || '',
      segments: (outbound?.segments || []).map((s: any) => ({
        departure: s.departure,
        arrival: s.arrival,
        carrierCode: s.carrierCode,
        number: s.number,
        duration: s.duration,
      })),
      source: 'amadeus',
    }

    if (inbound) {
      const firstReturn = inbound.segments[0]
      const lastReturn = inbound.segments[inbound.segments.length - 1]
      result.returnDepartureAt = firstReturn?.departure?.at
      result.returnArrivalAt = lastReturn?.arrival?.at
    }

    return result
  })

  return offers.sort((a, b) => a.price - b.price)
}

export async function searchFlightDates(params: {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
}): Promise<Array<{ departureDate: string; returnDate?: string; price: number; currency: string }>> {
  const token = await getToken()

  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    departureDate: params.departureDate,
  })
  if (params.returnDate) {
    query.set('returnDate', params.returnDate)
  }

  const res = await fetch(
    `${AMADEUS_BASE_URL}/v1/shopping/flight-dates?${query}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) return []

  const data = await res.json()
  return (data.data || []).map((d: any) => ({
    departureDate: d.departureDate,
    returnDate: d.returnDate,
    price: parseFloat(d.price?.total || '0'),
    currency: d.price?.currency || 'BRL',
  }))
}
