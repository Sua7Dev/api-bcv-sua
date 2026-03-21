import { db } from './src/db.js'

async function updateRecords() {
  try {
    console.log('Updating March 20th records in Turso...')
    
    // Eliminar los registros de prueba previos de esa fecha para evitar conflictos si la PK es distinta
    // O simplemente actualizarlos. Como la PK incluye fechaActualizacion exacta, mejor borrar y reinsertar con la fecha que puse.
    
    await db.execute({
      sql: 'DELETE FROM cotizaciones WHERE fechaActualizacion = ?',
      args: ['2026-03-20T10:00:00.000Z']
    })

    await db.execute({
      sql: 'INSERT INTO cotizaciones (moneda, fuente, nombre, valor, fechaActualizacion) VALUES (?, ?, ?, ?, ?)',
      args: ['USD', 'oficial', 'Dolar', 455.25, '2026-03-20T10:00:00.000Z']
    })
    console.log('Updated record for USD: 455.25')

    await db.execute({
      sql: 'INSERT INTO cotizaciones (moneda, fuente, nombre, valor, fechaActualizacion) VALUES (?, ?, ?, ?, ?)',
      args: ['EUR', 'oficial', 'Euro', 524.5, '2026-03-20T10:00:00.000Z']
    })
    console.log('Updated record for EUR: 524.5')
    
  } catch (error) {
    console.error('Error updating Turso:', error)
  }
}

updateRecords()
