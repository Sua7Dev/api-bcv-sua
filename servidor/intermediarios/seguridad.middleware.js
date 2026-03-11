import { env } from './env.js'

export async function seguridadMiddleware(c, next) {
  const apiKey = c.req.header('x-api-key')
  const validKey = env.VITE_API_KEY

  // Si no hay API_KEY configurada en el servidor, permitimos el paso (dev mode)
  if (!validKey) {
    return next()
  }

  if (apiKey !== validKey) {
    return c.json({ error: 'No autorizado. Se requiere x-api-key válida.' }, 401)
  }

  await next()
}
