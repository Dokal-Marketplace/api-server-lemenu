const { Client } = require('minio');

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  pathStyle: true
});

async function checkMinIOConnection() {
  try {
    console.log('Checking MinIO connection...');
    const bucketName = process.env.MINIO_BUCKET_NAME || 'lemenu-uploads';
    
    // Test connection
    const exists = await minioClient.bucketExists(bucketName);
    console.log(`✅ MinIO connection successful. Bucket '${bucketName}' exists: ${exists}`);
    
    if (!exists) {
      console.log(`Creating bucket '${bucketName}'...`);
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`✅ Bucket '${bucketName}' created successfully`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ MinIO connection failed:', error.message);
    return false;
  }
}

// Run check
checkMinIOConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  });
