'use client'

import { useState, useEffect, useCallback } from 'react'

interface Alert {
  id: number
  origin: string
  destination: string
  date_from: string
  date_to: string
  max_price: number | null
  adults: number
  cabin: string
  active: number
  last_best_price: number | null
  last_checked: string | null
}

interface FlightResult {
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
}

interface SearchLog {
  id: number
  origin: string
  destination: string
  departure_date: string
  return_date: string | null
  best_price: number | null
  results_count: number
  searched_at: string
}

export default function Home() {
  const [tab, setTab] = useState<'search' | 'alerts' | 'history'>('search')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [results, setResults] = useState<FlightResult[]>([])
  const [history, setHistory] = useState<SearchLog[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ alerts: 0, searches: 0, bestDeal: 0 })

  const [form, setForm] = useState({
    origin: '', destination: '', departureDate: '', returnDate: '',
    adults: '1', cabin: 'ECONOMY', maxPrice: '',
  })

  const [alertForm, setAlertForm] = useState({
    origin: '', destination: '', dateFrom: '', dateTo: '',
    maxPrice: '', adults: '1', cabin: 'ECONOMY',
  })

  const loadAlerts = useCallback(async () => {
    const res = await fetch('/api/alerts')
    if (res.ok) {
      const data = await res.json()
      setAlerts(data.alerts || [])
      setStats(s => ({ ...s, alerts: data.alerts?.length || 0 }))
    }
  }, [])

  const loadHistory = useCallback(async () => {
    const res = await fetch('/api/search?history=1')
    if (res.ok) {
      const data = await res.json()
      setHistory(data.searches || [])
      setStats(s => ({ ...s, searches: data.searches?.length || 0 }))
    }
  }, [])

  useEffect(() => {
    loadAlerts()
    loadHistory()
  }, [loadAlerts, loadHistory])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResults([])
    try {
      const params = new URLSearchParams({
        origin: form.origin.toUpperCase(),
        destination: form.destination.toUpperCase(),
        departureDate: form.departureDate,
        adults: form.adults,
        cabin: form.cabin,
      })
      if (form.returnDate) params.set('returnDate', form.returnDate)
      if (form.maxPrice) params.set('maxPrice', form.maxPrice)

      const res = await fetch(`/api/search?${params}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.flights || [])
        if (data.flights?.length) {
          setStats(s => ({ ...s, bestDeal: data.flights[0].price }))
        }
        loadHistory()
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateAlert(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: alertForm.origin.toUpperCase(),
        destination: alertForm.destination.toUpperCase(),
        date_from: alertForm.dateFrom,
        date_to: alertForm.dateTo,
        max_price: alertForm.maxPrice ? parseFloat(alertForm.maxPrice) : null,
        adults: parseInt(alertForm.adults),
        cabin: alertForm.cabin,
      }),
    })
    if (res.ok) {
      loadAlerts()
      setAlertForm({ origin: '', destination: '', dateFrom: '', dateTo: '', maxPrice: '', adults: '1', cabin: 'ECONOMY' })
    }
  }

  async function handleDeleteAlert(id: number) {
    await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' })
    loadAlerts()
  }

  async function handleToggleAlert(id: number, active: number) {
    await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: active ? 0 : 1 }),
    })
    loadAlerts()
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function formatDateTime(d: string) {
    return new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    })
  }

  function formatDuration(iso: string) {
    const m = iso.match(/PT(\d+H)?(\d+M)?/)
    if (!m) return iso
    const h = m[1] ? m[1].replace('H', 'h') : ''
    const min = m[2] ? m[2].replace('M', 'm') : ''
    return `${h}${min}`.trim()
  }

  return (
    <div className="container">
      <header>
        <div>
          <h1>Radar de Passagens</h1>
          <span className="subtitle">Encontre as melhores tarifas aereas automaticamente</span>
        </div>
      </header>

      <div className="stats">
        <div className="stat-card">
          <div className="value">{stats.alerts}</div>
          <div className="label">Alertas Ativos</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.searches}</div>
          <div className="label">Buscas Realizadas</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: stats.bestDeal ? 'var(--green)' : 'var(--muted)' }}>
            {stats.bestDeal ? `R$ ${stats.bestDeal.toFixed(0)}` : '-'}
          </div>
          <div className="label">Melhor Preco</div>
        </div>
      </div>

      <div className="tabs">
        {(['search', 'alerts', 'history'] as const).map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'search' ? 'Buscar Voos' : t === 'alerts' ? 'Alertas' : 'Historico'}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <div className="grid">
          <div className="card">
            <h2>Buscar Passagens</h2>
            <form onSubmit={handleSearch}>
              <div className="form-row">
                <div className="form-group">
                  <label>Origem</label>
                  <input placeholder="GRU" value={form.origin}
                    onChange={e => setForm({ ...form, origin: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Destino</label>
                  <input placeholder="MIA" value={form.destination}
                    onChange={e => setForm({ ...form, destination: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ida</label>
                  <input type="date" value={form.departureDate}
                    onChange={e => setForm({ ...form, departureDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Volta (opcional)</label>
                  <input type="date" value={form.returnDate}
                    onChange={e => setForm({ ...form, returnDate: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Passageiros</label>
                  <select value={form.adults} onChange={e => setForm({ ...form, adults: e.target.value })}>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Classe</label>
                  <select value={form.cabin} onChange={e => setForm({ ...form, cabin: e.target.value })}>
                    <option value="ECONOMY">Economica</option>
                    <option value="PREMIUM_ECONOMY">Premium Economy</option>
                    <option value="BUSINESS">Executiva</option>
                    <option value="FIRST">Primeira</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Preco maximo (R$)</label>
                <input type="number" placeholder="Sem limite" value={form.maxPrice}
                  onChange={e => setForm({ ...form, maxPrice: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Buscando...' : 'Buscar Voos'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2>Resultados</h2>
            {loading ? (
              <div className="loading"><div className="spinner" /></div>
            ) : results.length === 0 ? (
              <div className="empty-state">Faca uma busca para ver resultados</div>
            ) : (
              <ul className="results-list">
                {results.map((r, i) => (
                  <li key={i} className="result-item">
                    <div>
                      <div className="route">{r.airlineName} ({r.airline})</div>
                      <div className="details">
                        {formatDateTime(r.departureAt)}
                        {r.returnDepartureAt && ` - Volta: ${formatDateTime(r.returnDepartureAt)}`}
                      </div>
                      <div className="details">
                        {r.stops === 0 ? 'Direto' : `${r.stops} parada${r.stops > 1 ? 's' : ''}`}
                        {' - '}{formatDuration(r.duration)}
                      </div>
                    </div>
                    <div className="price">R$ {r.price.toFixed(0)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'alerts' && (
        <div className="grid">
          <div className="card">
            <h2>Criar Alerta</h2>
            <form onSubmit={handleCreateAlert}>
              <div className="form-row">
                <div className="form-group">
                  <label>Origem</label>
                  <input placeholder="GRU" value={alertForm.origin}
                    onChange={e => setAlertForm({ ...alertForm, origin: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Destino</label>
                  <input placeholder="MIA" value={alertForm.destination}
                    onChange={e => setAlertForm({ ...alertForm, destination: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>De (data)</label>
                  <input type="date" value={alertForm.dateFrom}
                    onChange={e => setAlertForm({ ...alertForm, dateFrom: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Ate (data)</label>
                  <input type="date" value={alertForm.dateTo}
                    onChange={e => setAlertForm({ ...alertForm, dateTo: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Preco maximo (R$)</label>
                  <input type="number" placeholder="Qualquer" value={alertForm.maxPrice}
                    onChange={e => setAlertForm({ ...alertForm, maxPrice: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Classe</label>
                  <select value={alertForm.cabin} onChange={e => setAlertForm({ ...alertForm, cabin: e.target.value })}>
                    <option value="ECONOMY">Economica</option>
                    <option value="BUSINESS">Executiva</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary">Criar Alerta</button>
            </form>
          </div>

          <div className="card">
            <h2>Alertas Ativos</h2>
            {alerts.length === 0 ? (
              <div className="empty-state">Nenhum alerta configurado</div>
            ) : (
              <ul className="results-list">
                {alerts.map(a => (
                  <li key={a.id} className="alert-item">
                    <div>
                      <div className="route">{a.origin} → {a.destination}</div>
                      <div className="meta">
                        {formatDate(a.date_from)} - {formatDate(a.date_to)}
                        {a.max_price && ` | Max R$ ${a.max_price}`}
                        {a.last_best_price && ` | Melhor: R$ ${a.last_best_price.toFixed(0)}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className={`badge ${a.active ? 'badge-active' : 'badge-inactive'}`}>
                        {a.active ? 'Ativo' : 'Pausado'}
                      </span>
                      <button className="btn-sm tab" onClick={() => handleToggleAlert(a.id, a.active)}>
                        {a.active ? 'Pausar' : 'Ativar'}
                      </button>
                      <button className="btn-sm btn-danger" onClick={() => handleDeleteAlert(a.id)}>X</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="card full-width">
          <h2>Historico de Buscas</h2>
          {history.length === 0 ? (
            <div className="empty-state">Nenhuma busca realizada</div>
          ) : (
            <ul className="results-list">
              {history.map(s => (
                <li key={s.id} className="result-item">
                  <div>
                    <div className="route">{s.origin} → {s.destination}</div>
                    <div className="details">
                      {formatDate(s.departure_date)}
                      {s.return_date && ` - ${formatDate(s.return_date)}`}
                      {' | '}{s.results_count} resultados
                    </div>
                  </div>
                  <div>
                    {s.best_price && <div className="price">R$ {s.best_price.toFixed(0)}</div>}
                    <div className="details">{formatDateTime(s.searched_at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
