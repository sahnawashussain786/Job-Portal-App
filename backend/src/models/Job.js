const mongoose = require('mongoose');
const { Schema } = mongoose;

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'temporary', 'freelance'];
const WORK_MODES = ['onsite', 'remote', 'hybrid'];
const EXPERIENCE_LEVELS = ['internship', 'entry', 'mid', 'senior', 'lead', 'executive'];
const JOB_STATUSES = ['draft', 'open', 'closed', 'archived'];

const CATEGORIES = [
  'Engineering',
  'Design',
  'Product',
  'Data & Analytics',
  'Marketing',
  'Sales',
  'Customer Support',
  'Finance',
  'Human Resources',
  'Operations',
  'Legal',
  'Healthcare',
  'Education',
  'Other',
];

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const jobSchema = new Schema(
  {
    title: { type: String, required: [true, 'Job title is required'], trim: true, maxlength: 140 },
    slug: { type: String, index: true },

    description: { type: String, required: [true, 'Job description is required'], maxlength: 12000 },
    responsibilities: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    skills: { type: [String], default: [] },

    category: { type: String, enum: CATEGORIES, default: 'Other', index: true },
    employmentType: { type: String, enum: EMPLOYMENT_TYPES, default: 'full-time', index: true },
    workMode: { type: String, enum: WORK_MODES, default: 'onsite', index: true },
    experienceLevel: { type: String, enum: EXPERIENCE_LEVELS, default: 'mid', index: true },

    location: { type: String, trim: true, default: 'Remote' },
    salary: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: 'USD' },
      period: { type: String, enum: ['hourly', 'monthly', 'yearly'], default: 'yearly' },
      isNegotiable: { type: Boolean, default: false },
      isVisible: { type: Boolean, default: true },
    },

    openings: { type: Number, min: 1, default: 1 },
    deadline: Date,
    status: { type: String, enum: JOB_STATUSES, default: 'open', index: true },
    isFeatured: { type: Boolean, default: false },

    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Denormalised counters avoid an extra aggregation on every listing.
    applicationCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

// Full-text search across the fields users actually search on.
jobSchema.index(
  { title: 'text', description: 'text', skills: 'text', location: 'text', category: 'text' },
  { weights: { title: 10, skills: 6, category: 3, location: 2, description: 1 }, name: 'job_text_search' },
);
// Dashboard / listing filters.
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ company: 1, status: 1 });

jobSchema.pre('validate', function assignSlug(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = `${slugify(this.title)}-${String(this._id).slice(-6)}`;
  }
  next();
});

jobSchema.virtual('isOpen').get(function isOpen() {
  if (this.status !== 'open') return false;
  if (!this.deadline) return true;
  return this.deadline.getTime() > Date.now();
});

jobSchema.statics.EMPLOYMENT_TYPES = EMPLOYMENT_TYPES;
jobSchema.statics.WORK_MODES = WORK_MODES;
jobSchema.statics.EXPERIENCE_LEVELS = EXPERIENCE_LEVELS;
jobSchema.statics.JOB_STATUSES = JOB_STATUSES;
jobSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('Job', jobSchema);
