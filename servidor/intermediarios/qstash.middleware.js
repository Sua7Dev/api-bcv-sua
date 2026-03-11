import process from 'node:process'
import { verify } from 'hono/jwt'

export function qstashMiddleware() {
  return async (c, next) => {
    const signature = c.req.header('Upstash-Signature')
    const secret = process.env.QSTASH_CURRENT_SIGNING_KEY || process.env.VITE_QSTASH_CURRENT_SIGNING_KEY

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
