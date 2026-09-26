const env = require('../config/env');
const { uploadBuffer, destroyAsset } = require('../config/cloudinary');
const { User, Company } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/** Fail fast with an actionable message when Cloudinary isn't configured. */
function assertConfigured() {
  if (!env.cloudinary.enabled) {
    throw new ApiError(
      503,
      'File uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
    );
  }
}

// POST /api/uploads/image  — company logo or avatar
const uploadImage = asyncHandler(async (req, res) => {
  assertConfigured();
  if (!req.file) throw ApiError.badRequest('No image file provided');

  const result = await uploadBuffer(req.file.buffer, {
    folder: 'jobportal/images',
    resource_type: 'image',
    // Normalise size/quality while keeping the original aspect ratio.
    transformation: [{ width: 512, height: 512, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
  });

  const payload = {
    url: result.secure_url,
    publicId: result.public_id,
    filename: req.file.originalname,
  };

  // Persist directly onto the right document when the target is known.
  if (req.body.target === 'avatar') {
    await destroyAsset(req.user.avatar?.publicId);
    await User.updateOne({ _id: req.user._id }, { avatar: payload });
  } else if (req.body.target === 'logo') {
    const company = await Company.findById(req.user.company);
    if (company) {
      await destroyAsset(company.logo?.publicId);
      company.logo = { url: payload.url, publicId: payload.publicId };
      await company.save();
    }
  }

  res.status(201).json({ success: true, file: payload });
});

// POST /api/uploads/resume  — PDF/DOC/DOCX
const uploadResume = asyncHandler(async (req, res) => {
  assertConfigured();
  if (!req.file) throw ApiError.badRequest('No resume file provided');

  const result = await uploadBuffer(req.file.buffer, {
    folder: 'jobportal/resumes',
    resource_type: 'raw', // preserves the original file so it downloads intact
    type: 'upload',
  });

  // Replace any previous CV and clean up the old asset.
  await destroyAsset(req.user.resume?.publicId, 'raw');

  const payload = {
    url: result.secure_url,
    publicId: result.public_id,
    filename: req.file.originalname,
  };

  await User.updateOne({ _id: req.user._id }, { resume: payload });

  res.status(201).json({ success: true, file: payload });
});

// DELETE /api/uploads/resume
const deleteResume = asyncHandler(async (req, res) => {
  await destroyAsset(req.user.resume?.publicId, 'raw');
  await User.updateOne({ _id: req.user._id }, { $unset: { resume: 1 } });
  res.json({ success: true, message: 'Resume removed' });
});

// GET /api/uploads/config  — lets the UI hide upload widgets when unconfigured
const getUploadConfig = asyncHandler(async (_req, res) => {
  res.json({ success: true, enabled: env.cloudinary.enabled });
});

module.exports = { uploadImage, uploadResume, deleteResume, getUploadConfig };
