import { authMiddleware } from '../src/auth.js'
import { db } from '../src/db.js'

async function mockContext(apiKey) {
  return {
    req: {
      header: (name) => name === 'x-api-key' ? apiKey : null
    },
    json: (data, status) => ({ data, status }),
  }
}

async function test() {
  console.log('🧪 Iniciando pruebas de validación de API Key con errores estandarizados...')

  const validKey = process.env.VITE_API_KEY
  const invalidKey = 'clave-falsa'
  
  // 1. Falta API Key
  console.log('\n--- Escenario 1: Falta API Key ---')
  const ctx1 = await mockContext(null)
  const res1 = await authMiddleware(ctx1, () => {})
  console.log('Status:', res1.status)
  console.log('Response:', JSON.stringify(res1.data, null, 2))
  if (res1.status === 401 && res1.data.error.code === 'api_key_missing') console.log('✅ Correcto.')
  else console.error('❌ Error en validación.')

  // 2. API Key Inválida
  console.log('\n--- Escenario 2: API Key Inválida ---')
  const ctx2 = await mockContext(invalidKey)
  const res2 = await authMiddleware(ctx2, () => {})
  console.log('Status:', res2.status)
  console.log('Response:', JSON.stringify(res2.data, null, 2))
  if (res2.status === 401 && res2.data.error.code === 'api_key_invalid') console.log('✅ Correcto.')
  else console.error('❌ Error en validación.')

  // 3. API Key Expirada
  console.log('\n--- Escenario 3: API Key Expirada ---')
  const expiredKey = 'expired-standard-test'
  await db.execute({
    sql: 'INSERT INTO api_keys (name, key, expires_at) VALUES (?, ?, ?)',
    args: ['Expired Test', expiredKey, '2020-01-01T00:00:00Z']
  })
  const ctx3 = await mockContext(expiredKey)
  const res3 = await authMiddleware(ctx3, () => {})
  console.log('Status:', res3.status)
  console.log('Response:', JSON.stringify(res3.data, null, 2))
  if (res3.status === 403 && res3.data.error.code === 'api_key_expired') console.log('✅ Correcto.')
  else console.error('❌ Error en validación.')

  // 4. API Key Revocada
  console.log('\n--- Escenario 4: API Key Revocada ---')
  const revokedKey = 'revoked-standard-test'
  await db.execute({
    sql: 'INSERT INTO api_keys (name, key, revoked) VALUES (?, ?, ?)',
    args: ['Revoked Test', revokedKey, 1]
  })
  const ctx4 = await mockContext(revokedKey)
  const res4 = await authMiddleware(ctx4, () => {})
  console.log('Status:', res4.status)
  console.log('Response:', JSON.stringify(res4.data, null, 2))
  if (res4.status === 403 && res4.data.error.code === 'api_key_revoked') console.log('✅ Correcto.')
  else console.error('❌ Error en validación.')

  // 5. Clave válida (Ilimitada)
  console.log('\n--- Escenario 5: Clave válida (ilimitada) ---')
  let nextCalled = false
  const ctx5 = await mockContext(validKey)
  await authMiddleware(ctx5, () => { nextCalled = true })
  if (nextCalled) console.log('✅ Clave válida aceptada.')
  else console.error('❌ Clave válida rechazada.')

  // Limpieza
  await db.execute({ sql: 'DELETE FROM api_keys WHERE key IN (?, ?)', args: [expiredKey, revokedKey] })
  
  console.log('\n✨ Pruebas finalizadas.')
}

test().catch(console.error)
