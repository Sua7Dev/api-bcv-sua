import { execSync } from 'node:child_process'
import fs from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const raiz = join(__dirname, '..')

try {
  execSync(`mkdir -p ${join(raiz, 'dist/static/ar/v1')}`)
  execSync(`cp -r ${join(raiz, 'datos/v1/*')} ${join(raiz, 'dist/static/ar/v1')}`)
}
catch {
  // Ignore
}

const regiones = ['cl', 've', 'uy', 'mx', 'bo', 'br', 'co']

regiones.forEach((region) => {
  const source = join(raiz, `datos/${region}/v1/*`)
  const dest = join(raiz, `dist/static/${region}/v1`)

  try {
    if (fs.existsSync(source.replace('/*', ''))) {
      execSync(`mkdir -p ${dest}`)
      execSync(`cp -r ${source} ${dest}`)
    }
  }
  catch {
    // Ignore if no files to copy
  }
})
