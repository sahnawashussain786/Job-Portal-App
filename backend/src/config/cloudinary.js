const { v2: cloudinary } = require('cloudinary');
const env = require('./env');

/**
 * Cloudinary is optional in development: when credentials are absent the app
 * falls back to a "no file uploads" mode where users paste URLs instead. In
 * production the Vercel filesystem is read-only, so Cloudinary is the only way
 * to persist resumes and logos.
 */
if (env.cloudinary.enabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

/** Upload a Buffer (from multer memoryStorage) to Cloudinary. */
function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });
    stream.end(buffer);
  });
}

/** Best-effort delete; never throws so a failed cleanup can't break a request. */
async function destroyAsset(publicId, resourceType = 'image') {
  if (!env.cloudinary.enabled || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.warn(`Cloudinary cleanup failed for ${publicId}: ${error.message}`);
  }
}

module.exports = { cloudinary, uploadBuffer, destroyAsset };
