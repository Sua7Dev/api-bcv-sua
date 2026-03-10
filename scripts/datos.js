import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const raiz = join(__dirname, '..')

try {
  execSync(`mkdir -p ${join(raiz, 'dist/static/ar/v1')}`)
  execSync(`cp -r ${join(raiz, 'datos/v1/*')} ${join(raiz, 'dist/static/ar/v1')}`)
} catch (e) {}

const regiones = ['cl', 've', 'uy', 'mx', 'bo', 'br', 'co']

regiones.forEach((region) => {
  const source = join(raiz, `datos/${region}/v1/*`)
  const dest = join(raiz, `dist/static/${region}/v1`)
  
  try {
    execSync(`mkdir -p ${dest}`)
    execSync(`cp -r ${source} ${dest}`)
  } catch (e) {
    // Ignore if no files to copy
  }
})
