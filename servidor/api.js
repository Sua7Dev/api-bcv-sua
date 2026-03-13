import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { Hono } from 'hono'
import { timing } from 'hono/timing'
import { limiteMiddleware } from './intermediarios/limite.middleware.js'
import { registroMiddleware } from './intermediarios/registro.middleware.js'
import { seguridadMiddleware } from './intermediarios/seguridad.middleware.js'

export const app = new Hono()

app.use('*', timing())
app.use('*', registroMiddleware)

// Rate Limiting (60 req/min via Upstash)
app.use('/v1/*', limiteMiddleware)

// API Key Protection
app.use('/v1/*', seguridadMiddleware)

app.get('/', c => c.text('API SUA-BCV is running 🚀'))
app.get('/ping', c => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Mapa de alias de monedas
const MONEDA_MAP = {
  usd: 'dolares',
  eur: 'euros',
}

const DATA_BASE = 'https://raw.githubusercontent.com/Sua7Dev/api-bcv-sua/main/datos'

// Helper para obtener datos de moneda
async function obtenerDatos(region, subPath) {
  const lowPath = subPath.toLowerCase()
  const normalizedPath = MONEDA_MAP[lowPath] || lowPath

  // Priorizar lectura del sistema de archivos local si existe
  try {
    const rutaLocal = path.join(process.cwd(), 'datos', region, 'v1', normalizedPath, 'index.json')
    if (fs.existsSync(rutaLocal)) {
      return JSON.parse(fs.readFileSync(rutaLocal, 'utf-8'))
    }
  }
  catch {
    // Si falla local, continuamos a remoto
  }

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

app.get('/v1/:moneda', async (c) => {
  const moneda = c.req.param('moneda')
  const datos = await obtenerDatos('ve', moneda)
  if (datos) {
    return c.json(datos)
  }
  return c.json({ error: 'Moneda no encontrada' }, 404)
})

app.get('/v1/:moneda/:subpath', async (c) => {
  const moneda = c.req.param('moneda')
  const subpath = c.req.param('subpath')
  const datos = await obtenerDatos('ve', `${moneda}/${subpath}`)
  if (datos) {
    return c.json(datos)
  }
  return c.json({ error: 'No encontrado' }, 404)
})

export default app
