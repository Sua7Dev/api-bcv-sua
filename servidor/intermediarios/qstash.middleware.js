import { verify } from 'hono/jwt'
import { env } from './env.js'

export function qstashMiddleware() {
  return async (c, next) => {
    const signature = c.req.header('Upstash-Signature')
    const secret = env.QSTASH_CURRENT_SIGNING_KEY || env.VITE_QSTASH_CURRENT_SIGNING_KEY

    if (!signature || !secret) {
      return new Response('No autorizado', { status: 401 })
    }

    try {
      // Nota: Qstash usa su propio mecanismo de firma, pero mantenemos la lógica original por ahora.
      await verify(signature, secret)
      return next()
    }
    catch {
      return new Response('No autorizado', {
        status: 401,
      })
    }
  }
}
