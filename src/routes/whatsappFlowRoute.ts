import { Router } from 'express';
import {
  getProductFlowData,
  calculatePrice,
  generateFlowTemplate,
  submitFlowOrder,
  deployFlow,
  deleteFlow,
  deployFlowsForCategory,
  getFlowId
} from '../controllers/whatsappFlowController';

const router = Router();

/**
 * WhatsApp Flow Routes
 *
 * These endpoints support WhatsApp Flow integration for product customization
 * and ordering. Flows allow users to select sizes, modifiers, and submit orders
 * directly within WhatsApp.
 */

// Get product data for flow (presentations, modifiers, etc.)
router.get('/product/:productId/:subDomain/:localId?', getProductFlowData);
router.get('/product/:productId/:subDomain', getProductFlowData);

// Calculate price based on user selections
router.post('/calculate-price/:subDomain/:localId?', calculatePrice);
router.post('/calculate-price/:subDomain', calculatePrice);

// Generate flow template JSON for a product
router.get('/template/:productId/:subDomain/:localId?', generateFlowTemplate);
router.get('/template/:productId/:subDomain', generateFlowTemplate);

// Submit order from flow
router.post('/submit-order/:subDomain/:localId?', submitFlowOrder);
router.post('/submit-order/:subDomain', submitFlowOrder);

// Deploy flow to Meta API for a product
router.post('/deploy/:productId/:subDomain/:localId?', deployFlow);
router.post('/deploy/:productId/:subDomain', deployFlow);

// Delete flow from Meta API for a product
router.delete('/deploy/:productId/:subDomain', deleteFlow);

// Deploy flows for all products in a category
router.post('/deploy-category/:categoryId/:subDomain/:localId?', deployFlowsForCategory);
router.post('/deploy-category/:categoryId/:subDomain', deployFlowsForCategory);

// Get flow ID for a product
router.get('/flow-id/:productId/:subDomain', getFlowId);

export default router;
