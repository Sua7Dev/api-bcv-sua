import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Lógica adaptada de scripts/generated-keys.js
 */
function generateKey(length = 32) {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz'
  const numberChars = '0123456789'
  const symbolChars = '!@$&'

  const activeSets = [uppercaseChars, lowercaseChars, numberChars, symbolChars]

  let passwordArray = []

  // Asegurar al menos uno de cada set
  activeSets.forEach((set) => {
    const randomChar = set[Math.floor(Math.random() * set.length)]
    passwordArray.push(randomChar)
  })

  // Completar hasta el largo deseado
  const pool = activeSets.join('')
  while (passwordArray.length < length) {
    const randomChar = pool[Math.floor(Math.random() * pool.length)]
    passwordArray.push(randomChar)
  }

  // Mezclar
  passwordArray = passwordArray.sort(() => Math.random() - 0.5)
  return passwordArray.join('')
}

const db = createClient({
  url: process.env.VITE_DATABASE_URL,
  authToken: process.env.VITE_DATABASE_AUTH_TOKEN,
})

async function main() {
  const args = process.argv.slice(2)
  const params = {}

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace('--', '')
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true
      params[key] = value
    }
  }

  const name = params.name || 'API Key ' + Date.now()
  const length = parseInt(params.length) || 32
  const days = params.days ? parseInt(params.days) : null
  const ilimitada = params.ilimitada === true

  if (!params.name && !ilimitada && !params.days) {
    console.log(`
Uso: bun run scripts/generar-api-key.js --name "Nombre" [--days 30] [--length 32] [--ilimitada]

Ejemplos:
  bun run scripts/generar-api-key.js --name "Cliente Premium" --days 365
  bun run scripts/generar-api-key.js --name "Socio" --ilimitada
    `)
    return
  }

  const key = generateKey(length)
  let expiresAt = null

  if (!ilimitada && days) {
    const date = new Date()
    date.setDate(date.getDate() + days)
    expiresAt = date.toISOString()
  }

  console.log('🚀 Generando API Key para:', name)

  try {
    await db.execute({
      sql: 'INSERT INTO api_keys (name, key, expires_at) VALUES (?, ?, ?)',
      args: [name, key, expiresAt]
    })

    console.log('\n✅ ¡API Key generada y guardada con éxito!')
    console.log('-------------------------------------------')
    console.log('Nombre:', name)
    console.log('Key:   ', key)
    console.log('Expira:', expiresAt || 'Nunca (Ilimitada)')
    console.log('-------------------------------------------')
    console.log('⚠️  Copia esta clave ahora, no se volverá a mostrar.')
  } catch (error) {
    console.error('❌ Error al guardar en la base de datos:', error.message)
  }
}

main().catch(console.error)
