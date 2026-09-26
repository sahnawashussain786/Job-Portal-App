const { User, Company } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { generateToken } = require('../utils/generateToken');
const { requireFields } = require('../middleware/validate');

/** Shape the auth response identically from every endpoint. */
function authPayload(user) {
  return {
    success: true,
    token: generateToken(user),
    user: user.toJSON(),
  };
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'jobseeker', companyName, location, phone } = req.body;
  requireFields(req.body, ['name', 'email', 'password']);

  // The admin role is never self-assignable — it's granted by the seed script.
  const safeRole = role === 'employer' ? 'employer' : 'jobseeker';

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with that email already exists');

  const user = await User.create({
    name,
    email,
    password,
    role: safeRole,
    location,
    phone,
  });

  // Employers get a company record immediately so they can post jobs right away.
  if (safeRole === 'employer' && companyName) {
    const company = await Company.create({
      name: companyName,
      owner: user._id,
      location,
    });
    user.company = company._id;
    await user.save();
  }

  res.status(201).json(authPayload(user));
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  requireFields(req.body, ['email', 'password']);

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  // Identical message for "no such user" and "wrong password" so the endpoint
  // can't be used to enumerate registered emails.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  res.json(authPayload(user));
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('company', 'name slug logo location isVerified');
  res.json({ success: true, user: user.toJSON() });
});

// PATCH /api/auth/me
const updateMe = asyncHandler(async (req, res) => {
  // Whitelist updatable fields; `role`, `email` and `password` are not among them.
  const editable = ['name', 'phone', 'location', 'headline', 'bio', 'skills'];
  const updates = {};
  editable.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (updates.skills !== undefined && !Array.isArray(updates.skills)) {
    throw ApiError.badRequest('skills must be an array of strings');
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  res.json({ success: true, user: user.toJSON() });
});

// PATCH /api/auth/password
const changePassword = asyncHandler(async (req, res) => {
  requireFields(req.body, ['currentPassword', 'newPassword']);
  const { currentPassword, newPassword } = req.body;

  if (String(newPassword).length < 6) {
    throw ApiError.badRequest('New password must be at least 6 characters');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Your current password is incorrect');
  }

  user.password = newPassword; // re-hashed by the pre-save hook
  await user.save();

  res.json({ success: true, message: 'Password updated successfully', token: generateToken(user) });
});

// DELETE /api/auth/me
const deleteMe = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.user._id);
  res.json({ success: true, message: 'Account deleted' });
});

module.exports = { register, login, getMe, updateMe, changePassword, deleteMe };
