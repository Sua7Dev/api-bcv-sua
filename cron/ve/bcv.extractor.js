import https from 'node:https'
import axios from 'axios'
import * as cheerio from 'cheerio'
import tryToCatch from 'try-to-catch'
import { grupo, logError } from '../log.js'

const MESES_MAP = {
  enero: '01',
  febrero: '02',
  marzo: '03',
  abril: '04',
  mayo: '05',
  junio: '06',
  julio: '07',
  agosto: '08',
  septiembre: '09',
  octubre: '10',
  noviembre: '11',
  diciembre: '12',
}

function parsearFechaBcv(fechaStr) {
  if (!fechaStr) return new Date().toISOString()
  
  try {
    // Ejemplo: "Lunes, 30 Marzo 2026" o "Viernes, 27 Marzo 2026"
    const partes = fechaStr.toLowerCase().replace(',', '').split(/\s+/)
    
    // Debería ser: [diaSemana, dia, mes, año]
    if (partes.length < 4) return new Date().toISOString()
    
    const dia = partes[1].padStart(2, '0')
    const mes = MESES_MAP[partes[2]] || '01'
    const año = partes[3]
    
    return `${año}-${mes}-${dia}T00:00:00.000Z`
  } catch (e) {
    return new Date().toISOString()
  }
}

export default async function () {
  const log = grupo({
    cron: 'cron.ve.js',
    extractor: 'bcv.extractor.js',
  })

  const [error, html] = await tryToCatch(obtenerHtml)

  if (error) {
    logError(log, error)
    return null
  }

  return extraerCotizacion(html)
}

export async function extraerEurBcv() {
  const log = grupo({
    cron: 'cron.ve.js',
    extractor: 'bcv.extractor.js',
  })

  const [error, html] = await tryToCatch(obtenerHtml)

  if (error) {
    logError(log, error)
    return null
  }

  return extraerCotizacionEur(html)
}

async function obtenerHtml() {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  })

  const respuesta = await axios.get('https://www.bcv.org.ve/', {
    httpsAgent,
  })

  return respuesta.data
}

function extraerCotizacion(html) {
  const $ = cheerio.load(html)
  let valorUsd = null

  $('span').each((i, el) => {
    const texto = $(el).text().trim()
    if (texto === 'USD') {
      const contenedor = $(el).closest('.recuadrotsmc')
      const strong = contenedor.find('strong')
      if (strong.length > 0) {
        valorUsd = strong.text().trim()
      }
    }
  })

  if (!valorUsd) {
    $('*').each((i, el) => {
      const texto = $(el).text()
      if (texto.includes('USD') && !valorUsd) {
        const strong = $(el).closest('div').find('strong')
        if (strong.length > 0) {
          const posibleValor = strong.text().trim()
          if (/^\d/.test(posibleValor)) {
            valorUsd = posibleValor
          }
        }
      }
    })
  }

  if (!valorUsd) {
    return null
  }

  const valorNumerico = interpretarValorMonetario(valorUsd)
  if (!valorNumerico) {
    return null
  }

  const fechaTexto = $('.date-display-single').first().text().trim() || $('.field-name-field-fecha-del-indicador .field-item').first().text().trim() || $('.pull-right.dinpro strong').first().text().trim()
  const fechaActualizacion = parsearFechaBcv(fechaTexto)

  return {
    fuente: 'oficial',
    nombre: 'Oficial',
    valor: valorNumerico,
    fechaActualizacion,
  }
}

function extraerCotizacionEur(html) {
  const $ = cheerio.load(html)
  let valorEur = null

  $('span').each((i, el) => {
    const texto = $(el).text().trim()
    if (texto === 'EUR') {
      const contenedor = $(el).closest('.recuadrotsmc')
      const strong = contenedor.find('strong')
      if (strong.length > 0) {
        valorEur = strong.text().trim()
      }
    }
  })

  if (!valorEur) {
    $('*').each((i, el) => {
      const texto = $(el).text()
      if (texto.includes('EUR') && !valorEur) {
        const strong = $(el).closest('div').find('strong')
        if (strong.length > 0) {
          const posibleValor = strong.text().trim()
          if (/^\d/.test(posibleValor)) {
            valorEur = posibleValor
          }
        }
      }
    })
  }

  if (!valorEur) {
    return null
  }

  const valorNumerico = interpretarValorMonetario(valorEur)
  if (!valorNumerico) {
    return null
  }

  const fechaTexto = $('.date-display-single').first().text().trim() || $('.field-name-field-fecha-del-indicador .field-item').first().text().trim() || $('.pull-right.dinpro strong').first().text().trim()
  const fechaActualizacion = parsearFechaBcv(fechaTexto)

  return {
    fuente: 'oficial',
    nombre: 'Euro',
    moneda: 'EUR',
    valor: valorNumerico,
    fechaActualizacion,
  }
}

function interpretarValorMonetario(valor) {
  const limpio = valor.replace(/\s/g, '').replace(',', '.')
  return Number.parseFloat(limpio)
}
