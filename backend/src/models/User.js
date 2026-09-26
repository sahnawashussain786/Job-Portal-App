const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

const ROLES = ['jobseeker', 'employer', 'admin'];

const fileSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: String,
    filename: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    // `select: false` keeps the hash out of every query unless explicitly asked.
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: { type: String, enum: ROLES, default: 'jobseeker', index: true },

    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    headline: { type: String, trim: true, maxlength: 140 },
    bio: { type: String, maxlength: 2000 },
    skills: { type: [String], default: [] },
    avatar: fileSchema,

    // Job seeker CV — required to apply for a job.
    resume: fileSchema,

    // Employers belong to exactly one company.
    company: { type: Schema.Types.ObjectId, ref: 'Company' },

    savedJobs: [{ type: Schema.Types.ObjectId, ref: 'Job' }],

    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Hash the password whenever it is set or changed.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.virtual('hasResume').get(function hasResume() {
  return Boolean(this.resume?.url);
});

userSchema.statics.ROLES = ROLES;

module.exports = mongoose.model('User', userSchema);
