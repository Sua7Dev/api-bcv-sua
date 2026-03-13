import process from 'node:process'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Para probar localmente:
 * 1. Abre una terminal y ejecuta: bun dev
 * 2. En otra terminal ejecuta: bun run tests/test.local.js
 */

const API_URL = 'http://localhost:5173'
const API_KEY = process.env.VITE_API_KEY

async function testAPI() {
  console.warn(`🚀 Probando API LOCAL en: ${API_URL}/v1/usd`)

  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 10000) // 10s es suficiente para local

    const respuesta = await fetch(`${API_URL}/v1/usd`, {
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
      console.error('❌ Error: La API tardó demasiado en responder (Timeout). ¿Está ejecutándose "bun dev"?')
    }
    else {
      console.error('❌ Error en la prueba:', error.message)
    }
  }
}

testAPI()
