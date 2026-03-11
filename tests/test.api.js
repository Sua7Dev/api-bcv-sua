import process from 'node:process'
import dotenv from 'dotenv'

dotenv.config()

const API_URL = process.env.VITE_API_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173')

const API_KEY = process.env.VITE_API_KEY

async function testAPI() {
  console.warn(`🚀 Probando API en: ${API_URL}/v1/usd`)

  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const respuesta = await fetch(`${API_URL}/v1/usd`, {
      headers: {
        'x-api-key': API_KEY,
      },
      signal: controller.signal,
    })
    clearTimeout(id)

    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`)
    }

    const datos = await respuesta.json()
    console.warn('✅ Datos recibidos correctamente:')
    console.warn(JSON.stringify(datos, null, 2))
  }
  catch (error) {
    console.error('❌ Error en la prueba:', error.message)
  }
}
// bun run tests/test.api.js

testAPI()
