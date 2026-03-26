// Shim de variables de entorno compatible con Edge Runtime y ESLint.
// En Edge Runtime, process.env es un global. No se puede importar node:process.
/* eslint-disable node/prefer-global/process */
import 'dotenv/config'

export const env = globalThis.process?.env || globalThis.Bun?.env || {}
