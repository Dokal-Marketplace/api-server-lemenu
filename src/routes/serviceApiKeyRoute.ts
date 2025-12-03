import { Router } from 'express';
import {
  createServiceApiKey,
  listServiceApiKeys,
  getServiceApiKey,
  updateServiceApiKey,
  deleteServiceApiKey,
  revokeServiceApiKey,
  getServiceScopes
} from '../controllers/serviceApiKeyController';
import authenticate from '../middleware/auth';

const router = Router();

// All routes require JWT authentication with admin role
// In production, add role-based authorization middleware

/**
 * @route   GET /api/v1/service-api-keys/scopes
 * @desc    Get available service scopes
 * @access  Private (Admin)
 */
router.get('/scopes', authenticate, getServiceScopes);

/**
 * @route   POST /api/v1/service-api-keys
 * @desc    Create a new service API key
 * @access  Private (Admin)
 */
router.post('/', authenticate, createServiceApiKey);

/**
 * @route   GET /api/v1/service-api-keys
 * @desc    List all service API keys
 * @access  Private (Admin)
 * @query   serviceName - Filter by service name
 * @query   serviceType - Filter by type (internal/external/partner)
 * @query   environment - Filter by environment
 * @query   isActive - Filter by active status
 */
router.get('/', authenticate, listServiceApiKeys);

/**
 * @route   GET /api/v1/service-api-keys/:keyId
 * @desc    Get specific service API key details
 * @access  Private (Admin)
 */
router.get('/:keyId', authenticate, getServiceApiKey);

/**
 * @route   PATCH /api/v1/service-api-keys/:keyId
 * @desc    Update a service API key
 * @access  Private (Admin)
 */
router.patch('/:keyId', authenticate, updateServiceApiKey);

/**
 * @route   DELETE /api/v1/service-api-keys/:keyId
 * @desc    Delete a service API key permanently
 * @access  Private (Admin)
 */
router.delete('/:keyId', authenticate, deleteServiceApiKey);

/**
 * @route   POST /api/v1/service-api-keys/:keyId/revoke
 * @desc    Revoke a service API key (soft delete)
 * @access  Private (Admin)
 */
router.post('/:keyId/revoke', authenticate, revokeServiceApiKey);

export default router;
