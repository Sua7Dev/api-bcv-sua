import { Database } from 'bun:sqlite'
const db = new Database('datos/ve/ve.sqlite')
const query = db.query("SELECT name FROM sqlite_master WHERE type='table'")
console.log(JSON.stringify(query.all(), null, 2))
db.close()
