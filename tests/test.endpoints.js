import process from 'node:process'
import dotenv from 'dotenv'

dotenv.config()

const API_URL = (process.env.VITE_API_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173')).replace(/\/$/, '')

const API_KEY = process.env.VITE_API_KEY

async function testEndpoint(path) {
  const url = `${API_URL}${path}`
  console.log(`\n🔍 Testing: ${url}`)
  
  try {
    const respuesta = await fetch(url, {
      headers: { 'x-api-key': API_KEY }
    })
    
    if (!respuesta.ok) {
        console.error(`❌ Error ${respuesta.status}: ${await respuesta.text()}`)
        return
    }
    
    const datos = await respuesta.json()
    console.log(`✅ Success. Items: ${Array.isArray(datos) ? datos.length : 1}`)
    
    if (Array.isArray(datos)) {
        const fuentes = [...new Set(datos.map(d => d.fuente))]
        console.log(`   Fuentes found: ${fuentes.join(', ')}`)
    } else {
        console.log(`   Fuente found: ${datos.fuente}`)
    }
  } catch (e) {
    console.error(`❌ Fetch failed: ${e.message}`)
  }
}

async function runAllTests() {
  const endpoints = [
    '/v1/usd',
    '/v1/usd-par',
    '/v1/usd-all',
    '/v1/eur',
    '/v1/eur-par',
    '/v1/eur-all',
    '/v1/cotizaciones',
    '/v1/cotizaciones-par',
    '/v1/cotizaciones-all'
  ]
  
  for (const ep of endpoints) {
    await testEndpoint(ep)
  }
}

runAllTests()
