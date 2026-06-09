const DUFFEL_TOKEN = process.env.DUFFEL_TOKEN || ''
const DUFFEL_BASE_URL = 'https://api.duffel.com'

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

const CABIN_MAP: Record<string, string> = {
  ECONOMY: 'economy',
  PREMIUM_ECONOMY: 'premium_economy',
  BUSINESS: 'business',
  FIRST: 'first',
}

export async function searchFlights(params: SearchParams): Promise<FlightOffer[]> {
  const slices: any[] = [
    {
      origin: params.origin,
      destination: params.destination,
      departure_date: params.departureDate,
    },
  ]

  if (params.returnDate) {
    slices.push({
      origin: params.destination,
      destination: params.origin,
      departure_date: params.returnDate,
    })
  }

  const passengers: any[] = []
  const numAdults = params.adults || 1
  for (let i = 0; i < numAdults; i++) {
    passengers.push({ type: 'adult' })
  }

  const body: any = {
    data: {
      slices,
      passengers,
      cabin_class: CABIN_MAP[params.cabin || 'ECONOMY'] || 'economy',
      max_connections: params.nonStop ? 0 : 1,
    },
  }

  const res = await fetch(`${DUFFEL_BASE_URL}/air/offer_requests?return_offers=true&supplier_timeout=30000`, {
    method: 'POST',
    headers: {
      'Accept-Encoding': 'gzip',
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Duffel-Version': 'v2',
      Authorization: `Bearer ${DUFFEL_TOKEN}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Duffel search failed: ${res.status} - ${err}`)
  }

  const data = await res.json()
  const rawOffers = data.data?.offers || []

  const offers: FlightOffer[] = rawOffers.map((offer: any) => {
    const outboundSlice = offer.slices?.[0]
    const returnSlice = offer.slices?.[1]

    const firstSeg = outboundSlice?.segments?.[0]
    const lastSeg = outboundSlice?.segments?.[outboundSlice.segments.length - 1]

    const totalStops = (outboundSlice?.segments?.length || 1) - 1

    const result: FlightOffer = {
      price: parseFloat(offer.total_amount || '0'),
      currency: offer.total_currency || 'BRL',
      airline: offer.owner?.iata_code || '',
      airlineName: offer.owner?.name || offer.owner?.iata_code || '',
      departureAt: firstSeg?.departing_at || '',
      arrivalAt: lastSeg?.arriving_at || '',
      stops: totalStops,
      duration: outboundSlice?.duration || '',
      segments: (outboundSlice?.segments || []).map((s: any) => ({
        departure: {
          iataCode: s.origin?.iata_code || '',
          at: s.departing_at || '',
        },
        arrival: {
          iataCode: s.destination?.iata_code || '',
          at: s.arriving_at || '',
        },
        carrierCode: s.marketing_carrier?.iata_code || s.operating_carrier?.iata_code || '',
        number: s.marketing_carrier_flight_number || '',
        duration: s.duration || '',
      })),
      source: 'duffel',
    }

    if (returnSlice) {
      const firstReturn = returnSlice.segments?.[0]
      const lastReturn = returnSlice.segments?.[returnSlice.segments.length - 1]
      result.returnDepartureAt = firstReturn?.departing_at
      result.returnArrivalAt = lastReturn?.arriving_at
    }

    return result
  })

  let filtered = offers
  if (params.maxPrice) {
    filtered = offers.filter(o => o.price <= params.maxPrice!)
  }

  return filtered.sort((a, b) => a.price - b.price).slice(0, 30)
}
