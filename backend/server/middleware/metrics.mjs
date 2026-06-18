const counters = {
  requests: 0,
  errors: 0,
  byRoute: {},
}

const startedAt = Date.now()

export function metricsMiddleware(req, res, next) {
  counters.requests++
  const route = `${req.method} ${req.path}`
  counters.byRoute[route] = (counters.byRoute[route] ?? 0) + 1

  res.on('finish', () => {
    if (res.statusCode >= 500) counters.errors++
  })

  next()
}

export function getMetrics() {
  return {
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    totalRequests: counters.requests,
    serverErrors: counters.errors,
    byRoute: counters.byRoute,
  }
}
