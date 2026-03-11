export const registroMiddleware = async (c, next) => {
  const start = performance.now()
  await next()
  const duration = performance.now() - start

  const log = {
    _time: new Date().toISOString(),
    req: {
      method: c.req.method,
      url: c.req.path,
      headers: c.req.header(),
    },
    res: {
      status: c.res.status,
    },
    duration: `${duration.toFixed(2)}ms`,
    msg: 'request completed',
  }

  const axiomToken = process.env.VITE_AXIOM_TOKEN
  const axiomOrgId = process.env.VITE_AXIOM_ORG_ID
  const axiomDataset = process.env.VITE_AXIOM_DATASET

  if (axiomToken && axiomDataset) {
    // Fire and forget to not block the response
    fetch(`https://api.axiom.co/v1/datasets/${axiomDataset}/ingest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${axiomToken}`,
        'Content-Type': 'application/json',
        ...(axiomOrgId && { 'X-Axiom-Org-Id': axiomOrgId }),
      },
      body: JSON.stringify([log]),
    }).catch(() => {})
  }
}
