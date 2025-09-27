// middleware/businessValidation.ts
import { body, query, param } from 'express-validator';

/**
 * Validation rules for creating a business
 */
export const validateCreateBusiness = [
  body('subdominio')
    .notEmpty()
    .withMessage('Subdomain is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Subdomain must be between 3 and 20 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Subdomain can only contain lowercase letters, numbers, and hyphens'),

  body('subDomain')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('SubDomain must be between 3 and 20 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('SubDomain can only contain lowercase letters, numbers, and hyphens'),

  body('linkDominio')
    .notEmpty()
    .withMessage('Link domain is required')
    .matches(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage('Invalid domain format'),

  body('localNombreComercial')
    .notEmpty()
    .withMessage('Business name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Business name must be between 3 and 50 characters'),

  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 200 })
    .withMessage('Name must not exceed 200 characters'),

  body('localDescripcion')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Description must not exceed 255 characters'),

  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),

  body('localDireccion')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Address must not exceed 255 characters'),

  body('localDepartamento')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters'),

  body('localProvincia')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Province must not exceed 100 characters'),

  body('localDistrito')
    .optional()
    .isLength({ max: 100 })
    .withMessage('District must not exceed 100 characters'),

  body('localTelefono')
    .optional()
    .matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/)
    .withMessage('Invalid phone number format'),

  body('localWpp')
    .optional()
    .matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/)
    .withMessage('Invalid WhatsApp number format'),

  body('phoneCountryCode')
    .optional()
    .matches(/^\+[0-9]{1,4}$/)
    .withMessage('Invalid phone country code format'),

  body('wppCountryCode')
    .optional()
    .matches(/^\+[0-9]{1,4}$/)
    .withMessage('Invalid WhatsApp country code format'),

  body('localPorcentajeImpuesto')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),

  body('userId')
    .notEmpty()
    .withMessage('User ID is required'),

  body('address.street')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Street address must not exceed 200 characters'),

  body('address.city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City must not exceed 100 characters'),

  body('address.state')
    .optional()
    .isLength({ max: 100 })
    .withMessage('State must not exceed 100 characters'),

  body('address.zipCode')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Zip code must not exceed 20 characters'),

  body('address.country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Country must not exceed 100 characters'),

  body('address.coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('address.coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('owner.userId')
    .notEmpty()
    .withMessage('Owner user ID is required'),

  body('owner.name')
    .notEmpty()
    .withMessage('Owner name is required')
    .isLength({ max: 100 })
    .withMessage('Owner name must not exceed 100 characters'),

  body('owner.email')
    .notEmpty()
    .withMessage('Owner email is required')
    .isEmail()
    .withMessage('Invalid email format'),

  body('logo')
    .optional()
    .isURL()
    .withMessage('Logo must be a valid URL'),

  body('coverImage')
    .optional()
    .isURL()
    .withMessage('Cover image must be a valid URL'),

  body('settings.currency')
    .optional()
    .isIn(['PEN', 'USD', 'EUR'])
    .withMessage('Currency must be PEN, USD, or EUR'),

  body('settings.taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),

  body('settings.serviceCharge')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Service charge must be between 0 and 100'),

  body('settings.deliveryFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Delivery fee must be a positive number'),

  body('settings.minOrderValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order value must be a positive number'),

  body('settings.maxDeliveryDistance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum delivery distance must be a positive number')
];

/**
 * Validation rules for updating a business
 */
export const validateUpdateBusiness = [
  body('localNombreComercial')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Business name must be between 3 and 50 characters'),

  body('name')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Name must not exceed 200 characters'),

  body('localDescripcion')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Description must not exceed 255 characters'),

  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),

  body('localDireccion')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Address must not exceed 255 characters'),

  body('localTelefono')
    .optional()
    .matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/)
    .withMessage('Invalid phone number format'),

  body('localWpp')
    .optional()
    .matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/)
    .withMessage('Invalid WhatsApp number format'),

  body('phoneCountryCode')
    .optional()
    .matches(/^\+[0-9]{1,4}$/)
    .withMessage('Invalid phone country code format'),

  body('wppCountryCode')
    .optional()
    .matches(/^\+[0-9]{1,4}$/)
    .withMessage('Invalid WhatsApp country code format'),

  body('localPorcentajeImpuesto')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),

  body('logo')
    .optional()
    .isURL()
    .withMessage('Logo must be a valid URL'),

  body('coverImage')
    .optional()
    .isURL()
    .withMessage('Cover image must be a valid URL'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be active, inactive, or suspended')
];

/**
 * Validation rules for query parameters
 */
export const validateBusinessQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'localNombreComercial', 'name', 'status'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * Validation rules for business status toggle
 */
export const validateBusinessStatusToggle = [
  body('estaAbiertoParaDelivery')
    .optional()
    .isBoolean()
    .withMessage('estaAbiertoParaDelivery must be a boolean'),

  body('estaAbiertoParaRecojo')
    .optional()
    .isBoolean()
    .withMessage('estaAbiertoParaRecojo must be a boolean')
];

/**
 * Validation rules for business ID parameter
 */
export const validateBusinessId = [
  param('id')
    .notEmpty()
    .withMessage('Business ID is required')
    .isMongoId()
    .withMessage('Invalid business ID format')
];

/**
 * Validation rules for search query
 */
export const validateSearchQuery = [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters long')
];