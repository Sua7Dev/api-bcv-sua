import extraerBcv from './cron/ve/bcv.extractor.js'
try {
  const data = await extraerBcv()
  console.log(JSON.stringify(data, null, 2))
} catch (e) {
  console.error(e)
}
