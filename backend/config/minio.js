import * as Minio from 'minio';
import 'dotenv/config'; // <--- CRITICAL: Loads .env variables immediately

const BUCKET_NAME = process.env.MINIO_BUCKET || 'bytecast-media';

// Now this will work because dotenv is loaded above
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ROOT_USER,
  secretKey: process.env.MINIO_ROOT_PASSWORD
});

// We only define the function here, we DO NOT call it yet
const initMinio = async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');

      const corsConfig = {
      ExposeHeaders: ["ETag"],
      AllowedHeaders: ["*"],
      AllowedMethods: ["GET", "HEAD", "PUT", "POST", "DELETE"],
      AllowedOrigins: ["http://localhost:5173", "http://localhost:5000"] 
    };
    
    // Note: The MinIO JS client function is setBucketCors
    await minioClient.setBucketCors(BUCKET_NAME, JSON.stringify([corsConfig]));
    console.log(`✅ CORS Configured for bucket '${BUCKET_NAME}'`);
      
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
          }
        ]
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      console.log(`✅ MinIO Bucket '${BUCKET_NAME}' created.`);
    } else {
      console.log(`✅ MinIO connected (Bucket: '${BUCKET_NAME}')`);
    }
  } catch (err) {
    console.error("❌ MinIO Connection Failed:", err.message);
    throw err; // Throw error so server.js knows we failed
  }
};

// Export the function so server.js can control it
export { minioClient, BUCKET_NAME, initMinio };