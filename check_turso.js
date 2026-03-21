import { db } from './src/db.js'

async function checkTurso() {
  try {
    console.log('--- Tables in Turso ---')
    const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'")
    console.log(JSON.stringify(tables.rows, null, 2))

    const tableName = 'cotizaciones'
    const tableExists = tables.rows.some(r => r.name === tableName)

    if (tableExists) {
      console.log(`\n--- Schema for ${tableName} ---`)
      const schema = await db.execute(`PRAGMA table_info(${tableName})`)
      console.log(JSON.stringify(schema.rows, null, 2))

      console.log(`\n--- Last 5 records in ${tableName} ---`)
      const data = await db.execute(`SELECT * FROM ${tableName} ORDER BY fechaActualizacion DESC LIMIT 5`)
      console.log(JSON.stringify(data.rows, null, 2))
    } else {
      console.log(`\nTable ${tableName} does not exist in Turso.`)
    }
  } catch (error) {
    console.error('Error checking Turso:', error)
  }
}

checkTurso()
