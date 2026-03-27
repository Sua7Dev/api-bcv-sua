import { createClient } from '@libsql/client'
import { env } from '../servidor/intermediarios/env.js'

const databaseUrl = env.VITE_DATABASE_URL || env.DATABASE_URL
const databaseAuthToken = env.VITE_DATABASE_AUTH_TOKEN || env.DATABASE_AUTH_TOKEN

console.log('[DB Debug] Database URL present:', databaseUrl ? `SÍ (empieza con ${databaseUrl.slice(0, 10)}...)` : 'NO')
console.log('[DB Debug] Database Auth Token present:', databaseAuthToken ? 'SÍ' : 'NO')

if (!databaseUrl) {
  const errorMsg = 'La URL de la base de datos no está definida. Verifica VITE_DATABASE_URL o DATABASE_URL en los Secretos de GitHub.'
  console.error(`[DB Error] ${errorMsg}`)
  throw new Error(errorMsg)
}

export const db = createClient({
  url: databaseUrl,
  authToken: databaseAuthToken,
})
