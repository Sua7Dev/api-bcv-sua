import { createClient } from '@libsql/client'
import { env } from '../servidor/intermediarios/env.js'

console.log('[DB Debug] VITE_DATABASE_URL:', env.VITE_DATABASE_URL ? 'DEFINIDA (empieza con ' + env.VITE_DATABASE_URL.slice(0, 7) + ')' : 'NO DEFINIDA')
console.log('[DB Debug] VITE_DATABASE_AUTH_TOKEN:', env.VITE_DATABASE_AUTH_TOKEN ? 'DEFINIDA' : 'NO DEFINIDA')

if (!env.VITE_DATABASE_URL) {
  throw new Error('VITE_DATABASE_URL no está definida. Verifica las variables de entorno en GitHub Secrets.')
}

export const db = createClient({
  url: env.VITE_DATABASE_URL,
  authToken: env.VITE_DATABASE_AUTH_TOKEN,
})
