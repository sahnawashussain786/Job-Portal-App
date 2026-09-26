const mongoose = require('mongoose');
const { Job, Company, Application, User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const { requireFields, oneOf } = require('../middleware/validate');

const SORTS = {
  recent: { publishedAt: -1 },
  oldest: { publishedAt: 1 },
  salary: { 'salary.max': -1 },
  popular: { applicationCount: -1, views: -1 },
  title: { title: 1 },
};

const POPULATE = [
  { path: 'company', select: 'name slug logo location industry companySize isVerified' },
  { path: 'postedBy', select: 'name email company' },
];

/** Escape user input before it goes into a $regex so `(` can't break the query. */
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Translate query params into a Mongo filter.
 * @param {object} query  raw req.query
 * @param {boolean} includeDrafts  employers/admin may see non-open jobs
 */
function buildFilters(query, includeDrafts = false) {
  const filter = {};

  if (includeDrafts) {
    const status = oneOf(query.status, Job.JOB_STATUSES, 'status');
    if (status) filter.status = status;
  } else {
    filter.status = 'open';
  }

  if (query.q) {
    const term = escapeRegex(query.q);
    // Regex (not $text) so partial words like "reac" still match while typing.
    filter.$or = [
      { title: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } },
      { skills: { $regex: term, $options: 'i' } },
      { category: { $regex: term, $options: 'i' } },
    ];
  }

  if (query.location) filter.location = { $regex: escapeRegex(query.location), $options: 'i' };
  if (query.company) filter.company = query.company;

  const category = oneOf(query.category, Job.CATEGORIES, 'category');
  if (category) filter.category = category;

  const employmentType = oneOf(query.employmentType, Job.EMPLOYMENT_TYPES, 'employmentType');
  if (employmentType) filter.employmentType = employmentType;

  const workMode = oneOf(query.workMode, Job.WORK_MODES, 'workMode');
  if (workMode) filter.workMode = workMode;

  const experienceLevel = oneOf(query.experienceLevel, Job.EXPERIENCE_LEVELS, 'experienceLevel');
  if (experienceLevel) filter.experienceLevel = experienceLevel;

  // Salary overlap: the job's ceiling must clear the candidate's floor.
  if (query.minSalary) {
    filter['salary.max'] = { $gte: Number(query.minSalary) };
  }

  if (query.featured === 'true') filter.isFeatured = true;

  return filter;
}

// GET /api/jobs
const listJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = buildFilters(req.query, false);
  const sort = SORTS[oneOf(req.query.sort, Object.keys(SORTS), 'sort')] || SORTS.recent;

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort(sort).skip(skip).limit(limit).populate(POPULATE).lean({ virtuals: true }),
    Job.countDocuments(filter),
  ]);

  // Annotate with per-user state so the UI can render "Saved"/"Applied" buttons.
  let savedIds = new Set();
  let appliedIds = new Set();
  if (req.user && jobs.length > 0) {
    const ids = jobs.map((job) => job._id);
    const [user, applications] = await Promise.all([
      User.findById(req.user._id).select('savedJobs'),
      Application.find({ applicant: req.user._id, job: { $in: ids } }).select('job'),
    ]);
    savedIds = new Set((user?.savedJobs || []).map((id) => String(id)));
    appliedIds = new Set(applications.map((app) => String(app.job)));
  }

  const data = jobs.map((job) => ({
    ...job,
    isSaved: savedIds.has(String(job._id)),
    hasApplied: appliedIds.has(String(job._id)),
  }));

  res.json({ success: true, jobs: data, meta: buildMeta({ total, page, limit }) });
});

// GET /api/jobs/:id  (accepts an ObjectId or a slug)
const getJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.isValidObjectId(id) ? { _id: id } : { slug: id };

  const job = await Job.findOneAndUpdate(query, { $inc: { views: 1 } }, { new: true }).populate(POPULATE);
  if (!job) throw ApiError.notFound('That job could not be found');

  // Drafts and closed jobs are only visible to their owner and admins.
  const isOwner = req.user && String(job.postedBy._id || job.postedBy) === String(req.user._id);
  const isAdmin = req.user?.role === 'admin';
  if (job.status !== 'open' && !isOwner && !isAdmin) {
    throw ApiError.notFound('That job is no longer available');
  }

  const payload = { success: true, job: job.toJSON() };

  if (req.user) {
    const [user, application] = await Promise.all([
      User.findById(req.user._id).select('savedJobs'),
      Application.findOne({ job: job._id, applicant: req.user._id }).select('status createdAt'),
    ]);
    payload.isSaved = (user?.savedJobs || []).some((savedId) => String(savedId) === String(job._id));
    payload.hasApplied = Boolean(application);
    payload.application = application || null;
  }

  res.json(payload);
});

// POST /api/jobs  (employer | admin)
const createJob = asyncHandler(async (req, res) => {
  requireFields(req.body, ['title', 'description']);

  let companyId = req.body.company;

  // Employers almost always post for their own company; resolve it automatically.
  if (!companyId && req.user.role === 'employer') {
    if (!req.user.company) {
      throw ApiError.badRequest('Create your company profile before posting a job');
    }
    companyId = req.user.company;
  }
  if (!companyId) throw ApiError.badRequest('A company is required to post a job');

  const company = await Company.findById(companyId);
  if (!company) throw ApiError.notFound('Company not found');
  // Only the company owner (or an admin) may hire on its behalf.
  if (req.user.role !== 'admin' && String(company.owner) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only post jobs for your own company');
  }

  const job = await Job.create({
    ...req.body,
    company: company._id,
    postedBy: req.user._id,
    status: req.body.status || 'open',
  });

  await job.populate(POPULATE);
  res.status(201).json({ success: true, job: job.toJSON() });
});

/** Load a job and assert the caller may modify it. */
async function findOwnedJob(req) {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job not found');
  const isOwner = String(job.postedBy) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only manage jobs you posted');
  }
  return job;
}

// PATCH /api/jobs/:id
const updateJob = asyncHandler(async (req, res) => {
  const job = await findOwnedJob(req);

  // Never allow ownership/meta fields to be reassigned through the API.
  const blocked = ['company', 'postedBy', 'applicationCount', 'views', 'slug', '_id'];
  Object.entries(req.body).forEach(([key, value]) => {
    if (!blocked.includes(key)) job[key] = value;
  });

  if (job.salary?.min && job.salary?.max && job.salary.min > job.salary.max) {
    throw ApiError.badRequest('Minimum salary cannot exceed maximum salary');
  }

  await job.save();
  await job.populate(POPULATE);
  res.json({ success: true, job: job.toJSON() });
});

// DELETE /api/jobs/:id
const deleteJob = asyncHandler(async (req, res) => {
  const job = await findOwnedJob(req);

  // Clean up dependent data so no orphan applications or saved references linger.
  await Promise.all([
    Application.deleteMany({ job: job._id }),
    User.updateMany({ savedJobs: job._id }, { $pull: { savedJobs: job._id } }),
    job.deleteOne(),
  ]);

  res.json({ success: true, message: 'Job deleted' });
});

// GET /api/jobs/employer/mine
const getMyJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { postedBy: req.user._id };

  const status = oneOf(req.query.status, Job.JOB_STATUSES, 'status');
  if (status) filter.status = status;
  if (req.query.q) filter.title = { $regex: escapeRegex(req.query.q), $options: 'i' };

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(POPULATE),
    Job.countDocuments(filter),
  ]);

  res.json({ success: true, jobs, meta: buildMeta({ total, page, limit }) });
});

// GET /api/jobs/employer/stats
const getEmployerStats = asyncHandler(async (req, res) => {
  const [byStatus, byApplicationStatus, recentApplications, totals] = await Promise.all([
    Job.aggregate([
      { $match: { postedBy: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.aggregate([
      { $match: { employer: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.find({ employer: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('applicant', 'name email avatar headline')
      .populate('job', 'title slug'),
    Job.aggregate([
      { $match: { postedBy: req.user._id } },
      { $group: { _id: null, views: { $sum: '$views' }, applications: { $sum: '$applicationCount' } } },
    ]),
  ]);

  const statusMap = Object.fromEntries(byStatus.map((row) => [row._id, row.count]));
  const applicationMap = Object.fromEntries(byApplicationStatus.map((row) => [row._id, row.count]));
  const totalJobs = Object.values(statusMap).reduce((sum, n) => sum + n, 0);

  res.json({
    success: true,
    stats: {
      totalJobs,
      openJobs: statusMap.open || 0,
      draftJobs: statusMap.draft || 0,
      closedJobs: (statusMap.closed || 0) + (statusMap.archived || 0),
      totalApplications: Object.values(applicationMap).reduce((sum, n) => sum + n, 0),
      pendingApplications: applicationMap.pending || 0,
      shortlisted: (applicationMap.shortlisted || 0) + (applicationMap.interview || 0),
      hired: applicationMap.hired || 0,
      totalViews: totals[0]?.views || 0,
      applicationsByStatus: applicationMap,
      recentApplications,
    },
  });
});

// POST /api/jobs/:id/save  — toggles save/unsave
const toggleSaveJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).select('_id');
  if (!job) throw ApiError.notFound('Job not found');

  const user = await User.findById(req.user._id).select('savedJobs');
  const alreadySaved = user.savedJobs.some((id) => String(id) === String(job._id));

  const update = alreadySaved ? { $pull: { savedJobs: job._id } } : { $addToSet: { savedJobs: job._id } };
  await User.updateOne({ _id: user._id }, update);

  res.json({ success: true, isSaved: !alreadySaved, message: alreadySaved ? 'Removed from saved jobs' : 'Job saved' });
});

// GET /api/jobs/saved
const getSavedJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const user = await User.findById(req.user._id).select('savedJobs');
  const ids = user.savedJobs || [];

  const [jobs, total] = await Promise.all([
    Job.find({ _id: { $in: ids } }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(POPULATE),
    Job.countDocuments({ _id: { $in: ids } }),
  ]);

  res.json({
    success: true,
    jobs: jobs.map((job) => ({ ...job.toJSON(), isSaved: true })),
    meta: buildMeta({ total, page, limit }),
  });
});

// GET /api/jobs/meta/filters — powers the filter sidebar without hardcoding lists
const getFilterMeta = asyncHandler(async (_req, res) => {
  const [locations, companies] = await Promise.all([
    Job.aggregate([
      { $match: { status: 'open' } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
    Company.find({}).select('name slug logo').sort({ name: 1 }).limit(100),
  ]);

  res.json({
    success: true,
    meta: {
      categories: Job.CATEGORIES,
      employmentTypes: Job.EMPLOYMENT_TYPES,
      workModes: Job.WORK_MODES,
      experienceLevels: Job.EXPERIENCE_LEVELS,
      locations: locations.map((row) => ({ value: row._id, count: row.count })),
      companies,
    },
  });
});

// GET /api/jobs/featured
const getFeaturedJobs = asyncHandler(async (req, res) => {
  const limit = Math.min(12, Number(req.query.limit) || 6);
  const jobs = await Job.find({ status: 'open' })
    .sort({ isFeatured: -1, applicationCount: -1, publishedAt: -1 })
    .limit(limit)
    .populate(POPULATE);

  res.json({ success: true, jobs });
});

module.exports = {
  listJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
  getEmployerStats,
  toggleSaveJob,
  getSavedJobs,
  getFilterMeta,
  getFeaturedJobs,
};
