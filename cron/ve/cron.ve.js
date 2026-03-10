import extraerDolarYadio, { extraerEurYadio } from './yadio.extractor.js'
import extraerDolarBcv, { extraerEurBcv } from './bcv.extractor.js'
import { escribirRutaRegion } from '../utils/rutas.js'
import { guardarCotizacionesVe } from './db.ve.js'
import { abrirBD, cerrarBD } from '../utils/sqlite.js'
import { grupo, logError } from '../log.js'
import tryToCatch from 'try-to-catch'

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

  const dolares = []

  if (dolarBcv) {
    dolares.push(dolarBcv)
  }

  if (dolaresYadio && dolaresYadio.length > 0) {
    dolares.push(...dolaresYadio)
  }

  if (dolares.length === 0) {
    return
  }

  const orden = ['oficial', 'paralelo']

  dolares.sort((a, b) => {
    const indexA = orden.indexOf(a.fuente)
    const indexB = orden.indexOf(b.fuente)
    return indexA - indexB
  }).forEach((dolar) => {
    escribirRutaRegion('ve', `/dolares/${dolar.fuente}`, dolar)
  })

  escribirRutaRegion('ve', '/dolares', dolares)

  const cotizaciones = []

  if (dolarBcv) {
    cotizaciones.push({
      fuente: dolarBcv.fuente,
      nombre: 'Dólar',
      moneda: 'USD',
      compra: dolarBcv.compra,
      venta: dolarBcv.venta,
      promedio: dolarBcv.promedio,
      fechaActualizacion: dolarBcv.fechaActualizacion,
    })
  }

  if (euroBcv) {
    cotizaciones.push({
      fuente: euroBcv.fuente,
      nombre: euroBcv.nombre,
      moneda: euroBcv.moneda,
      compra: euroBcv.compra,
      venta: euroBcv.venta,
      promedio: euroBcv.promedio,
      fechaActualizacion: euroBcv.fechaActualizacion,
    })
  }

  escribirRutaRegion('ve', '/cotizaciones', cotizaciones)

  const [errorDb] = await tryToCatch(guardarCotizacionesVe, cotizaciones)
  if (errorDb) {
    logError(log, errorDb, { accion: 'guardarCotizacionesVe' })
  }

  const euros = []

  if (euroBcv) {
    euros.push(euroBcv)
  }

  if (euroYadio) {
    euros.push({
      ...euroYadio,
      fuente: 'paralelo',
      nombre: 'Paralelo',
    })
  }

  euros.forEach((euro) => {
    escribirRutaRegion('ve', `/euros/${euro.fuente}`, euro)
  })

  escribirRutaRegion('ve', '/euros', euros)

  const [errorHistoricos] = await tryToCatch(generarHistoricos, log)
  if (errorHistoricos) {
    logError(log, errorHistoricos, { accion: 'generarHistoricos' })
  }
}

async function generarHistoricos(log) {
  const db = abrirBD('./datos/ve/ve.sqlite')

  const rutas = [
    { moneda: 'USD', fuente: 'oficial', ruta: '/historicos/dolares/oficial' },
    { moneda: 'USD', fuente: 'paralelo', ruta: '/historicos/dolares/paralelo' },
    { moneda: 'EUR', fuente: 'oficial', ruta: '/historicos/euros/oficial' },
    { moneda: 'EUR', fuente: 'paralelo', ruta: '/historicos/euros/paralelo' },
  ]

  const dolaresHistoricos = []
  const eurosHistoricos = []

  for (const { moneda, fuente, ruta } of rutas) {
    const filas = db.prepare(
      `SELECT * FROM cotizaciones
       WHERE (moneda, fuente, fechaActualizacion) IN (
         SELECT moneda, fuente, max(fechaActualizacion)
         FROM cotizaciones
         WHERE moneda = ? AND fuente = ?
         GROUP BY moneda, fuente, date(fechaActualizacion)
       )
       ORDER BY fechaActualizacion`,
    ).all(moneda, fuente)

    const historico = filas.map((f) => {
      const item = {
        fuente,
        compra: f.compra,
        venta: f.venta,
        promedio: f.promedio,
        fecha: f.fechaActualizacion.slice(0, 10),
      }
      if (moneda === 'EUR')
        item.moneda = 'EUR'
      return item
    })

    await escribirRutaRegion('ve', ruta, historico)

    if (moneda === 'USD') {
      dolaresHistoricos.push({ fuente, historico })
    } else {
      eurosHistoricos.push({ fuente, historico })
    }
  }

  cerrarBD(db)

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
            compra: item.compra,
            venta: item.venta,
            promedio: item.promedio,
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
