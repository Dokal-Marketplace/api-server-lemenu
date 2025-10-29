import { Router } from 'express';
import { body, param } from 'express-validator';
import { 
  getWorkingHours, 
  updateWorkingHours,
  getWorkingHoursLegacy,
  updateWorkingHoursLegacy
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
    .isArray()
    .withMessage('deliveryHours must be an array'),
  body('deliveryHours.*.id')
    .optional()
    .isString()
    .withMessage('deliveryHours[].id must be a string'),
  body('deliveryHours.*.status')
    .optional()
    .isIn(['0', '1'])
    .withMessage('deliveryHours[].status must be "0" or "1"'),
  body('deliveryHours.*.day')
    .optional()
    .isIn(['1', '2', '3', '4', '5', '6', '7'])
    .withMessage('deliveryHours[].day must be between "1" and "7"'),
  body('deliveryHours.*.localId')
    .optional()
    .isString()
    .withMessage('deliveryHours[].localId must be a string'),
  body('deliveryHours.*.type')
    .optional()
    .isIn(['1', '2', '3', '4'])
    .withMessage('deliveryHours[].type must be "1", "2", "3", or "4"'),
  body('deliveryHours.*.timeSlots')
    .optional()
    .isArray()
    .withMessage('deliveryHours[].timeSlots must be an array'),
  body('deliveryHours.*.timeSlots.*.id')
    .optional()
    .isString()
    .withMessage('deliveryHours[].timeSlots[].id must be a string'),
  body('deliveryHours.*.timeSlots.*.startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('deliveryHours[].timeSlots[].startTime must be in HH:MM format'),
  body('deliveryHours.*.timeSlots.*.endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('deliveryHours[].timeSlots[].endTime must be in HH:MM format'),
  body('deliveryHours.*.timeSlots.*.dayId')
    .optional()
    .isString()
    .withMessage('deliveryHours[].timeSlots[].dayId must be a string'),
  body('deliveryHours.*.timeSlots.*.anticipationHours')
    .optional()
    .isString()
    .withMessage('deliveryHours[].timeSlots[].anticipationHours must be a string'),

  // Similar validation for other working hours types
  body('pickupHours')
    .optional()
    .isArray()
    .withMessage('pickupHours must be an array'),
  body('scheduledOrderHours')
    .optional()
    .isArray()
    .withMessage('scheduledOrderHours must be an array'),
  body('dispatchHours')
    .optional()
    .isArray()
    .withMessage('dispatchHours must be an array')
];

// Validation middleware for legacy format
const validateLegacyWorkingHoursUpdate = [
  body('horarioParaDelivery')
    .optional()
    .isArray()
    .withMessage('horarioParaDelivery must be an array'),
  body('horarioParaRecojo')
    .optional()
    .isArray()
    .withMessage('horarioParaRecojo must be an array'),
  body('horarioParaProgramarPedidos')
    .optional()
    .isArray()
    .withMessage('horarioParaProgramarPedidos must be an array'),
  body('horarioParaRepartoPedidos')
    .optional()
    .isArray()
    .withMessage('horarioParaRepartoPedidos must be an array')
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

/**
 * Get working hours in legacy format for backward compatibility
 * GET /api/v1/business/working-hours/{subDomain}/{localId}/legacy
 */
router.get(
  '/:subDomain/:localId/legacy',
  validateSubDomainAndLocalId,
  getWorkingHoursLegacy
);

/**
 * Update working hours in legacy format for backward compatibility
 * PATCH /api/v1/business/working-hours/{subDomain}/{localId}/legacy
 */
router.patch(
  '/:subDomain/:localId/legacy',
  authenticate,
  validateSubDomainAndLocalId,
  validateLegacyWorkingHoursUpdate,
  updateWorkingHoursLegacy
);

export default router;
