import process from 'node:process'
import dotenv from 'dotenv'

dotenv.config()

const API_URL = (process.env.VITE_API_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://api-bcv-sua.vercel.app')).replace(/\/$/, '')

const API_KEY = process.env.VITE_API_KEY

async function testAPI() {
  console.warn(`🚀 Probando API en: ${API_URL}/v1/cotizaciones`)

  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 30000) // 30s timeout for cold starts

    const respuesta = await fetch(`${API_URL}/v1/cotizaciones`, {
      headers: {
        'x-api-key': API_KEY,
      },
      signal: controller.signal,
    })
    clearTimeout(id)

    console.warn(`📊 Status: ${respuesta.status} ${respuesta.statusText}`)

    if (!respuesta.ok) {
      const errorText = await respuesta.text()
      throw new Error(`Error HTTP ${respuesta.status}: ${errorText || 'Sin respuesta'}`)
    }

    const datos = await respuesta.json()
    console.warn('✅ Datos recibidos correctamente:')
    console.warn(JSON.stringify(datos, null, 2))
  }
  catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Error: La API tardó más de 30 segundos en responder (Timeout).')
    }
    else {
      console.error('❌ Error en la prueba:', error.message)
    }
  }
}
// bun run tests/test.api.js

testAPI()
