const mongoose = require('mongoose');
const { Schema } = mongoose;

const APPLICATION_STATUSES = [
  'pending',
  'reviewed',
  'shortlisted',
  'interview',
  'offered',
  'hired',
  'rejected',
  'withdrawn',
];

const timelineSchema = new Schema(
  {
    status: { type: String, enum: APPLICATION_STATUSES, required: true },
    note: String,
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const applicationSchema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    applicant: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    employer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Snapshot of the CV at the time of applying, plus an optional override.
    resume: {
      url: String,
      publicId: String,
      filename: String,
    },
    coverLetter: { type: String, maxlength: 6000 },
    expectedSalary: { type: Number, min: 0 },

    status: { type: String, enum: APPLICATION_STATUSES, default: 'pending', index: true },
    employerNote: { type: String, maxlength: 2000 },
    timeline: { type: [timelineSchema], default: [] },

    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// A candidate may only apply once per job.
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ applicant: 1, createdAt: -1 });
applicationSchema.index({ employer: 1, status: 1, createdAt: -1 });

// Seed the timeline with the initial "pending" entry.
applicationSchema.pre('save', function seedTimeline(next) {
  if (this.isNew && this.timeline.length === 0) {
    this.timeline.push({ status: this.status, note: 'Application submitted' });
  }
  next();
});

applicationSchema.statics.STATUSES = APPLICATION_STATUSES;

module.exports = mongoose.model('Application', applicationSchema);
