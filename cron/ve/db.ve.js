import {
  asegurarDirectorio,
  abrirBD,
  asegurarTabla,
  prepararUpsert,
  ejecutarTransaccion,
  cerrarBD,
} from '../utils/sqlite.js'

export async function guardarCotizacionesVe(cotizaciones, rutaDb) {
  const directorio = './datos/ve'

  asegurarDirectorio(directorio)
  const db = abrirBD(rutaDb ? rutaDb : `${directorio}/ve.sqlite`)
  
  asegurarTabla(
    db,
    'CREATE TABLE IF NOT EXISTS cotizaciones (moneda TEXT, fuente TEXT, nombre TEXT, compra REAL, venta REAL, promedio REAL, fechaActualizacion TEXT, PRIMARY KEY (moneda, fuente, fechaActualizacion))',
  )
  
  const stmt = prepararUpsert(
    db,
    'INSERT OR IGNORE INTO cotizaciones (moneda, fuente, nombre, compra, venta, promedio, fechaActualizacion) VALUES (@moneda, @fuente, @nombre, @compra, @venta, @promedio, @fechaActualizacion)',
  )
  
  // better-sqlite3 uses named parameters with @
  const mappedCotizaciones = cotizaciones.map(c => ({
    moneda: c.moneda || 'USD',
    fuente: c.fuente,
    nombre: c.nombre,
    compra: c.compra,
    venta: c.venta,
    promedio: c.promedio,
    fechaActualizacion: c.fechaActualizacion
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
