const multer = require('multer');
const ApiError = require('../utils/ApiError');

/**
 * Vercel's filesystem is read-only, so we never write to disk: multer buffers
 * the file in memory and the controller streams that buffer to Cloudinary.
 * This also gives us a natural place to enforce type/size limits.
 */
const storage = multer.memoryStorage();

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function fileFilter(allowed, label) {
  return (_req, file, cb) => {
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(ApiError.badRequest(`Unsupported ${label} format. Allowed: ${allowed.join(', ')}`));
  };
}

const uploadImage = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: fileFilter(IMAGE_TYPES, 'image'),
});

const uploadResume = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: fileFilter(DOC_TYPES, 'document'),
});

module.exports = { uploadImage, uploadResume };
