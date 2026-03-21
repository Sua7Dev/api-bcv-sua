import { db } from '../../src/db.js'

export async function guardarCotizacionesVe(cotizaciones) {
  if (!cotizaciones || cotizaciones.length === 0) return true

  const mappedCotizaciones = cotizaciones.map(c => ({
    moneda: c.moneda || 'USD',
    fuente: c.fuente,
    nombre: c.nombre,
    valor: c.valor,
    fechaActualizacion: c.fechaActualizacion,
  }))

  const statements = mappedCotizaciones.map(item => ({
    sql: 'INSERT OR IGNORE INTO cotizaciones (moneda, fuente, nombre, valor, fechaActualizacion) VALUES (?, ?, ?, ?, ?)',
    args: [item.moneda, item.fuente, item.nombre, item.valor, item.fechaActualizacion],
  }))

  try {
    await db.batch(statements, 'write')
    return true
  } catch (error) {
    console.error('Error al guardar cotizaciones en Turso:', error)
    throw error
  }
}
