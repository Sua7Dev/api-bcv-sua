import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { timing } from 'hono/timing'
import { registroMiddleware } from './intermediarios/registro.middleware.js'
import { qstashMiddleware } from './intermediarios/qstash.middleware.js'

export const app = new Hono()

app.use('*', cors())
app.use('*', timing())

app.use('*', registroMiddleware)

app.use('/cron/*', qstashMiddleware())

app.post('/cron/', async (c) => {
  const token = process.env.VITE_GITHUB_TOKEN

  const response = await fetch(
    'https://api.github.com/repos/enzonotario/esjs-dolar-api/actions/workflows',
    {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Bun-Runtime',
      },
    },
  )

  const acciones = await response.json()
  const cron = acciones.workflows.find((w) => w.name === 'CRON')

  if (!cron) {
    return c.json({ error: 'Cron workflow not found' }, 404)
  }

  await fetch(
    `https://api.github.com/repos/enzonotario/esjs-dolar-api/actions/workflows/${cron.id}/dispatches`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
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
