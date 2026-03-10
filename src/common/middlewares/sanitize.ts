import mongoSanitize from 'express-mongo-sanitize'
import { RequestHandler, Request } from 'express'
export const sanitizeInput: RequestHandler = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }: { req: Request; key: string }) => {
    console.warn(`Sanitized key "${key}" on ${req.method} ${req.path}`)
  },
})