import multer from 'multer';

// Configure storage to keep files in memory (Buffer)
// This is required for MinIO upload logic
const storage = multer.memoryStorage();

/**
 * Creates a configured Multer instance
 * @param {string[]} allowedTypes - Array of allowed mime types
 * @param {number} maxFileSize - Max size in bytes (Default: 5MB)
 */
const createUploader = (
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'], 
  maxFileSize = 5 * 1024 * 1024 // 5MB limit
) => {
  
  // File validation filter
  const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Create a clean error that controllers can catch
      const error = new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      error.name = 'ValidationError'; 
      cb(error, false);
    }
  };

  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: maxFileSize
    }
  });
};

export default createUploader;