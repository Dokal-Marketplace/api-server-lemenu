/**
 * CartaAI API Client with API Key Authentication
 *
 * This example demonstrates how to use API keys to interact with the CartaAI API
 */

const axios = require('axios');

class CartaAIClient {
  /**
   * Initialize the CartaAI client
   * @param {string} apiKey - Your API key (carta_live_...)
   * @param {string} baseUrl - Base URL for the API (default: localhost)
   */
  constructor(apiKey, baseUrl = 'http://localhost:3001/api/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.headers = {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Make an authenticated request to the API
   * @private
   */
  async request(endpoint, options = {}) {
    try {
      const response = await axios({
        url: `${this.baseUrl}${endpoint}`,
        headers: { ...this.headers, ...options.headers },
        ...options
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`API Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
      }
      throw error;
    }
  }

  // ============================================
  // PRODUCTS API
  // ============================================

  /**
   * Get all products for a business location
   * @param {string} subDomain - Business subdomain
   * @param {string} localId - Location ID
   */
  async getProducts(subDomain, localId) {
    return this.request(`/products/get-all/${subDomain}/${localId}`);
  }

  /**
   * Get a specific product by ID
   * @param {string} productId - Product ID
   */
  async getProduct(productId) {
    return this.request(`/products/${productId}`);
  }

  /**
   * Create a new product
   * @param {string} subDomain - Business subdomain
   * @param {string} localId - Location ID
   * @param {object} productData - Product data
   */
  async createProduct(subDomain, localId, productData) {
    return this.request(`/products/${subDomain}/${localId}`, {
      method: 'POST',
      data: productData
    });
  }

  /**
   * Update a product
   * @param {string} productId - Product ID
   * @param {object} updates - Fields to update
   */
  async updateProduct(productId, updates) {
    return this.request(`/products/${productId}`, {
      method: 'PATCH',
      data: updates
    });
  }

  /**
   * Delete a product
   * @param {string} productId - Product ID
   */
  async deleteProduct(productId) {
    return this.request(`/products/${productId}`, {
      method: 'DELETE'
    });
  }

  // ============================================
  // ORDERS API
  // ============================================

  /**
   * Get all orders for a business location
   * @param {string} subDomain - Business subdomain
   * @param {string} localId - Location ID
   */
  async getOrders(subDomain, localId) {
    return this.request(`/order/filled-orders/${subDomain}/${localId}`);
  }

  /**
   * Get a specific order by ID
   * @param {string} orderId - Order ID
   */
  async getOrder(orderId) {
    return this.request(`/order/get-order/${orderId}`);
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   */
  async updateOrderStatus(orderId, status) {
    return this.request(`/order/${orderId}/status`, {
      method: 'PATCH',
      data: { status }
    });
  }

  /**
   * Get archived orders
   * @param {string} subDomain - Business subdomain
   * @param {string} localId - Location ID
   */
  async getArchivedOrders(subDomain, localId) {
    return this.request(`/order/archived/${subDomain}/${localId}`);
  }

  // ============================================
  // MENU API
  // ============================================

  /**
   * Get menu structure for bot
   * @param {string} subDomain - Business subdomain
   * @param {string} localId - Location ID (optional)
   */
  async getBotMenuStructure(subDomain, localId = null) {
    const query = localId ? `?subDomain=${subDomain}&localId=${localId}` : `?subDomain=${subDomain}`;
    return this.request(`/menu2/bot-structure${query}`);
  }

  /**
   * Get menu images
   * @param {string} subDomain - Business subdomain
   * @param {string} localId - Location ID
   */
  async getMenuImages(subDomain, localId) {
    return this.request(`/menu-pic?subDomain=${subDomain}&localId=${localId}`);
  }

  // ============================================
  // ANALYTICS API
  // ============================================

  /**
   * Get product sync status
   * @param {string} subDomain - Business subdomain
   * @param {string} localId - Location ID
   */
  async getSyncStatus(subDomain, localId) {
    return this.request(`/products/sync-status/${subDomain}/${localId}`);
  }
}

// ============================================
// USAGE EXAMPLES
// ============================================

async function examples() {
  // Initialize client with your API key
  const apiKey = process.env.CARTA_API_KEY || 'carta_live_your_key_here';
  const client = new CartaAIClient(apiKey);

  const subDomain = 'my-restaurant';
  const localId = 'LOC1760097779968WGX4I';

  try {
    // Example 1: Get all products
    console.log('📦 Fetching products...');
    const productsResponse = await client.getProducts(subDomain, localId);
    console.log(`Found ${productsResponse.data.length} products`);
    console.log('First product:', productsResponse.data[0]);

    // Example 2: Get specific product
    if (productsResponse.data.length > 0) {
      const productId = productsResponse.data[0]._id;
      console.log('\n📝 Fetching product details...');
      const product = await client.getProduct(productId);
      console.log('Product:', product.data.name);
    }

    // Example 3: Get orders
    console.log('\n📋 Fetching orders...');
    const ordersResponse = await client.getOrders(subDomain, localId);
    console.log(`Found ${ordersResponse.data.length} orders`);

    // Example 4: Get menu structure
    console.log('\n🍽️ Fetching menu structure...');
    const menuResponse = await client.getBotMenuStructure(subDomain, localId);
    console.log('Menu structure retrieved');

    // Example 5: Get sync status
    console.log('\n🔄 Fetching sync status...');
    const syncStatus = await client.getSyncStatus(subDomain, localId);
    console.log('Sync status:', syncStatus.data);

    // Example 6: Create a new product (requires write:products scope)
    // const newProduct = await client.createProduct(subDomain, localId, {
    //   name: 'New Product',
    //   description: 'Created via API',
    //   price: 19.99,
    //   categoryId: 'category-id',
    //   isAvailable: true
    // });
    // console.log('Created product:', newProduct.data);

    // Example 7: Update product (requires write:products scope)
    // if (productsResponse.data.length > 0) {
    //   const productId = productsResponse.data[0]._id;
    //   const updated = await client.updateProduct(productId, {
    //     price: 24.99,
    //     description: 'Updated description'
    //   });
    //   console.log('Updated product:', updated.data);
    // }

    // Example 8: Update order status (requires write:orders scope)
    // if (ordersResponse.data.length > 0) {
    //   const orderId = ordersResponse.data[0]._id;
    //   await client.updateOrderStatus(orderId, 'preparing');
    //   console.log('Order status updated');
    // }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// ============================================
// ERROR HANDLING EXAMPLE
// ============================================

async function errorHandlingExample() {
  const client = new CartaAIClient('invalid_key');

  try {
    await client.getProducts('my-restaurant', 'LOC123');
  } catch (error) {
    console.error('Expected error:', error.message);
    // Will show: "API Error 401: Invalid or inactive API key"
  }
}

// ============================================
// BATCH OPERATIONS EXAMPLE
// ============================================

async function batchOperations() {
  const apiKey = process.env.CARTA_API_KEY || 'carta_live_your_key_here';
  const client = new CartaAIClient(apiKey);

  const subDomain = 'my-restaurant';
  const localId = 'LOC1760097779968WGX4I';

  try {
    // Fetch multiple resources in parallel
    const [products, orders, menuStructure] = await Promise.all([
      client.getProducts(subDomain, localId),
      client.getOrders(subDomain, localId),
      client.getBotMenuStructure(subDomain, localId)
    ]);

    console.log('Batch results:');
    console.log('- Products:', products.data.length);
    console.log('- Orders:', orders.data.length);
    console.log('- Menu items:', menuStructure.data.length);
  } catch (error) {
    console.error('Batch error:', error.message);
  }
}

// ============================================
// RATE LIMITING EXAMPLE
// ============================================

async function rateLimitingExample() {
  const apiKey = process.env.CARTA_API_KEY || 'carta_live_your_key_here';
  const client = new CartaAIClient(apiKey);

  const subDomain = 'my-restaurant';
  const localId = 'LOC1760097779968WGX4I';

  // Implement exponential backoff for rate limiting
  async function fetchWithRetry(maxRetries = 3) {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        return await client.getProducts(subDomain, localId);
      } catch (error) {
        if (error.message.includes('429') && retries < maxRetries - 1) {
          const delay = Math.pow(2, retries) * 1000; // Exponential backoff
          console.log(`Rate limited. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
        } else {
          throw error;
        }
      }
    }
  }

  try {
    const result = await fetchWithRetry();
    console.log('Success:', result.data.length, 'products');
  } catch (error) {
    console.error('Failed after retries:', error.message);
  }
}

// ============================================
// EXPORT
// ============================================

module.exports = CartaAIClient;

// Run examples if executed directly
if (require.main === module) {
  console.log('🚀 CartaAI API Client Examples\n');
  examples()
    .then(() => console.log('\n✅ Examples completed'))
    .catch(err => console.error('\n❌ Error:', err.message));
}
