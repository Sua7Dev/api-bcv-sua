import { Hono } from 'hono'
import { timing } from 'hono/timing'
import { authMiddleware } from '../src/auth.js'
import { limiteMiddleware } from './intermediarios/limite.middleware.js'
import { registroMiddleware } from './intermediarios/registro.middleware.js'

export const app = new Hono()

app.use('*', timing())
app.use('*', registroMiddleware)

// Rate Limiting (60 req/min via Upstash)
app.use('/v1/*', limiteMiddleware)

// API Key Protection (Turso)
app.use('/v1/*', authMiddleware)

app.get('/', c => c.text('API SUA-BCV is running 🚀'))
app.get('/ping', c => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Mapa de alias de monedas
const MONEDA_MAP = {
  usd: 'dolares',
  eur: 'euros',
}

const GITHUB_URL = 'https://raw.githubusercontent.com/Sua7Dev/api-bcv-sua/main/datos'
const isDev = typeof import.meta.env !== 'undefined' && import.meta.env?.DEV
const DATA_BASE = isDev ? 'http://localhost:5173/datos' : GITHUB_URL

// Helper para obtener datos de moneda
async function obtenerDatos(region, subPath) {
  const lowPath = subPath.toLowerCase()
  const normalizedPath = MONEDA_MAP[lowPath] || lowPath

  const url = `${DATA_BASE}/${region}/v1/${normalizedPath}/index.json`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'API-SUA-BCV/1.0' },
      // Cache de 60 segundos en Edge
      cf: { cacheTtl: 60, cacheEverything: true },
    })
    if (!res.ok) {
      return null
    }
    return await res.json()
  }
  catch {
    return null
  }
}

// Helper para transformar datos según requerimientos
function transformarDatos(datos, slug) {
  if (!Array.isArray(datos)) return datos

  return datos.map((item) => {
    const nuevoItem = { ...item }

    // Renombrar "Oficial" a "Dolar" si es la moneda USD
    if (slug === 'usd' && (nuevoItem.nombre === 'Oficial' || nuevoItem.nombre === 'Dólar' || nuevoItem.nombre === 'Dolar')) {
      nuevoItem.nombre = 'Dolar'
    }

    // Asegurar campo moneda
    if (slug === 'usd' && !nuevoItem.moneda) {
      nuevoItem.moneda = 'USD'
    }
    if (slug === 'eur' && !nuevoItem.moneda) {
      nuevoItem.moneda = 'EUR'
    }

    return nuevoItem
  })
}

app.get('/v1/cotizaciones', async (c) => {
  const [usd, eur] = await Promise.all([
    obtenerDatos('ve', 'usd'),
    obtenerDatos('ve', 'eur'),
  ])

  const cotizaciones = [
    ...(Array.isArray(usd) ? transformarDatos(usd, 'usd') : []),
    ...(Array.isArray(eur) ? transformarDatos(eur, 'eur') : []),
  ]

  return c.json(cotizaciones)
})

app.get('/v1/:moneda', async (c) => {
  const moneda = c.req.param('moneda')

  // Bloquear endpoint de estado
  if (moneda === 'estado') {
    return c.json({ error: 'Endpoint eliminado. Use /ping para diagnóstico.' }, 410)
  }

  const datos = await obtenerDatos('ve', moneda)
  if (datos) {
    // Aplicar transformación si es usd o eur
    const slug = moneda.toLowerCase()
    if (slug === 'usd' || slug === 'eur') {
      return c.json(transformarDatos(datos, slug))
    }
    return c.json(datos)
  }
  return c.json({ error: 'Moneda no encontrada' }, 404)
})

app.get('/v1/:moneda/:subpath', async (c) => {
  const moneda = c.req.param('moneda')
  const subpath = c.req.param('subpath')

  // Bloquear históricos
  if (moneda === 'historicos') {
    return c.json({ error: 'Endpoint de históricos desactivado.' }, 410)
  }

  const datos = await obtenerDatos('ve', `${moneda}/${subpath}`)
  if (datos) {
    return c.json(datos)
  }
  return c.json({ error: 'No encontrado' }, 404)
})

export default app
