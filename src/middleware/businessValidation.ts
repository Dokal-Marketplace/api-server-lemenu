  // middleware/businessValidation.ts
  import { body, query, param } from 'express-validator';

  /**
   * Validation rules for creating a business
   */
  export const validateCreateBusiness = [
    body('subDomain')
      .notEmpty()
      .withMessage('Subdomain is required')
      .isLength({ min: 3, max: 20 })
      .withMessage('Subdomain must be between 3 and 20 characters')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Subdomain can only contain lowercase letters, numbers, and hyphens'),

    body('domainLink')
      .notEmpty()
      .withMessage('Domain link is required')
      .isLength({ min: 3, max: 60 })
      .withMessage('Domain link must be between 3 and 60 characters')
      .matches(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      .withMessage('Invalid domain format'),

    body('name')
      .notEmpty()
      .withMessage('Business name is required')
      .isLength({ min: 3, max: 200 })
      .withMessage('Business name must be between 3 and 200 characters'),

    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),

    body('phone')
      .notEmpty()
      .withMessage('Phone is required')
      .matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/)
      .withMessage('Invalid phone number format'),

    body('whatsapp')
      .notEmpty()
      .withMessage('WhatsApp is required')
      .matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/)
      .withMessage('Invalid WhatsApp number format'),

    body('phoneCountryCode')
      .optional()
      .matches(/^\+[0-9]{1,4}$/)
      .withMessage('Invalid phone country code format'),

    body('whatsappCountryCode')
      .optional()
      .matches(/^\+[0-9]{1,4}$/)
      .withMessage('Invalid WhatsApp country code format'),

    body('taxPercentage')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Tax rate must be between 0 and 100'),

    body('address.street')
      .notEmpty()
      .withMessage('Street address is required')
      .isLength({ max: 200 })
      .withMessage('Street address must not exceed 200 characters'),

    body('address.city')
      .notEmpty()
      .withMessage('City is required')
      .isLength({ max: 100 })
      .withMessage('City must not exceed 100 characters'),

    body('address.state')
      .notEmpty()
      .withMessage('State is required')
      .isLength({ max: 100 })
      .withMessage('State must not exceed 100 characters'),

    body('address.zipCode')
      .optional()
      .isLength({ max: 20 })
      .withMessage('Zip code must not exceed 20 characters'),

    body('address.country')
      .notEmpty()
      .withMessage('Country is required')
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
      .isIn(['PEN', 'USD', 'EUR', 'XOF'])
      .withMessage('Currency must be PEN, USD, EUR, or XOF'),

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
      .withMessage('Maximum delivery distance must be a positive number'),

    body('settings.timezone')
      .optional()
      .isString()
      .withMessage('Timezone must be a string'),

    body('settings.autoAcceptOrders')
      .optional()
      .isBoolean()
      .withMessage('Auto accept orders must be a boolean'),

    body('settings.orderNotifications')
      .optional()
      .isBoolean()
      .withMessage('Order notifications must be a boolean'),

    body('settings.paymentMethods')
      .optional()
      .isArray()
      .withMessage('Payment methods must be an array'),

    body('settings.paymentMethods.*.type')
      .optional()
      .isIn(['cash', 'card', 'digital_wallet', 'bank_transfer'])
      .withMessage('Payment method type must be cash, card, digital_wallet, or bank_transfer'),

    body('settings.paymentMethods.*.name')
      .optional()
      .isString()
      .withMessage('Payment method name must be a string'),

    body('settings.paymentMethods.*.isActive')
      .optional()
      .isBoolean()
      .withMessage('Payment method isActive must be a boolean'),

    body('settings.features')
      .optional()
      .isObject()
      .withMessage('Features must be an object'),

    body('settings.features.delivery')
      .optional()
      .isBoolean()
      .withMessage('Delivery feature must be a boolean'),

    body('settings.features.pickup')
      .optional()
      .isBoolean()
      .withMessage('Pickup feature must be a boolean'),

    body('settings.features.onSite')
      .optional()
      .isBoolean()
      .withMessage('OnSite feature must be a boolean'),

    body('settings.features.scheduling')
      .optional()
      .isBoolean()
      .withMessage('Scheduling feature must be a boolean'),

    body('settings.features.coupons')
      .optional()
      .isBoolean()
      .withMessage('Coupons feature must be a boolean')
  ];

  /**
   * Validation rules for updating a business
   */
  export const validateUpdateBusiness = [
    body('commercialName')
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage('Business name must be between 3 and 50 characters'),

    body('name')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Name must not exceed 200 characters'),

    body('description')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Description must not exceed 255 characters'),

    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),

    body('address')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Address must not exceed 255 characters'),

    body('phone')
      .optional()
      .matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/)
      .withMessage('Invalid phone number format'),

    body('whatsapp')
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

    body('taxPercentage')
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
      .isIn(['createdAt', 'updatedAt', 'commercialName', 'name', 'status'])
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
    body('isOpenForDelivery')
      .optional()
      .isBoolean()
      .withMessage('isOpenForDelivery must be a boolean'),

    body('isOpenForPickup')
      .optional()
      .isBoolean()
      .withMessage('isOpenForPickup must be a boolean')
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