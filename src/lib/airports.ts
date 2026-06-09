export interface Airport {
  code: string
  name: string
  city: string
  country: string
}

export const AIRPORTS_BR: Airport[] = [
  { code: 'GRU', name: 'Guarulhos', city: 'Sao Paulo', country: 'BR' },
  { code: 'CGH', name: 'Congonhas', city: 'Sao Paulo', country: 'BR' },
  { code: 'VCP', name: 'Viracopos', city: 'Campinas', country: 'BR' },
  { code: 'GIG', name: 'Galeao', city: 'Rio de Janeiro', country: 'BR' },
  { code: 'SDU', name: 'Santos Dumont', city: 'Rio de Janeiro', country: 'BR' },
  { code: 'BSB', name: 'Brasilia', city: 'Brasilia', country: 'BR' },
  { code: 'CNF', name: 'Confins', city: 'Belo Horizonte', country: 'BR' },
  { code: 'PLU', name: 'Pampulha', city: 'Belo Horizonte', country: 'BR' },
  { code: 'SSA', name: 'Salvador', city: 'Salvador', country: 'BR' },
  { code: 'REC', name: 'Recife', city: 'Recife', country: 'BR' },
  { code: 'FOR', name: 'Fortaleza', city: 'Fortaleza', country: 'BR' },
  { code: 'POA', name: 'Porto Alegre', city: 'Porto Alegre', country: 'BR' },
  { code: 'CWB', name: 'Curitiba', city: 'Curitiba', country: 'BR' },
  { code: 'FLN', name: 'Florianopolis', city: 'Florianopolis', country: 'BR' },
  { code: 'NAT', name: 'Natal', city: 'Natal', country: 'BR' },
  { code: 'MCZ', name: 'Maceio', city: 'Maceio', country: 'BR' },
  { code: 'BEL', name: 'Belem', city: 'Belem', country: 'BR' },
  { code: 'MAO', name: 'Manaus', city: 'Manaus', country: 'BR' },
  { code: 'CGB', name: 'Cuiaba', city: 'Cuiaba', country: 'BR' },
  { code: 'GYN', name: 'Goiania', city: 'Goiania', country: 'BR' },
  { code: 'VIX', name: 'Vitoria', city: 'Vitoria', country: 'BR' },
  { code: 'AJU', name: 'Aracaju', city: 'Aracaju', country: 'BR' },
  { code: 'SLZ', name: 'Sao Luis', city: 'Sao Luis', country: 'BR' },
  { code: 'THE', name: 'Teresina', city: 'Teresina', country: 'BR' },
  { code: 'JPA', name: 'Joao Pessoa', city: 'Joao Pessoa', country: 'BR' },
  { code: 'IGU', name: 'Foz do Iguacu', city: 'Foz do Iguacu', country: 'BR' },
]

export const AIRPORTS_INTL: Airport[] = [
  { code: 'MIA', name: 'Miami', city: 'Miami', country: 'US' },
  { code: 'MCO', name: 'Orlando', city: 'Orlando', country: 'US' },
  { code: 'JFK', name: 'JFK', city: 'New York', country: 'US' },
  { code: 'EWR', name: 'Newark', city: 'New York', country: 'US' },
  { code: 'LAX', name: 'Los Angeles', city: 'Los Angeles', country: 'US' },
  { code: 'ATL', name: 'Atlanta', city: 'Atlanta', country: 'US' },
  { code: 'LIS', name: 'Lisboa', city: 'Lisboa', country: 'PT' },
  { code: 'OPO', name: 'Porto', city: 'Porto', country: 'PT' },
  { code: 'MAD', name: 'Barajas', city: 'Madrid', country: 'ES' },
  { code: 'BCN', name: 'Barcelona', city: 'Barcelona', country: 'ES' },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'FR' },
  { code: 'FCO', name: 'Fiumicino', city: 'Roma', country: 'IT' },
  { code: 'LHR', name: 'Heathrow', city: 'Londres', country: 'GB' },
  { code: 'EZE', name: 'Ezeiza', city: 'Buenos Aires', country: 'AR' },
  { code: 'SCL', name: 'Santiago', city: 'Santiago', country: 'CL' },
  { code: 'BOG', name: 'Bogota', city: 'Bogota', country: 'CO' },
  { code: 'PTY', name: 'Panama', city: 'Panama', country: 'PA' },
  { code: 'CUN', name: 'Cancun', city: 'Cancun', country: 'MX' },
  { code: 'DXB', name: 'Dubai', city: 'Dubai', country: 'AE' },
  { code: 'NRT', name: 'Narita', city: 'Tokyo', country: 'JP' },
]

export const ALL_AIRPORTS = [...AIRPORTS_BR, ...AIRPORTS_INTL]

export function findAirport(query: string): Airport | undefined {
  const q = query.toUpperCase()
  return ALL_AIRPORTS.find(
    a => a.code === q || a.city.toUpperCase().includes(q) || a.name.toUpperCase().includes(q)
  )
}
