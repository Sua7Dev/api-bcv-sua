/* eslint-disable import/no-duplicates */
/* eslint-disable perfectionist/sort-imports */
/* eslint-disable import/first */
import fs from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { leerRutaRegion } from '@/utils/rutas.js'
import cron from '@/ve/cron.ve.js'

// bun run tests/ve/logic.test.js
// Mocks
vi.mock('@/ve/bcv.extractor.js', () => ({
  default: vi.fn(),
  extraerEurBcv: vi.fn(),
}))
vi.mock('@/ve/yadio.extractor.js', () => ({
  default: vi.fn(),
  extraerEurYadio: vi.fn(),
}))

import extraerDolarBcv from '@/ve/bcv.extractor.js'
import extraerDolarYadio from '@/ve/yadio.extractor.js'
import { extraerEurBcv } from '@/ve/bcv.extractor.js'
import { extraerEurYadio } from '@/ve/yadio.extractor.js'

describe('refactored API logic', () => {
  const dbPath = './datos/ve/ve.sqlite'

  beforeEach(() => {
    vi.useFakeTimers()
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath)
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath)
    }
  })

  it('debe transformar promedio a valor y mantener histórico', async () => {
    // Viernes 2026-03-13
    const dateViernes = new Date('2026-03-13T10:00:00Z')
    vi.setSystemTime(dateViernes)

    extraerDolarBcv.mockResolvedValue({
      fuente: 'oficial',
      nombre: 'Oficial',
      valor: 40.0,
      fechaActualizacion: dateViernes.toISOString(),
    })
    extraerDolarYadio.mockResolvedValue([])
    extraerEurBcv.mockResolvedValue(null)
    extraerEurYadio.mockResolvedValue(null)

    await cron()

    // Segunda ejecución con nuevo valor
    const dateViernesTarde = new Date('2026-03-13T16:00:00Z')
    vi.setSystemTime(dateViernesTarde)
    extraerDolarBcv.mockResolvedValue({
      fuente: 'oficial',
      nombre: 'Oficial',
      valor: 41.0,
      fechaActualizacion: dateViernesTarde.toISOString(),
    })

    await cron()

    const data = await leerRutaRegion('ve', '/dolares/oficial')
    expect(data.valor).toBe(41.0)
    expect(data.valorAnterior).toBe(40.0)
    expect(data.fechaAnterior).toBe(dateViernes.toISOString())
  })

  it('debe aplicar la lógica de fin de semana (usar viernes el domingo)', async () => {
    // 1. Guardar valor del viernes
    const dateViernes = new Date('2026-03-13T10:00:00Z')
    vi.setSystemTime(dateViernes)
    extraerDolarBcv.mockResolvedValue({
      fuente: 'oficial',
      nombre: 'Oficial',
      valor: 40.0,
      fechaActualizacion: dateViernes.toISOString(),
    })
    await cron()

    // 2. Simular domingo con tasa de lunes ya publicada
    const dateDomingo = new Date('2026-03-15T10:00:00Z')
    const dateLunes = new Date('2026-03-16T10:00:00Z')
    vi.setSystemTime(dateDomingo)

    // El extractor obtiene la del lunes (simulado)
    extraerDolarBcv.mockResolvedValue({
      fuente: 'oficial',
      nombre: 'Oficial',
      valor: 45.0,
      fechaActualizacion: dateLunes.toISOString(),
    })

    await cron()

    const data = await leerRutaRegion('ve', '/dolares/oficial')
    // Debe seguir usando la del viernes (40.0) porque hoy es domingo
    expect(data.valor).toBe(40.0)
    expect(data.fechaActualizacion).toBe(dateViernes.toISOString())
  })
})
