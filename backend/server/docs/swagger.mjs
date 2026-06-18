import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TREND Hair Boutique Studio — Backend API',
      version: '1.0.0',
      description: 'Proxy API for Google Reviews, Instagram feed, and image serving.',
    },
    servers: [{ url: 'http://localhost:3001', description: 'Local dev' }],
    tags: [
      { name: 'Reviews', description: 'Google Places reviews proxy' },
      { name: 'Instagram', description: 'Instagram feed proxy' },
      { name: 'Images', description: 'Static image serving with cache headers' },
    ],
  },
  apis: ['./server/routes/*.mjs'],
}

export const swaggerSpec = swaggerJsdoc(options)
