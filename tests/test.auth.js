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
  console.log('🧪 Iniciando pruebas de validación de API Key...')

  const validKey = process.env.VITE_API_KEY
  const invalidKey = 'clave-falsa'
  
  // 1. Prueba con clave válida (Ilimitada)
  console.log('\n1. Probando clave válida (ilimitada)...')
  let nextCalled = false
  const ctx1 = await mockContext(validKey)
  await authMiddleware(ctx1, () => { nextCalled = true })
  if (nextCalled) console.log('✅ Clave válida aceptada.')
  else console.error('❌ Clave válida rechazada:', ctx1.data)

  // 2. Prueba con clave inválida
  console.log('\n2. Probando clave inválida...')
  nextCalled = false
  const ctx2 = await mockContext(invalidKey)
  const res2 = await authMiddleware(ctx2, () => { nextCalled = true })
  if (!nextCalled && res2?.status === 401) console.log('✅ Clave inválida rechazada correctamente.')
  else console.error('❌ Clave inválida no fue rechazada correctamente.')

  // 3. Prueba con clave expirada (Insertando una temporalmente)
  console.log('\n3. Probando clave expirada...')
  const expiredKey = 'expired-test-key'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  await db.execute({
    sql: 'INSERT INTO api_keys (name, key, expires_at) VALUES (?, ?, ?)',
    args: ['Expired Test', expiredKey, yesterday.toISOString()]
  })

  nextCalled = false
  const ctx3 = await mockContext(expiredKey)
  const res3 = await authMiddleware(ctx3, () => { nextCalled = true })
  
  if (!nextCalled && res3?.status === 401 && res3.data.error.includes('expirado')) {
    console.log('✅ Clave expirada rechazada correctamente.')
  } else {
    console.error('❌ Clave expirada no fue rechazada correctamente.')
  }

  // Limpieza
  await db.execute({
    sql: 'DELETE FROM api_keys WHERE key = ?',
    args: [expiredKey]
  })
  
  console.log('\n✨ Pruebas finalizadas.')
}

test().catch(console.error)
