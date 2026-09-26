const { Application, Job, User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const { requireFields, oneOf } = require('../middleware/validate');

const APPLICANT_FIELDS = 'name email avatar headline location skills resume';
const JOB_FIELDS = 'title slug location employmentType workMode status company salary';

// POST /api/applications/:jobId
const applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId).populate('company', 'name');
  if (!job) throw ApiError.notFound('Job not found');
  if (job.status !== 'open') throw ApiError.badRequest('This job is no longer accepting applications');
  if (job.deadline && job.deadline.getTime() < Date.now()) {
    throw ApiError.badRequest('The application deadline for this job has passed');
  }

  // Employers shouldn't be able to apply to their own posting.
  if (String(job.postedBy) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot apply to a job you posted');
  }

  if (await Application.exists({ job: job._id, applicant: req.user._id })) {
    throw ApiError.conflict('You have already applied to this job');
  }

  // A CV is mandatory: either uploaded to the profile or attached per-application.
  const resume = req.body.resume || (req.user.resume?.url ? req.user.resume : null);
  if (!resume?.url) {
    throw ApiError.badRequest('Please upload a resume to your profile before applying');
  }

  const application = await Application.create({
    job: job._id,
    applicant: req.user._id,
    employer: job.postedBy,
    resume,
    coverLetter: req.body.coverLetter,
    expectedSalary: req.body.expectedSalary,
    status: 'pending',
  });

  // Keep the denormalised counter in sync.
  await Job.updateOne({ _id: job._id }, { $inc: { applicationCount: 1 } });

  await application.populate([
    { path: 'job', select: JOB_FIELDS },
    { path: 'applicant', select: APPLICANT_FIELDS },
  ]);

  res.status(201).json({ success: true, application });
});

// GET /api/applications/mine  (jobseeker)
const getMyApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { applicant: req.user._id };

  const status = oneOf(req.query.status, Application.STATUSES, 'status');
  if (status) filter.status = status;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'job', select: JOB_FIELDS, populate: { path: 'company', select: 'name slug logo' } })
      .populate('employer', 'name'),
    Application.countDocuments(filter),
  ]);

  res.json({ success: true, applications, meta: buildMeta({ total, page, limit }) });
});

// GET /api/applications/stats  (jobseeker)
const getApplicantStats = asyncHandler(async (req, res) => {
  const grouped = await Application.aggregate([
    { $match: { applicant: req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const byStatus = Object.fromEntries(grouped.map((row) => [row._id, row.count]));
  const total = grouped.reduce((sum, row) => sum + row.count, 0);

  const recent = await Application.find({ applicant: req.user._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate({ path: 'job', select: JOB_FIELDS, populate: { path: 'company', select: 'name slug logo' } });

  res.json({
    success: true,
    stats: {
      total,
      byStatus,
      pending: byStatus.pending || 0,
      inProgress: (byStatus.reviewed || 0) + (byStatus.shortlisted || 0) + (byStatus.interview || 0),
      offered: (byStatus.offered || 0) + (byStatus.hired || 0),
      rejected: byStatus.rejected || 0,
      recent,
    },
  });
});

// GET /api/applications/:id
const getApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate({ path: 'job', select: JOB_FIELDS, populate: { path: 'company', select: 'name slug logo' } })
    .populate('applicant', APPLICANT_FIELDS)
    .populate('employer', 'name');

  if (!application) throw ApiError.notFound('Application not found');

  const isApplicant = String(application.applicant._id) === String(req.user._id);
  const isEmployer = String(application.employer._id) === String(req.user._id);
  if (!isApplicant && !isEmployer && req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have access to this application');
  }

  res.json({ success: true, application });
});

// GET /api/applications/job/:jobId  (employer)
const getJobApplications = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId).select('postedBy title company');
  if (!job) throw ApiError.notFound('Job not found');
  if (String(job.postedBy) !== String(req.user._id) && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only view applications for your own jobs');
  }

  const { page, limit, skip } = getPagination(req.query);
  const filter = { job: job._id };

  const status = oneOf(req.query.status, Application.STATUSES, 'status');
  if (status) filter.status = status;

  const [applications, total] = await Promise.all([
    Application.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('applicant', APPLICANT_FIELDS),
    Application.countDocuments(filter),
  ]);

  res.json({ success: true, job, applications, meta: buildMeta({ total, page, limit }) });
});

// PATCH /api/applications/:id/status  (employer)
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const status = oneOf(req.body.status, Application.STATUSES, 'status');
  if (!status) throw ApiError.badRequest('A status value is required');

  const application = await Application.findById(req.params.id);
  if (!application) throw ApiError.notFound('Application not found');

  const isOwner = String(application.employer) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only update applications for your own jobs');
  }

  application.status = status;
  application.isRead = true;
  if (req.body.employerNote !== undefined) application.employerNote = req.body.employerNote;
  // The pre-save hook only seeds the first entry, so append history explicitly.
  application.timeline.push({ status, note: req.body.note || `Marked as ${status}` });

  await application.save();
  await application.populate('applicant', APPLICANT_FIELDS);

  res.json({ success: true, application });
});

// POST /api/applications/:id/withdraw  (jobseeker)
const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) throw ApiError.notFound('Application not found');
  if (String(application.applicant) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only withdraw your own applications');
  }
  if (application.status === 'withdrawn') throw ApiError.badRequest('This application is already withdrawn');
  if (['hired', 'rejected'].includes(application.status)) {
    throw ApiError.badRequest(`You cannot withdraw an application that is ${application.status}`);
  }

  application.status = 'withdrawn';
  application.timeline.push({ status: 'withdrawn', note: 'Withdrawn by candidate' });
  await application.save();

  res.json({ success: true, application });
});

// DELETE /api/applications/:id  (applicant or job owner)
const deleteApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) throw ApiError.notFound('Application not found');

  const isApplicant = String(application.applicant) === String(req.user._id);
  const isEmployer = String(application.employer) === String(req.user._id);
  if (!isApplicant && !isEmployer && req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have access to this application');
  }

  await application.deleteOne();
  await Job.updateOne({ _id: application.job }, { $inc: { applicationCount: -1 } });

  res.json({ success: true, message: 'Application removed' });
});

module.exports = {
  applyToJob,
  getMyApplications,
  getApplicantStats,
  getApplication,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
  deleteApplication,
};
