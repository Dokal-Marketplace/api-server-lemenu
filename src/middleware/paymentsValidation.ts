import { body, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'

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
    .isURL().withMessage('returnUrl must be a valid URL'),

  body('msisdn')
    .optional()
    .isString().withMessage('msisdn must be a string')
    .matches(/^\d{7,15}$/).withMessage('msisdn must be 7-15 digits'),

  // amount is string per pawaPay docs; if present, country is required
  body('amount')
    .optional()
    .isString().withMessage('amount must be a string')
    .matches(/^\d+(?:\.\d+)?$/).withMessage('amount must be a positive number string'),

  body('country')
    .if(body('amount').exists())
    .notEmpty().withMessage('country is required when amount is provided')
    .isString().withMessage('country must be a string')
    .isLength({ min: 3, max: 3 }).withMessage('country must be a 3-letter ISO code')
    .isUppercase().withMessage('country must be uppercase (e.g., GHA, KEN)'),
]

export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req)
  if (errors.isEmpty()) return next()
  return res.status(400).json({
    error: 'Validation errors',
    details: errors.array().map((e: any) => ({ field: e.path || e.param, message: e.msg })),
  })
}


