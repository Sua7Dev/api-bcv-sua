import { createClient } from '@libsql/client'
import { env } from '../servidor/intermediarios/env.js'

export const db = createClient({
  url: env.VITE_DATABASE_URL,
  authToken: env.VITE_DATABASE_AUTH_TOKEN,
})
