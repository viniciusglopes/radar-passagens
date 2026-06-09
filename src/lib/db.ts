import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'radar.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs')
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initDb(db)
  }
  return db
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      date_from TEXT NOT NULL,
      date_to TEXT NOT NULL,
      max_price REAL,
      adults INTEGER DEFAULT 1,
      cabin TEXT DEFAULT 'ECONOMY',
      active INTEGER DEFAULT 1,
      telegram_chat_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_checked TEXT,
      last_best_price REAL
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id INTEGER NOT NULL,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'BRL',
      airline TEXT,
      departure_at TEXT,
      arrival_at TEXT,
      return_departure_at TEXT,
      return_arrival_at TEXT,
      stops INTEGER DEFAULT 0,
      duration TEXT,
      source TEXT DEFAULT 'amadeus',
      found_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      departure_date TEXT NOT NULL,
      return_date TEXT,
      adults INTEGER DEFAULT 1,
      cabin TEXT DEFAULT 'ECONOMY',
      results_count INTEGER DEFAULT 0,
      best_price REAL,
      searched_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(active);
    CREATE INDEX IF NOT EXISTS idx_price_history_alert ON price_history(alert_id, found_at);
  `)
}

export interface Alert {
  id: number
  origin: string
  destination: string
  date_from: string
  date_to: string
  max_price: number | null
  adults: number
  cabin: string
  active: number
  telegram_chat_id: string | null
  created_at: string
  last_checked: string | null
  last_best_price: number | null
}

export interface PriceRecord {
  id: number
  alert_id: number
  price: number
  currency: string
  airline: string
  departure_at: string
  arrival_at: string
  return_departure_at: string | null
  return_arrival_at: string | null
  stops: number
  duration: string
  source: string
  found_at: string
}
