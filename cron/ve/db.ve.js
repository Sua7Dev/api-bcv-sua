import {
  abrirBD,
  asegurarDirectorio,
  asegurarTabla,
  cerrarBD,
  prepararUpsert,
} from '../utils/sqlite.js'

export async function guardarCotizacionesVe(cotizaciones, rutaDb) {
  const directorio = './datos/ve'

  asegurarDirectorio(directorio)
  const db = abrirBD(rutaDb || `${directorio}/ve.sqlite`)

  // Limpieza de esquema anterior
  const colInfo = db.prepare('PRAGMA table_info(cotizaciones)').all()
  if (colInfo.length > 0 && colInfo.some(c => c.name === 'promedio')) {
    db.exec('DROP TABLE cotizaciones')
  }

  asegurarTabla(
    db,
    'CREATE TABLE IF NOT EXISTS cotizaciones (moneda TEXT, fuente TEXT, nombre TEXT, valor REAL, fechaActualizacion TEXT, PRIMARY KEY (moneda, fuente, fechaActualizacion))',
  )

  const stmt = prepararUpsert(
    db,
    'INSERT OR IGNORE INTO cotizaciones (moneda, fuente, nombre, valor, fechaActualizacion) VALUES (@moneda, @fuente, @nombre, @valor, @fechaActualizacion)',
  )

  const mappedCotizaciones = cotizaciones.map(c => ({
    moneda: c.moneda || 'USD',
    fuente: c.fuente,
    nombre: c.nombre,
    valor: c.valor,
    fechaActualizacion: c.fechaActualizacion,
  }))

  const tx = db.transaction((items) => {
    for (const item of items) {
      stmt.run(item)
    }
  })

  tx(mappedCotizaciones)
  
  cerrarBD(db)
  return true
}
