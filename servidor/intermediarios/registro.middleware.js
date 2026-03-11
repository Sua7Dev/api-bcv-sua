import { env } from './env.js'

export async function registroMiddleware(c, next) {
  const start = performance.now()
  await next()
  const duration = performance.now() - start

  const axiomToken = env.VITE_AXIOM_TOKEN
  const axiomOrgId = env.VITE_AXIOM_ORG_ID
  const axiomDataset = env.VITE_AXIOM_DATASET

  if (axiomToken && axiomDataset) {
    const log = {
      _time: new Date().toISOString(),
      req: {
        method: c.req.method,
        url: c.req.path,
      },
      res: {
        status: c.res.status,
      },
      duration: `${duration.toFixed(2)}ms`,
      msg: 'request completed',
    }

    // Fire and forget to not block the response
    fetch(`https://api.axiom.co/v1/datasets/${axiomDataset}/ingest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${axiomToken}`,
        'Content-Type': 'application/json',
        ...(axiomOrgId && { 'X-Axiom-Org-Id': axiomOrgId }),
      },
      body: JSON.stringify([log]),
    }).catch(() => {})
  }
}
