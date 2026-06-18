// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500
  console.error(`[error] ${req.method} ${req.url} →`, err.message)
  res.status(status).json({ error: err.message ?? 'Internal server error' })
}
