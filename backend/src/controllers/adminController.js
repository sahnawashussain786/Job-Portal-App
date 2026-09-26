const { User, Job, Company, Application } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const { oneOf } = require('../middleware/validate');

// GET /api/admin/stats
const getStats = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    seekerCount,
    employerCount,
    totalJobs,
    openJobs,
    totalApplications,
    totalCompanies,
    byCategory,
    monthlySignups,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'jobseeker' }),
    User.countDocuments({ role: 'employer' }),
    Job.countDocuments({}),
    Job.countDocuments({ status: 'open' }),
    Application.countDocuments({}),
    Company.countDocuments({}),
    Job.aggregate([
      { $match: { status: 'open' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    // Last 6 months of registrations for the dashboard chart.
    User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({
    success: true,
    stats: {
      totalUsers,
      seekers: seekerCount,
      employers: employerCount,
      totalJobs,
      openJobs,
      totalApplications,
      totalCompanies,
      byCategory,
      monthlySignups,
      // Rough funnel health: applications per open role.
      applicationsPerJob: openJobs ? Number((totalApplications / openJobs).toFixed(2)) : 0,
    },
  });
});

// GET /api/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  const role = oneOf(req.query.role, User.ROLES, 'role');
  if (role) filter.role = role;
  if (req.query.q) {
    const term = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ name: { $regex: term, $options: 'i' } }, { email: { $regex: term, $options: 'i' } }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('company', 'name slug'),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, users, meta: buildMeta({ total, page, limit }) });
});

// PATCH /api/admin/users/:id
const updateUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot change your own role or status');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  const role = oneOf(req.body.role, User.ROLES, 'role');
  if (role) user.role = role;
  if (typeof req.body.isActive === 'boolean') user.isActive = req.body.isActive;

  await user.save();
  res.json({ success: true, user: user.toJSON() });
});

// DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot delete your own account from the admin panel');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  // Cascade: remove the user's applications and saved-job references.
  await Promise.all([
    Application.deleteMany({ applicant: user._id }),
    User.updateMany({ savedJobs: { $in: [user._id] } }, { $pull: { savedJobs: user._id } }),
    user.deleteOne(),
  ]);

  res.json({ success: true, message: 'User deleted' });
});

// GET /api/admin/jobs
const listAllJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  const status = oneOf(req.query.status, Job.JOB_STATUSES, 'status');
  if (status) filter.status = status;
  if (req.query.q) {
    const term = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.title = { $regex: term, $options: 'i' };
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('company', 'name slug logo')
      .populate('postedBy', 'name email'),
    Job.countDocuments(filter),
  ]);

  res.json({ success: true, jobs, meta: buildMeta({ total, page, limit }) });
});

// PATCH /api/admin/jobs/:id  — moderation: feature/unfeature or change status
const moderateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job not found');

  if (typeof req.body.isFeatured === 'boolean') job.isFeatured = req.body.isFeatured;
  const status = oneOf(req.body.status, Job.JOB_STATUSES, 'status');
  if (status) job.status = status;

  await job.save();
  res.json({ success: true, job });
});

// DELETE /api/admin/jobs/:id
const deleteJobAsAdmin = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job not found');

  await Promise.all([
    Application.deleteMany({ job: job._id }),
    User.updateMany({ savedJobs: job._id }, { $pull: { savedJobs: job._id } }),
    job.deleteOne(),
  ]);

  res.json({ success: true, message: 'Job removed' });
});

module.exports = {
  getStats,
  listUsers,
  updateUser,
  deleteUser,
  listAllJobs,
  moderateJob,
  deleteJobAsAdmin,
};
