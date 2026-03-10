import pino from 'pino'

const transports = pino.transport({
  targets: [
    {
      target: 'pino-axiom',
      options: {
        orgId: process.env.VITE_AXIOM_ORG_ID,
        token: process.env.VITE_AXIOM_TOKEN,
        dataset: process.env.VITE_AXIOM_DATASET,
      },
    },
    {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
      },
    },
  ],
})

const logger = pino(transports)

const traceId = 
  Math.random().toString(36).substring(2, 15) + 
  Math.random().toString(36).substring(2, 15)

export function log(message, payload) {
  logger.info({ traceId, ...payload }, message)
}

export function grupo(context) {
  return logger.child({ traceId, ...context })
}

export function logError(grupo, error, context) {
  grupo.error({
    msg: 'Error',
    errorMessage: error.message,
    errorStack: error.stack,
    ...context,
  })
}
