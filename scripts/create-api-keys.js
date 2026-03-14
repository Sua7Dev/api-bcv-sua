import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

const db = createClient({
  url: process.env.VITE_DATABASE_URL,
  authToken: process.env.VITE_DATABASE_AUTH_TOKEN,
})

async function main() {
  console.log('🚀 Creando tabla api_keys en Turso...')
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      key TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    )
  `)

  console.log('✅ Tabla creada.')

  const initialKey = process.env.VITE_API_KEY
  if (initialKey) {
    console.log('🌱 Insertando API key inicial desde .env...')
    try {
      await db.execute({
        sql: 'INSERT INTO api_keys (name, key, expires_at) VALUES (?, ?, ?)',
        args: ['Initial Key', initialKey, null]
      })
      console.log('✅ API key inicial insertada (Ilimitada).')
    } catch (e) {
      if (e.message.includes('UNIQUE constraint failed')) {
        console.log('ℹ️ La API key ya existe en la base de datos.')
      } else {
        console.error('❌ Error al insertar la clave:', e.message)
      }
    }
  } else {
    console.warn('⚠️ No se encontró VITE_API_KEY en el .env')
  }
}

main().catch(console.error)
