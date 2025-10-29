import { Router } from 'express';
import { body, param } from 'express-validator';
import { 
  getWorkingHours, 
  createWorkingHours,
  updateWorkingHours,
} from '../controllers/workingHoursController';
import authenticate from '../middleware/auth';

const router = Router();

// Validation middleware for subDomain and localId
const validateSubDomainAndLocalId = [
  param('subDomain')
    .isString()
    .isLength({ min: 3, max: 63 })
    .matches(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/)
    .withMessage('subDomain must be 3-63 characters, lowercase letters, numbers, and hyphens only'),
  param('localId')
    .isString()
    .notEmpty()
    .withMessage('localId is required')
];

// Validation middleware for working hours update
const validateWorkingHoursUpdate = [
  body('deliveryHours')
    .optional()
    .isObject()
    .withMessage('deliveryHours must be an object'),
  body('pickupHours')
    .optional()
    .isObject()
    .withMessage('pickupHours must be an object'),
  body('onSiteHours')
    .optional()
    .isObject()
    .withMessage('onSiteHours must be an object'),
  body('scheduledOrderHours')
    .optional()
    .isObject()
    .withMessage('scheduledOrderHours must be an object'),
  
  // Validate time slots for each day
  body('deliveryHours.monday')
    .optional()
    .isArray()
    .withMessage('deliveryHours.monday must be an array or null'),
  body('deliveryHours.tuesday')
    .optional()
    .isArray()
    .withMessage('deliveryHours.tuesday must be an array or null'),
  body('deliveryHours.wednesday')
    .optional()
    .isArray()
    .withMessage('deliveryHours.wednesday must be an array or null'),
  body('deliveryHours.thursday')
    .optional()
    .isArray()
    .withMessage('deliveryHours.thursday must be an array or null'),
  body('deliveryHours.friday')
    .optional()
    .isArray()
    .withMessage('deliveryHours.friday must be an array or null'),
  body('deliveryHours.saturday')
    .optional()
    .isArray()
    .withMessage('deliveryHours.saturday must be an array or null'),
  body('deliveryHours.sunday')
    .optional()
    .isArray()
    .withMessage('deliveryHours.sunday must be an array or null'),
  
  // Validate time slot format
  body('deliveryHours.*.*.start')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time slot start must be in HH:MM format'),
  body('deliveryHours.*.*.end')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time slot end must be in HH:MM format')
];


// ============================================
// NEW FORMAT ROUTES (English parameters)
// ============================================

/**
 * Get working hours for a business location
 * GET /api/v1/business/working-hours/{subDomain}/{localId}
 */
router.get(
  '/:subDomain/:localId',
  validateSubDomainAndLocalId,
  getWorkingHours
);

/**
 * Create working hours for a business location
 * POST /api/v1/business/working-hours/{subDomain}/{localId}
 */
router.post(
  '/:subDomain/:localId',
  authenticate,
  validateSubDomainAndLocalId,
  validateWorkingHoursUpdate,
  createWorkingHours
);

/**
 * Update working hours for a business location
 * PATCH /api/v1/business/working-hours/{subDomain}/{localId}
 */
router.patch(
  '/:subDomain/:localId',
  authenticate,
  validateSubDomainAndLocalId,
  validateWorkingHoursUpdate,
  updateWorkingHours
);

// ============================================
// LEGACY FORMAT ROUTES (Spanish parameters)
// ============================================


export default router;
