import { Router } from 'express';
import {
  createApiKey,
  listApiKeys,
  getApiKey,
  updateApiKey,
  deleteApiKey,
  revokeApiKey,
  getAvailableScopes
} from '../controllers/apiKeyController';
import authenticate  from '../middleware/auth';

const router = Router();

// All routes require JWT authentication (user must be logged in to manage API keys)

/**
 * @route   GET /api/v1/api-keys/scopes
 * @desc    Get available API scopes
 * @access  Private (JWT)
 */
router.get('/scopes', authenticate, getAvailableScopes);

/**
 * @route   POST /api/v1/api-keys
 * @desc    Create a new API key
 * @access  Private (JWT)
 */
router.post('/', authenticate, createApiKey);

/**
 * @route   GET /api/v1/api-keys
 * @desc    List all API keys for authenticated user
 * @access  Private (JWT)
 * @query   businessId - Filter by business ID
 * @query   isActive - Filter by active status (true/false)
 */
router.get('/', authenticate, listApiKeys);

/**
 * @route   GET /api/v1/api-keys/:keyId
 * @desc    Get specific API key details
 * @access  Private (JWT)
 */
router.get('/:keyId', authenticate, getApiKey);

/**
 * @route   PATCH /api/v1/api-keys/:keyId
 * @desc    Update an API key
 * @access  Private (JWT)
 */
router.patch('/:keyId', authenticate, updateApiKey);

/**
 * @route   DELETE /api/v1/api-keys/:keyId
 * @desc    Delete an API key permanently
 * @access  Private (JWT)
 */
router.delete('/:keyId', authenticate, deleteApiKey);

/**
 * @route   POST /api/v1/api-keys/:keyId/revoke
 * @desc    Revoke an API key (soft delete - deactivate)
 * @access  Private (JWT)
 */
router.post('/:keyId/revoke', authenticate, revokeApiKey);

export default router;
