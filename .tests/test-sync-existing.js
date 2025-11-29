const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3001',
  auth: {
    username: 'tcbsgpm91wpw-az@ptltrybrmvpmok.hz',
    password: 'Etalon12345@'
  }
});

async function test() {
  try {
    // Get first product
    const products = await api.get('/api/v1/products/get-all/my-restaurant/LOC1760097779968WGX4I');
    const productId = products.data.data[0]._id;
    console.log('Testing sync for product:', productId);

    // Try to sync it
    const result = await api.post(`/api/v1/products/sync-product-to-catalog/${productId}`, {
      catalogId: '694779509943361'
    });

    console.log('Success:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.log('Error Response:', JSON.stringify(error.response?.data, null, 2));
  }
}

test();
