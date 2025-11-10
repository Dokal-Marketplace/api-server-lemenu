import { body, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'

// Validation rules for creating a PawaPay Payment Page
export const validateCreatePawaPayPaymentPage = [
  body('businessId')
    .notEmpty().withMessage('businessId is required')
    .isMongoId().withMessage('businessId must be a valid Mongo ID'),

  body('packCode')
    .notEmpty().withMessage('packCode is required')
    .isString().withMessage('packCode must be a string'),

  body('returnUrl')
    .notEmpty().withMessage('returnUrl is required')
    .custom((value) => {
      if (typeof value !== 'string') {
        throw new Error('returnUrl must be a string')
      }
      // Allow localhost and regular URLs
      try {
        const url = new URL(value)
        // Check if protocol is http or https
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('returnUrl must use http or https protocol')
        }
        return true
      } catch (error) {
        throw new Error('returnUrl must be a valid URL')
      }
    }),

  body('msisdn')
    .optional()
    .customSanitizer((v) => (v == null || v === '' ? undefined : String(v)))
    .if((value) => value !== undefined)
    .isString().withMessage('msisdn must be a string')
    .matches(/^\d{7,15}$/).withMessage('msisdn must be 7-15 digits'),

  // amount: accept number or string; coerce to string, validate numeric
  body('amount')
    .optional()
    .customSanitizer((v) => (v == null || v === '' ? undefined : String(v)))
    .if((value) => value !== undefined)
    .isString().withMessage('amount must be a string')
    .matches(/^\d+(?:\.\d+)?$/).withMessage('amount must be a non-negative number string'),

  body('country')
    .optional()
    .custom((value, { req }) => {
      const amount = req.body?.amount
      // Convert amount to string for comparison, handle both number and string inputs
      const amountStr = amount !== undefined && amount !== null ? String(amount) : ''
      // Only require country if amount exists, is not empty, and is not zero
      if (amountStr !== '' && amountStr !== '0' && Number(amountStr) > 0) {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          throw new Error('country is required when amount is provided and greater than 0')
        }
      }
      return true
    })
    .customSanitizer((v) => {
      if (v == null || v === '') return undefined
      return String(v).toUpperCase()
    })
    .if((value) => value !== undefined && value !== '')
    .isString().withMessage('country must be a string')
    .isLength({ min: 3, max: 3 }).withMessage('country must be a 3-letter ISO code')
    .matches(/^[A-Z]{3}$/).withMessage('country must be a 3-letter uppercase ISO code (e.g., GHA, KEN, ZMB)'),
]

export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req)
  if (errors.isEmpty()) return next()
  
  const errorDetails = errors.array().map((e: any) => ({ 
    field: e.path || e.param || e.location, 
    message: e.msg,
    value: e.value 
  }))
  
  // Log validation errors for debugging
  logger.error('Payment validation errors', {
    provider: 'pawapay',
    body: req.body,
    errors: errorDetails
  })
  
  return res.status(400).json({
    error: 'Validation errors',
    details: errorDetails,
  })
}


