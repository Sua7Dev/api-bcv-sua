import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

const db = createClient({
  url: process.env.VITE_DATABASE_URL,
  authToken: process.env.VITE_DATABASE_AUTH_TOKEN,
})

async function main() {
  console.log('🚀 Agregando columna "revoked" a la tabla api_keys...')
  
  try {
    await db.execute('ALTER TABLE api_keys ADD COLUMN revoked BOOLEAN DEFAULT 0')
    console.log('✅ Columna "revoked" agregada exitosamente.')
  } catch (e) {
    if (e.message.includes('duplicate column name')) {
      console.log('ℹ️ La columna "revoked" ya existe.')
    } else {
      console.error('❌ Error al agregar la columna:', e.message)
    }
  }
}

main().catch(console.error)
