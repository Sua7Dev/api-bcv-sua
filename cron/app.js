import ve from './ve/cron.ve.js'
import { grupo } from './log.js'

const regiones = [
  { id: 've', fn: ve },
]

export async function iniciar(comando) {
  const log = grupo({ cron: 'app.js' })

  const regionFiltro = process.env.CRON_REGION || 've'
  const aEjecutar = regionFiltro
    ? regiones.filter((r) => r.id === regionFiltro)
    : regiones

  if (aEjecutar.length === 0) {
    log.info(`Región "${regionFiltro}" no encontrada`)
    return
  }

  log.info(`Iniciando cron${regionFiltro ? ` (${regionFiltro})` : ''}`)

  for (const { fn } of aEjecutar) {
    await fn()
  }

  log.info('Cron finalizado')
}
