import multer from "multer";
import path from "path";
import fs from "fs";

export function createUploader({
  uploadDir,                // relative path like "radio/music"
  fieldName = "file",
  mode = "single",
  maxFiles = 10,
  maxFileSizeMB = 50,
  allowedExtensions = [".mp3"],
  allowedMimeTypes = ["audio/mpeg"]
}) {
  // ✅ Resolve path relative to where Node is started
  const resolvedUploadDir = path.resolve(process.cwd(), uploadDir);

  // ✅ Create directory safely
  if (!fs.existsSync(resolvedUploadDir)) {
    fs.mkdirSync(resolvedUploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, resolvedUploadDir),
    filename: (req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      cb(null, `${Date.now()}-${safeName}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (
      allowedExtensions.includes(ext) &&
      allowedMimeTypes.includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.originalname}`));
    }
  };

  const uploader = multer({
    storage,
    limits: {
      fileSize: maxFileSizeMB * 1024 * 1024,
      files: maxFiles
    },
    fileFilter
  });

  return mode === "single"
    ? uploader.single(fieldName)
    : uploader.array(fieldName, maxFiles);
}
