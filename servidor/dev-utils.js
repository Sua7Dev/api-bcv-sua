import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/**
 * Lee datos locales del sistema de archivos.
 * Solo debe usarse en entorno de desarrollo.
 */
export async function leerDatosLocales(region, normalizedPath) {
  try {
    const rutaLocal = path.join(process.cwd(), 'datos', region, 'v1', normalizedPath, 'index.json')
    if (fs.existsSync(rutaLocal)) {
      return JSON.parse(fs.readFileSync(rutaLocal, 'utf-8'))
    }
  }
  catch (e) {
    console.error(`Error leyendo archivo local: ${e.message}`)
  }
  return null
}
