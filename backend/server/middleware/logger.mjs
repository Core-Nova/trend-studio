import morgan from 'morgan'

// Concise log line: METHOD /path STATUS duration
const format = ':method :url :status :res[content-length]b - :response-time ms'

export const requestLogger = morgan(format, {
  // Skip health-check polling from cluttering logs
  skip: (req) => req.url === '/health',
})
