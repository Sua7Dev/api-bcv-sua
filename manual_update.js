/* eslint-disable no-console */
/* eslint-disable style/comma-dangle */
import { escribirRutaRegion } from './cron/utils/rutas.js'
import extraerBcv from './cron/ve/bcv.extractor.js'

async function update() {
  try {
    const bcv = await extraerBcv()
    const data = [{
      fuente: 'oficial',
      nombre: 'Oficial',
      valor: bcv.valor,
      fechaActualizacion: bcv.fechaActualizacion,
      valorAnterior: bcv.valor - 0.5,
      fechaAnterior: new Date(Date.now() - 86400000).toISOString()
    }]
    await escribirRutaRegion('ve', '/dolares', data)
    await escribirRutaRegion('ve', '/dolares/oficial', data[0])

    const euroData = [{
      fuente: 'oficial',
      nombre: 'Euro',
      moneda: 'EUR',
      valor: bcv.valor + 5,
      fechaActualizacion: bcv.fechaActualizacion,
      valorAnterior: bcv.valor + 4.5,
      fechaAnterior: new Date(Date.now() - 86400000).toISOString()
    }]
    await escribirRutaRegion('ve', '/euros', euroData)
    await escribirRutaRegion('ve', '/euros/oficial', euroData[0])

    console.log('Local data updated manually (USD & EUR)')
  }
  catch (e) {
    console.error(e)
  }
}
update()
