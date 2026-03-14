import { db } from './db.js'

export async function authMiddleware(c, next) {
  const apiKey = c.req.header('x-api-key')

  if (!apiKey) {
    return c.json({ error: 'No autorizado. Se requiere x-api-key.' }, 401)
  }

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM api_keys WHERE key = ? LIMIT 1',
      args: [apiKey],
    })

    if (result.rows.length === 0) {
      return c.json({ error: 'Clave de API inválida.' }, 401)
    }

    const keyData = result.rows[0]

    // Validar fecha de expiración si existe
    if (keyData.expires_at) {
      const expirationDate = new Date(keyData.expires_at)
      const now = new Date()

      if (expirationDate < now) {
        return c.json({ error: 'La clave de API ha expirado.' }, 401)
      }
    }

    // Clave válida o ilimitada (expires_at es NULL)
    await next()
  }
  catch (error) {
    console.error('Error en authMiddleware:', error)
    return c.json({ error: 'Error interno de autenticación.' }, 500)
  }
}
