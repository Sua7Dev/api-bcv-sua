import { createClient } from '@libsql/client'
import { env } from '../servidor/intermediarios/env.js'

console.log('[DB Debug] VITE_DATABASE_URL:', env.VITE_DATABASE_URL ? `DEFINIDA (empieza con ${env.VITE_DATABASE_URL.slice(0, 10)}...)` : 'NO DEFINIDA')
console.log('[DB Debug] VITE_DATABASE_AUTH_TOKEN:', env.VITE_DATABASE_AUTH_TOKEN ? 'DEFINIDA' : 'NO DEFINIDA')

if (!env.VITE_DATABASE_URL) {
  const errorMsg = 'VITE_DATABASE_URL no está definida. Verifica que el secreto esté configurado en GitHub o en las variables de entorno.'
  console.error(`[DB Error] ${errorMsg}`)
  throw new Error(errorMsg)
}

export const db = createClient({
  url: env.VITE_DATABASE_URL,
  authToken: env.VITE_DATABASE_AUTH_TOKEN,
})
