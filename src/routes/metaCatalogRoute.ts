import { Router } from 'express';
import authenticate from '../middleware/auth';
import {
  getCatalogs,
  getCatalog,
  createCatalog,
  updateCatalog,
  deleteCatalog,
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  batchProductOperations,
  assignUserToCatalog,
  removeUserFromCatalog,
  getCatalogUsers,
} from '../controllers/metaCatalogController';

const router = Router();

// Catalog Management Endpoints
// All endpoints require authentication

/**
 * Catalog CRUD Operations
 */
// GET /api/v1/whatsapp/catalogs - Get all catalogs for the business
router.get('/catalogs', authenticate, getCatalogs);

// GET /api/v1/whatsapp/catalogs/:catalogId - Get a specific catalog
router.get('/catalogs/:catalogId', authenticate, getCatalog);

// POST /api/v1/whatsapp/catalogs - Create a new catalog
router.post('/catalogs', authenticate, createCatalog);

// PUT /api/v1/whatsapp/catalogs/:catalogId - Update a catalog
router.put('/catalogs/:catalogId', authenticate, updateCatalog);

// DELETE /api/v1/whatsapp/catalogs/:catalogId - Delete a catalog
router.delete('/catalogs/:catalogId', authenticate, deleteCatalog);

/**
 * Product Management Endpoints
 */
// GET /api/v1/whatsapp/catalogs/:catalogId/products - Get all products in a catalog
router.get('/catalogs/:catalogId/products', authenticate, getProducts);

// GET /api/v1/whatsapp/catalogs/:catalogId/products/:retailerId - Get a specific product
router.get('/catalogs/:catalogId/products/:retailerId', authenticate, getProduct);

// POST /api/v1/whatsapp/catalogs/:catalogId/products - Create a product
router.post('/catalogs/:catalogId/products', authenticate, createProduct);

// PUT /api/v1/whatsapp/catalogs/:catalogId/products/:retailerId - Update a product
router.put('/catalogs/:catalogId/products/:retailerId', authenticate, updateProduct);

// DELETE /api/v1/whatsapp/catalogs/:catalogId/products/:retailerId - Delete a product
router.delete('/catalogs/:catalogId/products/:retailerId', authenticate, deleteProduct);

// POST /api/v1/whatsapp/catalogs/:catalogId/products/batch - Batch operations on products
router.post('/catalogs/:catalogId/products/batch', authenticate, batchProductOperations);

/**
 * Catalog User Permission Endpoints
 */
// GET /api/v1/whatsapp/catalogs/:catalogId/users - Get all users assigned to catalog
router.get('/catalogs/:catalogId/users', authenticate, getCatalogUsers);

// POST /api/v1/whatsapp/catalogs/:catalogId/users - Assign user to catalog
router.post('/catalogs/:catalogId/users', authenticate, assignUserToCatalog);

// DELETE /api/v1/whatsapp/catalogs/:catalogId/users/:userId - Remove user from catalog
router.delete('/catalogs/:catalogId/users/:userId', authenticate, removeUserFromCatalog);

export default router;
