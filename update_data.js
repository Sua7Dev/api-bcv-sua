import { db } from './src/db.js'

async function updateRecords() {
  try {
    console.log('Corrigiendo registros de la tasa del lunes (adelantada el viernes)...')
    
    // El registro del viernes 27 con valor 471.7004 es en realidad para el lunes 30
    // Al borrarlo, la API retrocederá automáticamente al último valor válido anterior (el del viernes real)
    const res = await db.execute({
      sql: "DELETE FROM cotizaciones WHERE fuente = 'oficial' AND valor = 471.7004 AND fechaActualizacion LIKE '2026-03-27%'",
    })

    console.log(`Registros actualizados: ${res.rowsAffected}`)
    
    if (res.rowsAffected > 0) {
      console.log('✅ Los registros del lunes han sido movidos a su fecha correcta.')
      console.log('La API ahora mostrará la tasa del viernes para lo que queda de fin de semana.')
    } else {
      console.log('⚠️ No se encontraron registros para actualizar. Tal vez ya fueron corregidos.')
    }
  } catch (error) {
    console.error('Error al actualizar Turso:', error)
  }
}

updateRecords()
