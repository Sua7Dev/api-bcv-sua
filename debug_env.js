import { env } from './servidor/intermediarios/env.js'
console.log('VITE_DATABASE_URL:', env.VITE_DATABASE_URL)
console.log('process.env.VITE_DATABASE_URL:', process.env.VITE_DATABASE_URL)
