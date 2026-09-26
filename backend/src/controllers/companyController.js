const mongoose = require('mongoose');
const { Company, Job, User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const { requireFields } = require('../middleware/validate');

const EDITABLE = [
  'name',
  'tagline',
  'description',
  'website',
  'industry',
  'companySize',
  'foundedYear',
  'location',
  'email',
  'phone',
  'logo',
];

// GET /api/companies  — public directory
const listCompanies = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.q) {
    const term = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.name = { $regex: term, $options: 'i' };
  }

  const [companies, total] = await Promise.all([
    Company.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Company.countDocuments(filter),
  ]);

  res.json({ success: true, companies, meta: buildMeta({ total, page, limit }) });
});

// GET /api/companies/:idOrSlug
const getCompany = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const query = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };

  const company = await Company.findOne(query);
  if (!company) throw ApiError.notFound('Company not found');

  const [jobs, openJobCount] = await Promise.all([
    Job.find({ company: company._id, status: 'open' })
      .sort({ publishedAt: -1 })
      .limit(20)
      .populate('company', 'name slug logo location'),
    Job.countDocuments({ company: company._id, status: 'open' }),
  ]);

  res.json({ success: true, company, jobs, openJobCount });
});

// GET /api/companies/mine  (employer)
const getMyCompany = asyncHandler(async (req, res) => {
  if (!req.user.company) {
    return res.json({ success: true, company: null });
  }
  const company = await Company.findById(req.user.company);
  res.json({ success: true, company });
});

// POST /api/companies  (employer — creates the profile on first use)
const createCompany = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name']);

  if (req.user.company) {
    throw ApiError.conflict('You already have a company profile. Update it instead.');
  }

  const company = await Company.create({
    ...Object.fromEntries(Object.entries(req.body).filter(([key]) => EDITABLE.includes(key))),
    owner: req.user._id,
  });

  await User.updateOne({ _id: req.user._id }, { company: company._id });

  res.status(201).json({ success: true, company });
});

// PATCH /api/companies/mine  (employer)
const updateMyCompany = asyncHandler(async (req, res) => {
  if (!req.user.company) throw ApiError.notFound('You have not created a company profile yet');

  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => EDITABLE.includes(key)),
  );

  const company = await Company.findByIdAndUpdate(req.user.company, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, company });
});

// DELETE /api/companies/mine  (employer — only when no jobs depend on it)
const deleteMyCompany = asyncHandler(async (req, res) => {
  if (!req.user.company) throw ApiError.notFound('No company profile to delete');

  const jobCount = await Job.countDocuments({ company: req.user.company });
  if (jobCount > 0) {
    throw ApiError.badRequest(`Delete your ${jobCount} job posting(s) before removing the company profile`);
  }

  await Company.findByIdAndDelete(req.user.company);
  await User.updateOne({ _id: req.user._id }, { $unset: { company: 1 } });

  res.json({ success: true, message: 'Company profile deleted' });
});

module.exports = { listCompanies, getCompany, getMyCompany, createCompany, updateMyCompany, deleteMyCompany };
