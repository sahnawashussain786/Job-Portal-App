const mongoose = require('mongoose');
const { Schema } = mongoose;

/** Turn "Acme Corp" into "acme-corp" for readable, collision-resistant URLs. */
function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const companySchema = new Schema(
  {
    name: { type: String, required: [true, 'Company name is required'], trim: true, maxlength: 120 },
    slug: { type: String, unique: true, index: true },
    tagline: { type: String, trim: true, maxlength: 160 },
    description: { type: String, maxlength: 4000 },
    website: { type: String, trim: true },
    industry: { type: String, trim: true },
    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'],
    },
    foundedYear: { type: Number, min: 1800, max: new Date().getFullYear() },
    location: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    logo: {
      url: String,
      publicId: String,
    },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Generate a unique slug before validation, appending a counter on conflict.
companySchema.pre('validate', async function assignSlug(next) {
  if (!this.isModified('name') && this.slug) return next();
  const base = slugify(this.name) || 'company';
  let candidate = base;
  let suffix = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await this.constructor.exists({ slug: candidate, _id: { $ne: this._id } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  this.slug = candidate;
  return next();
});

companySchema.statics.slugify = slugify;

module.exports = mongoose.model('Company', companySchema);
