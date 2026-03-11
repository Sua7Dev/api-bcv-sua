import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { env } from './env.js'

// Inicializar Redis con las variables de Upstash del .env
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
})

// Crear el ratelimiter: 60 peticiones por minuto
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
})

export async function limiteMiddleware(c, next) {
  // Verificamos si tenemos las credenciales de Redis
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return next()
  }

  const ip = c.req.header('x-forwarded-for') || '127.0.0.1'

  try {
    // Timeout de seguridad de 2s para Upstash
    const { success, limit, remaining, reset } = await Promise.race([
      ratelimit.limit(ip),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Upstash Timeout')), 2000)),
    ])

    c.header('X-RateLimit-Limit', limit.toString())
    c.header('X-RateLimit-Remaining', remaining.toString())
    c.header('X-RateLimit-Reset', reset.toString())

    if (!success) {
      return c.json({
        error: 'Límite de peticiones excedido (máximo 60 por minuto).',
      }, 429)
    }
  }
  catch {
    // Si falla Redis, permitimos que la petición pase por seguridad
  }

  await next()
}
