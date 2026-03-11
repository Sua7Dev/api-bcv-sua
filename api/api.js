import fs from 'node:fs'
import path from 'node:path'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { timing } from 'hono/timing'
import { qstashMiddleware } from './intermediarios/qstash.middleware.js'
import { registroMiddleware } from './intermediarios/registro.middleware.js'

export const app = new Hono()

app.use('*', cors())
app.use('*', timing())

app.use('*', registroMiddleware)

app.get('/', c => c.text('API SUA-BCV is running 🚀'))

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
  } catch (error) {
    console.error(`Error sirviendo ${filePath}:`, error)
  }
  return null
}

app.get('/v1/:moneda', async (c) => {
  const moneda = c.req.param('moneda')
  const res = await servirJson(c, 've', moneda)
  if (res) {
    return res
  }

  return c.json({ error: 'No encontrado' }, 404)
})

app.get('/v1/:moneda/:subpath', async (c) => {
  const moneda = c.req.param('moneda')
  const subpath = c.req.param('subpath')
  const res = await servirJson(c, 've', `${moneda}/${subpath}`)
  if (res) {
    return res
  }

  return c.json({ error: 'No encontrado' }, 404)
})

app.use('/cron/*', qstashMiddleware())

app.post('/cron/', async (c) => {
  const token = process.env.VITE_GITHUB_TOKEN

  const response = await fetch(
    'https://api.github.com/repos/enzonotario/esjs-dolar-api/actions/workflows',
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
    `https://api.github.com/repos/enzonotario/esjs-dolar-api/actions/workflows/${cron.id}/dispatches`,
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
