import swaggerJsdoc from 'swagger-jsdoc'
import path from 'node:path'
import { env } from './env'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🌿 NanuHealth API',
      version: '1.0.0',
      description: 'NanuHealth backend API — Auth, Products, Orders, Cart, Wishlist',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Local Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your access_token from login/register response',
        },
      },
      schemas: {
        AuthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            message: { type: 'string', example: 'Login successful' },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string', example: 'eyJhbGci...' },
                refreshToken: { type: 'string', example: 'eyJhbGci...' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'uuid-here' },
                    email: { type: 'string', example: 'noel@example.com' },
                    fullName: { type: 'string', example: 'Noel Deleon' },
                  },
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string', example: 'Invalid email or password' },
          },
        },
      },
    },
  },
  // Use absolute path + both .ts and .js to work in dev and prod
  apis: [path.resolve(process.cwd(), 'src/modules/**/*.routes.ts')],
}

export const swaggerSpec = swaggerJsdoc(options)