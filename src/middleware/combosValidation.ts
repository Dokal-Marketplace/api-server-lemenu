// middleware/combosValidation.ts
import { body, query, param } from 'express-validator';

/**
 * Validation rules for creating a combo
 */
export const validateCreateCombo = [
  body('name')
    .notEmpty()
    .withMessage('Combo name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Combo name must be between 1 and 100 characters')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .trim(),

  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters')
    .trim(),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  body('items')
    .isArray({ min: 1 })
    .withMessage('Items array is required and must contain at least one item'),

  body('items.*.productId')
    .notEmpty()
    .withMessage('Product ID is required for each item')
    .isMongoId()
    .withMessage('Product ID must be a valid MongoDB ObjectId'),

  body('items.*.quantity')
    .notEmpty()
    .withMessage('Quantity is required for each item')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),

  body('items.*.name')
    .notEmpty()
    .withMessage('Item name is required for each item')
    .isLength({ min: 1, max: 100 })
    .withMessage('Item name must be between 1 and 100 characters')
    .trim(),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters')
    .trim()
];

/**
 * Validation rules for updating a combo
 */
export const validateUpdateCombo = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Combo name must be between 1 and 100 characters')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .trim(),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('category')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters')
    .trim(),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Items array must contain at least one item'),

  body('items.*.productId')
    .optional()
    .isMongoId()
    .withMessage('Product ID must be a valid MongoDB ObjectId'),

  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),

  body('items.*.name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Item name must be between 1 and 100 characters')
    .trim(),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters')
    .trim()
];

/**
 * Validation rules for combo query parameters
 */
export const validateComboQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('category')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters')
    .trim(),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a string'),

  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .trim(),

  query('sortBy')
    .optional()
    .isIn(['name', 'price', 'category', 'createdAt', 'updatedAt'])
    .withMessage('sortBy must be one of: name, price, category, createdAt, updatedAt'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be either asc or desc')
];

/**
 * Validation rules for combo ID parameter
 */
export const validateComboId = [
  param('id')
    .notEmpty()
    .withMessage('Combo ID is required')
    .isMongoId()
    .withMessage('Invalid combo ID format')
];

/**
 * Validation rules for subDomain and localId parameters
 */
export const validateBusinessContext = [
  param('subDomain')
    .notEmpty()
    .withMessage('Subdomain is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Subdomain must be between 3 and 20 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Subdomain can only contain lowercase letters, numbers, and hyphens'),

  param('localId')
    .notEmpty()
    .withMessage('Local ID is required')
    .isMongoId()
    .withMessage('Invalid local ID format')
];
