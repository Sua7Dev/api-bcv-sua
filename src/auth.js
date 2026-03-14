import { db } from './db.js'

/**
 * Genera una respuesta de error estandarizada según el requerimiento del proyecto.
 */
function errorResponse(c, code, message, status = 401) {
  return c.json({
    status: 'error',
    error: {
      code,
      mensaje: message,
      doc_url: `https://api-sua-bcv.vercel.app/docs/auth#${code}`,
    },
  }, status)
}

export async function authMiddleware(c, next) {
  const apiKey = c.req.header('x-api-key')

  // 1. Falta API Key
  if (!apiKey) {
    return errorResponse(
      c,
      'api_key_missing',
      'No se proporcionó x-api-key en los headers de la petición.',
      401,
    )
  }

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM api_keys WHERE key = ? LIMIT 1',
      args: [apiKey],
    })

    // 2. API Key Inválida
    if (result.rows.length === 0) {
      return errorResponse(
        c,
        'api_key_invalid',
        'La API Key proporcionada no es válida o no existe.',
        401,
      )
    }

    const keyData = result.rows[0]

    // 4. API Key Revocada
    if (keyData.revoked) {
      return errorResponse(
        c,
        'api_key_revoked',
        'Esta API Key ha sido desactivada por el administrador.',
        403,
      )
    }

    // 3. API Key Expirada
    if (keyData.expires_at) {
      const expirationDate = new Date(keyData.expires_at)
      const now = new Date()

      if (expirationDate < now) {
        return errorResponse(
          c,
          'api_key_expired',
          `Esta API Key ha expirado el ${keyData.expires_at}. Por favor, renueva tu suscripción.`,
          403,
        )
      }
    }

    // Clave válida
    await next()
  }
  catch (error) {
    console.error('Error en authMiddleware:', error)
    return c.json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        mensaje: 'Error interno de autenticación.',
        doc_url: 'https://api-sua-bcv.vercel.app/docs/auth#internal_server_error',
      },
    }, 500)
  }
}
