import tryToCatch from 'try-to-catch'
import { db } from '../../src/db.js'
import { grupo, logError } from '../log.js'
import { escribirRutaRegion } from '../utils/rutas.js'
import extraerDolarBcv, { extraerEurBcv } from './bcv.extractor.js'
import { guardarCotizacionesVe } from './db.ve.js'
import extraerDolarYadio, { extraerEurYadio } from './yadio.extractor.js'

async function getUltimosValores(moneda, fuente) {
  // Obtener fecha actual en Venezuela
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const veDateString = formatter.format(new Date()) // YYYY-MM-DD
  
  // Calcular día de la semana en Venezuela
  const [year, month, day] = veDateString.split('-').map(Number)
  const veDate = new Date(year, month - 1, day)
  const dayOfWeek = veDate.getDay()

  let targetDate = veDateString

  // Si es sábado (6) o domingo (0), retrocedemos al viernes
  if (dayOfWeek === 6 || dayOfWeek === 0) {
    const diff = dayOfWeek === 0 ? 2 : 1
    veDate.setDate(veDate.getDate() - diff)
    targetDate = veDate.toISOString().slice(0, 10)
  }

  const maxDate = `${targetDate}T23:59:59.999Z`

  // 1. Obtener el actual (último disponible hasta maxDate)
  const actualResult = await db.execute({
    sql: `
      SELECT valor, fechaActualizacion
      FROM cotizaciones
      WHERE moneda = ? AND fuente = ? AND fechaActualizacion <= ?
      ORDER BY fechaActualizacion DESC
      LIMIT 1
    `,
    args: [moneda, fuente, maxDate],
  })

  if (actualResult.rows.length === 0) return []

  const actual = actualResult.rows[0]

  // 2. Obtener el anterior (último de un día distinto al actual)
  const anteriorResult = await db.execute({
    sql: `
      SELECT valor, fechaActualizacion
      FROM cotizaciones
      WHERE moneda = ? AND fuente = ? AND date(fechaActualizacion) < date(?)
      ORDER BY fechaActualizacion DESC
      LIMIT 1
    `,
    args: [moneda, fuente, actual.fechaActualizacion],
  })

  return [actual, ...anteriorResult.rows]
}

export default async function () {
  const log = grupo({ cron: 'cron.ve.js' })

  log.info('Inicio')

  const [error] = await tryToCatch(guardarDolares, log)

  if (error) {
    logError(log, error)
  }

  log.info('Fin')
}

async function guardarDolares(log) {
  const [errorYadio, dolaresYadio] = await tryToCatch(extraerDolarYadio)
  if (errorYadio) {
    logError(log, errorYadio, { extractor: 'yadio.extractor.js' })
  }

  const [errorBcv, dolarBcv] = await tryToCatch(extraerDolarBcv)
  if (errorBcv) {
    logError(log, errorBcv, { extractor: 'bcv.extractor.js' })
  }

  const { oficial: euroBcv, paralelo: euroYadio } = await extraerEuros(log)

  const cotizacionesParaDb = []
  if (dolarBcv) {
    cotizacionesParaDb.push({ ...dolarBcv, moneda: 'USD' })
  }
  if (dolaresYadio) {
    cotizacionesParaDb.push(...dolaresYadio.map(d => ({ ...d, moneda: 'USD' })))
  }
  if (euroBcv) {
    cotizacionesParaDb.push({ ...euroBcv, moneda: 'EUR' })
  }
  if (euroYadio) {
    cotizacionesParaDb.push({ ...euroYadio, moneda: 'EUR', fuente: 'paralelo', nombre: 'Paralelo' })
  }

  if (cotizacionesParaDb.length > 0) {
    const [errorDb] = await tryToCatch(guardarCotizacionesVe, cotizacionesParaDb)
    if (errorDb) {
      logError(log, errorDb, { accion: 'guardarCotizacionesVe' })
    }
  }

  const monedas = [
    { moneda: 'USD', fuentes: ['oficial', 'paralelo'], path: 'dolares' },
    { moneda: 'EUR', fuentes: ['oficial', 'paralelo'], path: 'euros' },
  ]

  const totalCotizaciones = []

  for (const { moneda, fuentes, path } of monedas) {
    const listaMoneda = []
    for (const fuente of fuentes) {
      const ultimos = await getUltimosValores(moneda, fuente)
      if (ultimos.length > 0) {
        const item = {
          fuente,
          nombre: fuente === 'oficial' ? (moneda === 'USD' ? 'Oficial' : 'Euro') : 'Paralelo',
          valor: ultimos[0].valor,
          fechaActualizacion: ultimos[0].fechaActualizacion,
        }
        if (ultimos.length > 1) {
          item.valorAnterior = ultimos[1].valor
          item.fechaAnterior = ultimos[1].fechaActualizacion
        }
        if (moneda === 'EUR') {
          item.moneda = 'EUR'
        }

        listaMoneda.push(item)
        await escribirRutaRegion('ve', `/${path}/${fuente}`, item)

        if (fuente === 'oficial') {
          totalCotizaciones.push({
            ...item,
            nombre: moneda === 'USD' ? 'Dólar' : 'Euro',
            moneda,
          })
        }
      }
    }
    await escribirRutaRegion('ve', `/${path}`, listaMoneda)
  }

  await escribirRutaRegion('ve', '/cotizaciones', totalCotizaciones)

  const [errorHistoricos] = await tryToCatch(generarHistoricos, log)
  if (errorHistoricos) {
    logError(log, errorHistoricos, { accion: 'generarHistoricos' })
  }
}

async function generarHistoricos() {
  const rutas = [
    { moneda: 'USD', fuente: 'oficial', ruta: '/historicos/dolares/oficial' },
    { moneda: 'USD', fuente: 'paralelo', ruta: '/historicos/dolares/paralelo' },
    { moneda: 'EUR', fuente: 'oficial', ruta: '/historicos/euros/oficial' },
    { moneda: 'EUR', fuente: 'paralelo', ruta: '/historicos/euros/paralelo' },
  ]

  const dolaresHistoricos = []
  const eurosHistoricos = []

  for (const { moneda, fuente, ruta } of rutas) {
    const result = await db.execute({
      sql: `
        SELECT * FROM cotizaciones
        WHERE (moneda, fuente, fechaActualizacion) IN (
          SELECT moneda, fuente, max(fechaActualizacion)
          FROM cotizaciones
          WHERE moneda = ? AND fuente = ?
          GROUP BY moneda, fuente, substr(fechaActualizacion, 1, 10)
        )
        ORDER BY fechaActualizacion
      `,
      args: [moneda, fuente],
    })

    const historicalData = result.rows.map((f) => {
      const item = {
        fuente,
        valor: f.valor,
        fecha: f.fechaActualizacion.slice(0, 10),
      }
      if (moneda === 'EUR')
        item.moneda = 'EUR'
      return item
    })

    await escribirRutaRegion('ve', ruta, historicalData)

    if (moneda === 'USD') {
      dolaresHistoricos.push({ fuente, historico: historicalData })
    }
    else {
      eurosHistoricos.push({ fuente, historico: historicalData })
    }
  }

  function aplanarPorDia(historicos) {
    const porFecha = {}
    historicos.forEach(({ fuente, historico }) => {
      historico.forEach((item) => {
        const fecha = item.fecha
        if (!porFecha[fecha])
          porFecha[fecha] = {}
        porFecha[fecha][fuente] = item
      })
    })
    const fechas = Object.keys(porFecha).sort()
    const resultado = []
    fechas.forEach((fecha) => {
      ['oficial', 'paralelo'].forEach((fuente) => {
        const item = porFecha[fecha][fuente]
        if (item) {
          resultado.push({
            fuente,
            valor: item.valor,
            fecha,
          })
        }
      })
    })
    return resultado
  }

  await escribirRutaRegion('ve', '/historicos/dolares', aplanarPorDia(dolaresHistoricos))
  await escribirRutaRegion('ve', '/historicos/euros', aplanarPorDia(eurosHistoricos).map((e) => ({ ...e, moneda: 'EUR' })))
}

async function extraerEuros(log) {
  const [errorEurBcv, oficial] = await tryToCatch(extraerEurBcv)

  if (errorEurBcv) {
    logError(log, errorEurBcv, { extractor: 'bcv.extractor.js (EUR)' })
  }

  const [errorEurYadio, paralelo] = await tryToCatch(extraerEurYadio)

  if (errorEurYadio) {
    logError(log, errorEurYadio, { extractor: 'yadio.extractor.js (EUR)' })
  }

  return { oficial, paralelo }
}
