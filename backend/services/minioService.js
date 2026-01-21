import { minioClient, BUCKET_NAME } from '../config/minio.js';
import path from 'path';

// Helper: Generate Public URL
const getPublicUrl = (fileName) => {
  const host = process.env.MINIO_PUBLIC_HOST || 'localhost:9000';
  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
  return `${protocol}://${host}/${BUCKET_NAME}/${fileName}`;
};

const MinioService = {
  
  /**
   * METHOD 1: BACKEND PROXY (For Images/Small Files)
   * Node.js receives file -> Uploads to MinIO
   */
  uploadBuffer: async (file, folder = 'misc') => {
    if (!file) return null;

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const fileName = `${folder}/${file.fieldname}-${uniqueSuffix}${ext}`;

    await minioClient.putObject(
      BUCKET_NAME,
      fileName,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype }
    );

    return getPublicUrl(fileName);
  },

  /**
   * METHOD 2: PRESIGNED URL (For Audio/Large Files)
   * Generates a temporary URL for the Frontend to upload directly
   */
  generateUploadUrl: async (originalName, folder = 'audio') => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(originalName);
    const fileName = `${folder}/upload-${uniqueSuffix}${ext}`;

    // Generate URL valid for 15 minutes (900 seconds)
    const presignedUrl = await minioClient.presignedPutObject(
      BUCKET_NAME,
      fileName,
      900
    );

    return {
      uploadUrl: presignedUrl,       // Frontend PUTs file here
      publicUrl: getPublicUrl(fileName), // Frontend saves this to DB
      fileName: fileName
    };
  },

  /**
   * UTILITY: Delete File
   * Used when deleting an RJ or Show to clean up images
   */
  deleteFile: async (fileUrl) => {
    try {
      if (!fileUrl) return;
      // Extract filename from URL (e.g., "rjs/photo-123.jpg")
      const parts = fileUrl.split(`/${BUCKET_NAME}/`);
      if (parts.length < 2) return;
      
      const fileName = parts[1];
      await minioClient.removeObject(BUCKET_NAME, fileName);
    } catch (err) {
      console.error("Failed to delete file from MinIO:", err.message);
    }
  }
};

export default MinioService;