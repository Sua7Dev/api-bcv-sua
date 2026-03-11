import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { timing } from 'hono/timing'
import { limiteMiddleware } from './intermediarios/limite.middleware.js'
import { qstashMiddleware } from './intermediarios/qstash.middleware.js'
import { registroMiddleware } from './intermediarios/registro.middleware.js'
import { seguridadMiddleware } from './intermediarios/seguridad.middleware.js'

export const app = new Hono()

// CORS dinámico
app.use('*', cors({
  origin: (origin) => {
    // Permitir localhost en desarrollo y el dominio de SUA
    if (!origin || origin.includes('localhost') || origin.includes('sua-bcv')) {
      return origin
    }
    return null
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
  maxAge: 600,
  credentials: true,
}))

app.use('*', timing())
app.use('*', registroMiddleware)

// Rate Limiting (60 req/min via Upstash)
app.use('/v1/*', limiteMiddleware)

// API Key Protection
app.use('/v1/*', seguridadMiddleware)

app.get('/', c => c.text('API SUA-BCV is running 🚀'))

// Embudo: Procesamiento secuencial de peticiones con tiempo de espera de seguridad
let cola = Promise.resolve()
async function embudo(fn) {
  const result = cola.then(async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000) // 8s safety timeout
    try {
      return await fn()
    }
    finally {
      clearTimeout(timeout)
    }
  })
  cola = result.catch(() => {})
  return result
}

// Helper para servir JSON local
async function servirJson(c, region, subPath) {
  const mapping = {
    usd: 'dolares',
    eur: 'euros',
  }

  const lowPath = subPath.toLowerCase()
  const normalizedPath = mapping[lowPath] || lowPath
  const filePath = path.join(process.cwd(), 'datos', region, 'v1', normalizedPath, 'index.json')

  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      return c.json(JSON.parse(content))
    }
  }
  catch (error) {
    console.error(`Error sirviendo ${filePath}:`, error)
  }
  return null
}

app.get('/v1/:moneda', async (c) => {
  return embudo(async () => {
    const moneda = c.req.param('moneda')
    const res = await servirJson(c, 've', moneda)
    if (res) {
      return res
    }
    return c.json({ error: 'No encontrado' }, 404)
  })
})

app.get('/v1/:moneda/:subpath', async (c) => {
  return embudo(async () => {
    const moneda = c.req.param('moneda')
    const subpath = c.req.param('subpath')
    const res = await servirJson(c, 've', `${moneda}/${subpath}`)
    if (res) {
      return res
    }
    return c.json({ error: 'No encontrado' }, 404)
  })
})

app.use('/cron/*', qstashMiddleware())

app.post('/cron/', async (c) => {
  const token = process.env.VITE_GITHUB_TOKEN

  const response = await fetch(
    'https://api.github.com/repos/Sua7Dev/api-bcv-sua/actions/workflows',
    {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Bun-Runtime',
      },
    },
  )

  const acciones = await response.json()
  const cron = acciones.workflows.find(w => w.name === 'CRON')

  if (!cron) {
    return c.json({ error: 'Cron workflow not found' }, 404)
  }

  await fetch(
    `https://api.github.com/repos/Sua7Dev/api-bcv-sua/actions/workflows/${cron.id}/dispatches`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'Bun-Runtime',
      },
      body: JSON.stringify({
        ref: 'main',
      }),
    },
  )

  return c.json({
    estado: 'Correcto',
  })
})

export default app
