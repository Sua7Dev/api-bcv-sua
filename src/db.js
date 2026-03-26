import { createClient } from '@libsql/client'
import { env } from '../servidor/intermediarios/env.js'

if (!env.VITE_DATABASE_URL) {
  throw new Error('VITE_DATABASE_URL no está definida. Verifica las variables de entorno.')
}

export const db = createClient({
  url: env.VITE_DATABASE_URL,
  authToken: env.VITE_DATABASE_AUTH_TOKEN,
})
