import process from 'node:process'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Inicializar Redis con las variables de Upstash del .env
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Crear el ratelimiter: 60 peticiones por minuto (60, '1 m')
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
})

export async function limiteMiddleware(c, next) {
  // Verificamos si tenemos las credenciales de Redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return next()
  }

  const ip = c.req.header('x-forwarded-for') || '127.0.0.1'
  console.warn(`[DEBUG] Comprobando límite para IP: ${ip}`)

  try {
    // Timeout de seguridad de 2s para Upstash
    const { success, limit, remaining, reset } = await Promise.race([
      ratelimit.limit(ip),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Upstash Timeout')), 2000)),
    ])
    console.warn(`[DEBUG] Límite: ${remaining}/${limit}`)

    c.header('X-RateLimit-Limit', limit.toString())
    c.header('X-RateLimit-Remaining', remaining.toString())
    c.header('X-RateLimit-Reset', reset.toString())

    if (!success) {
      return c.json({
        error: 'Límite de peticiones excedido (máximo 60 por minuto).',
      }, 429)
    }
  }
  catch (error) {
    console.warn(`[DEBUG] Fallo en Rate Limit (usando fallback): ${error.message}`)
    // Si falla Redis, permitimos que la petición pase por seguridad
  }

  await next()
}
