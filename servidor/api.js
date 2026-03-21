import { Hono } from 'hono'
import { timing } from 'hono/timing'
import { authMiddleware } from '../src/auth.js'
import { db } from '../src/db.js'
import { limiteMiddleware } from './intermediarios/limite.middleware.js'
import { registroMiddleware } from './intermediarios/registro.middleware.js'

export const app = new Hono()

app.use('*', timing())
app.use('*', registroMiddleware)

// Rate Limiting (60 req/min via Upstash)
app.use('/v1/*', limiteMiddleware)

// API Key Protection (Turso)
app.use('/v1/*', authMiddleware)

app.get('/', c => c.text('API SUA-BCV is running 🚀'))
app.get('/ping', c => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Mapa de alias de monedas
const MONEDA_MAP = {
  usd: 'USD',
  eur: 'EUR',
}

// Helper para obtener datos de Turso con lógica de fin de semana
async function obtenerDatosDeTurso(monedaRaw) {
  const moneda = MONEDA_MAP[monedaRaw.toLowerCase()] || monedaRaw.toUpperCase()
  
  const today = new Date()
  const dayOfWeek = today.getDay()
  let maxDate = today.toISOString()

  // Si es sábado (6) o domingo (0), ignoramos tasas publicadas después del viernes
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const friday = new Date(today)
    friday.setDate(today.getDate() - (dayOfWeek === 0 ? 2 : 1))
    friday.setHours(23, 59, 59, 999)
    maxDate = friday.toISOString()
  }

  try {
    // Obtener todas las fuentes para esa moneda
    const result = await db.execute({
      sql: `
        SELECT * FROM cotizaciones
        WHERE moneda = ? AND fechaActualizacion <= ?
        ORDER BY fechaActualizacion DESC
      `,
      args: [moneda, maxDate],
    })

    if (result.rows.length === 0) return null

    // Agrupar por fuente y quedarse con la más reciente de cada una
    const fuentesMap = {}
    for (const row of result.rows) {
      if (!fuentesMap[row.fuente]) {
        fuentesMap[row.fuente] = row
      }
    }

    const fuentes = Object.values(fuentesMap)

    // Para cada fuente, obtener el valor anterior (para delta)
    const datosFinales = await Promise.all(fuentes.map(async (actual) => {
      const historial = await db.execute({
        sql: `
          SELECT valor, fechaActualizacion FROM cotizaciones
          WHERE moneda = ? AND fuente = ? AND fechaActualizacion < ?
          ORDER BY fechaActualizacion DESC
          LIMIT 1
        `,
        args: [moneda, actual.fuente, actual.fechaActualizacion],
      })

      const item = {
        fuente: actual.fuente,
        nombre: actual.nombre,
        valor: actual.valor,
        fechaActualizacion: actual.fechaActualizacion,
      }

      if (historial.rows.length > 0) {
        item.valorAnterior = historial.rows[0].valor
        item.fechaAnterior = historial.rows[0].fechaActualizacion
      }

      // Compatibilidad con esquema de la moneda
      if (moneda === 'EUR') {
        item.moneda = 'EUR'
      }

      return item
    }))

    return datosFinales
  } catch (error) {
    console.error(`Error al obtener datos de ${moneda} desde Turso:`, error)
    return null
  }
}

// Helper para transformar datos según requerimientos
function transformarDatos(datos, slug) {
  if (!Array.isArray(datos)) return datos

  return datos.map((item) => {
    const nuevoItem = { ...item }

    // Renombrar "Oficial" o "Dólar" a "Dolar" si es la moneda USD
    if (slug === 'usd' && (nuevoItem.nombre === 'Oficial' || nuevoItem.nombre === 'Dólar' || nuevoItem.nombre === 'Dolar')) {
      nuevoItem.nombre = 'Dolar'
    }

    // Asegurar campo moneda
    if (slug === 'usd' && !nuevoItem.moneda) {
      nuevoItem.moneda = 'USD'
    }
    if (slug === 'eur' && !nuevoItem.moneda) {
      nuevoItem.moneda = 'EUR'
    }

    return nuevoItem
  })
}

app.get('/v1/cotizaciones', async (c) => {
  const [usd, eur] = await Promise.all([
    obtenerDatosDeTurso('usd'),
    obtenerDatosDeTurso('eur'),
  ])

  const cotizaciones = [
    ...(Array.isArray(usd) ? transformarDatos(usd, 'usd') : []),
    ...(Array.isArray(eur) ? transformarDatos(eur, 'eur') : []),
  ]

  return c.json(cotizaciones)
})

app.get('/v1/:moneda', async (c) => {
  const moneda = c.req.param('moneda')

  // Bloquear endpoint de estado
  if (moneda === 'estado') {
    return c.json({ error: 'Endpoint eliminado. Use /ping para diagnóstico.' }, 410)
  }

  const datos = await obtenerDatosDeTurso(moneda)
  if (datos) {
    const slug = moneda.toLowerCase()
    if (slug === 'usd' || slug === 'eur') {
      return c.json(transformarDatos(datos, slug))
    }
    return c.json(datos)
  }
  return c.json({ error: 'Moneda no encontrada' }, 404)
})

app.get('/v1/:moneda/:subpath', async (c) => {
  const moneda = c.req.param('moneda')
  const subpath = c.req.param('subpath')

  // Bloquear históricos (por ahora, ya que no hemos migrado el endpoint completo)
  if (moneda === 'historicos') {
    return c.json({ error: 'Endpoint de históricos desactivado temporalmente por migración.' }, 410)
  }

  // Si el subpath es una fuente (ej: /v1/usd/oficial)
  const datosAll = await obtenerDatosDeTurso(moneda)
  if (datosAll) {
    const filtrado = datosAll.find(d => d.fuente.toLowerCase() === subpath.toLowerCase())
    if (filtrado) {
      return c.json(filtrado)
    }
  }

  return c.json({ error: 'No encontrado' }, 404)
})

export default app
