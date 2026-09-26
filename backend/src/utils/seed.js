/**
 * Seed the database with a realistic demo dataset.
 *
 *   npm --prefix backend run seed            # insert demo data
 *   npm --prefix backend run seed:destroy    # wipe all collections
 *
 * The admin account's email is taken from ADMIN_EMAIL so you control which
 * address gets admin rights in your own deployment.
 */
const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const { User, Company, Job, Application } = require('../models');

const PASSWORD = 'Password123!';

const companies = [
  {
    name: 'Nimbus Technologies',
    tagline: 'Cloud infrastructure that scales with you',
    industry: 'Software',
    companySize: '201-500',
    foundedYear: 2014,
    location: 'San Francisco, CA',
    website: 'https://nimbus.example.com',
    description:
      'Nimbus builds developer tooling for teams shipping to the cloud. We are remote-friendly, ship weekly, and invest heavily in engineering mentorship.',
  },
  {
    name: 'Vertex Analytics',
    tagline: 'Turning messy data into confident decisions',
    industry: 'Data & Analytics',
    companySize: '51-200',
    foundedYear: 2018,
    location: 'Austin, TX',
    website: 'https://vertex.example.com',
    description:
      'A data platform used by retail and logistics teams. We care about reproducible analysis and honest metrics.',
  },
  {
    name: 'Bloom Health',
    tagline: 'Care that meets people where they are',
    industry: 'Healthcare',
    companySize: '501-1000',
    foundedYear: 2011,
    location: 'Boston, MA',
    website: 'https://bloomhealth.example.com',
    description:
      'Bloom operates a network of outpatient clinics and a patient platform connecting care teams with patients.',
  },
];

const jobSeed = [
  {
    companyIndex: 0,
    title: 'Senior Frontend Engineer',
    category: 'Engineering',
    employmentType: 'full-time',
    workMode: 'remote',
    experienceLevel: 'senior',
    location: 'Remote (US)',
    salary: { min: 140000, max: 190000, currency: 'USD', period: 'yearly' },
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Testing'],
    description:
      'We are looking for a senior frontend engineer to own our customer console. You will shape component architecture, performance budgets, and the design-system story that other teams build on.',
    responsibilities: [
      'Lead frontend architecture for the customer console',
      'Partner with design to ship an accessible component library',
      'Drive Core Web Vitals and bundle-size improvements',
      'Mentor mid-level engineers through code review',
    ],
    requirements: [
      '5+ years building production React applications',
      'Strong TypeScript and modern bundler experience',
      'Track record of shipping accessible, responsive UI',
      'Comfortable making trade-offs with product and design',
    ],
    benefits: ['Fully remote', 'Equity', 'Home-office budget', 'Unlimited PTO'],
    isFeatured: true,
    openings: 2,
  },
  {
    companyIndex: 0,
    title: 'Backend Engineer, Platform',
    category: 'Engineering',
    employmentType: 'full-time',
    workMode: 'hybrid',
    experienceLevel: 'mid',
    location: 'San Francisco, CA',
    salary: { min: 120000, max: 165000, currency: 'USD', period: 'yearly' },
    skills: ['Node.js', 'MongoDB', 'Express', 'Docker', 'AWS'],
    description:
      'Join the platform team building the APIs and services that power every Nimbus product surface. Expect deep work on data modelling, observability, and reliability.',
    responsibilities: [
      'Design and ship REST APIs in Node.js',
      'Model data in MongoDB and tune query performance',
      'Own service reliability and on-call runbooks',
    ],
    requirements: ['3+ years with Node.js in production', 'Solid MongoDB or Postgres skills', 'Experience with containerised deploys'],
    benefits: ['Hybrid schedule', 'Health & dental', 'Learning stipend'],
  },
  {
    companyIndex: 1,
    title: 'Data Analyst',
    category: 'Data & Analytics',
    employmentType: 'full-time',
    workMode: 'onsite',
    experienceLevel: 'entry',
    location: 'Austin, TX',
    salary: { min: 70000, max: 95000, currency: 'USD', period: 'yearly' },
    skills: ['SQL', 'Python', 'dbt', 'Looker', 'Statistics'],
    description:
      'Support our retail customers with analyses that actually change decisions. You will own reporting for two product lines and build the dashboards leadership trusts.',
    responsibilities: ['Write SQL against our warehouse', 'Build and maintain Looker dashboards', 'Partner with product on experiment design'],
    requirements: ['1-2 years analytics experience or a strong portfolio', 'Advanced SQL', 'Clear written communication'],
    benefits: ['Downtown office', '401k match', 'Commuter benefits'],
  },
  {
    companyIndex: 1,
    title: 'Product Designer (Contract)',
    category: 'Design',
    employmentType: 'contract',
    workMode: 'remote',
    experienceLevel: 'mid',
    location: 'Remote',
    salary: { min: 60, max: 90, currency: 'USD', period: 'hourly' },
    skills: ['Figma', 'Design Systems', 'Prototyping', 'User Research'],
    description:
      'A six-month contract to redesign our onboarding and first-run experience. You will work directly with the head of product and ship into a live product.',
    responsibilities: ['Run discovery interviews', 'Produce flows and high-fidelity prototypes', 'Hand off specs to engineering'],
    requirements: ['Strong portfolio of shipped product work', 'Comfortable working with engineers directly'],
    benefits: ['Remote', 'Flexible hours', 'Contract-to-hire potential'],
  },
  {
    companyIndex: 2,
    title: 'Registered Nurse — Outpatient',
    category: 'Healthcare',
    employmentType: 'full-time',
    workMode: 'onsite',
    experienceLevel: 'mid',
    location: 'Boston, MA',
    salary: { min: 85000, max: 110000, currency: 'USD', period: 'yearly' },
    skills: ['Patient Care', 'Triage', 'EMR', 'BLS Certification'],
    description:
      'Deliver compassionate outpatient care in a clinic that keeps caseloads manageable. Four-day schedules available.',
    responsibilities: ['Assess and triage patients', 'Administer treatments and medications', 'Maintain accurate EMR records'],
    requirements: ['Active RN license in MA', 'BLS certification', '2+ years clinical experience'],
    benefits: ['Four-day week', 'Tuition reimbursement', 'Generous PTO'],
  },
  {
    companyIndex: 2,
    title: 'Marketing Manager',
    category: 'Marketing',
    employmentType: 'full-time',
    workMode: 'hybrid',
    experienceLevel: 'senior',
    location: 'Boston, MA',
    salary: { min: 95000, max: 130000, currency: 'USD', period: 'yearly' },
    skills: ['Content Strategy', 'SEO', 'Lifecycle Marketing', 'Analytics'],
    description:
      'Own our growth marketing across content, lifecycle, and paid. You will report to the VP of Marketing and manage one coordinator.',
    responsibilities: ['Build the quarterly content plan', 'Own lifecycle campaigns end to end', 'Report on channel performance'],
    requirements: ['5+ years in B2C or healthcare marketing', 'Hands-on with analytics tooling', 'Experience managing one direct report'],
    benefits: ['Hybrid', 'Health & dental', 'Wellness stipend'],
  },
  {
    companyIndex: 0,
    title: 'Software Engineering Intern',
    category: 'Engineering',
    employmentType: 'internship',
    workMode: 'remote',
    experienceLevel: 'internship',
    location: 'Remote (US)',
    salary: { min: 30, max: 45, currency: 'USD', period: 'hourly' },
    skills: ['JavaScript', 'React', 'Git', 'Node.js'],
    description:
      'A 12-week paid internship on the platform team. You will ship real features with a dedicated mentor and present your work at the end of the program.',
    responsibilities: ['Build features alongside your mentor', 'Write tests for what you ship', 'Present a demo at program end'],
    requirements: ['Currently pursuing a CS or related degree', 'Familiarity with JavaScript', 'Curiosity and follow-through'],
    benefits: ['Paid internship', 'Mentorship', 'Return-offer potential'],
    openings: 3,
  },
  {
    companyIndex: 1,
    title: 'Customer Support Specialist',
    category: 'Customer Support',
    employmentType: 'part-time',
    workMode: 'remote',
    experienceLevel: 'entry',
    location: 'Remote',
    salary: { min: 25, max: 32, currency: 'USD', period: 'hourly' },
    skills: ['Zendesk', 'Communication', 'Troubleshooting'],
    description:
      'Be the first human our customers talk to. We are looking for someone patient, precise, and genuinely interested in solving problems.',
    responsibilities: ['Answer customer tickets within SLA', 'Maintain the help centre', 'Escalate bugs with clear repro steps'],
    requirements: ['Excellent written English', 'Comfortable with support tooling', 'Available 20 hours per week'],
    benefits: ['Fully remote', 'Flexible shifts'],
  },
];

const jobseekers = [
  {
    name: 'Ade Okonkwo',
    email: 'ade@example.com',
    headline: 'Frontend Engineer · React & TypeScript',
    location: 'Remote, US',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js'],
    bio: 'Product-minded frontend engineer with four years building design systems and dashboards. I care about accessibility and performance budgets.',
  },
  {
    name: 'Priya Raman',
    email: 'priya@example.com',
    headline: 'Data Analyst · SQL & Experimentation',
    location: 'Austin, TX',
    skills: ['SQL', 'Python', 'dbt', 'Experimentation'],
    bio: 'Analyst who likes ambiguous questions. Previously built reporting for a logistics marketplace.',
  },
  {
    name: 'Marco Silva',
    email: 'marco@example.com',
    headline: 'Backend Engineer · Node.js',
    location: 'Lisbon, Portugal',
    skills: ['Node.js', 'MongoDB', 'Docker', 'AWS'],
    bio: 'Backend engineer focused on API design, observability, and boring reliable systems.',
  },
  {
    name: 'Sofia Chen',
    email: 'sofia@example.com',
    headline: 'Product Designer',
    location: 'Remote',
    skills: ['Figma', 'Design Systems', 'User Research'],
    bio: 'Designer who prototypes in code when it helps the team move faster.',
  },
];

const PLACEHOLDER_RESUME = {
  url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
  filename: 'resume.pdf',
};

async function seed() {
  await connectDB();
  console.log('🌱 Seeding database...');

  await Promise.all([User.deleteMany({}), Company.deleteMany({}), Job.deleteMany({}), Application.deleteMany({})]);

  // --- Users -----------------------------------------------------------------
  const admin = await User.create({
    name: 'Platform Admin',
    email: env.adminEmail,
    password: PASSWORD,
    role: 'admin',
    headline: 'Job Portal administrator',
  });

  const employerUsers = [];
  for (let i = 0; i < companies.length; i += 1) {
    const owner = await User.create({
      name: ['Dana Whitfield', 'Ravi Patel', 'Elena Moreau'][i],
      email: `employer${i + 1}@example.com`,
      password: PASSWORD,
      role: 'employer',
      headline: `Head of Talent at ${companies[i].name}`,
    });
    employerUsers.push(owner);
  }

  const seekers = [];
  for (const seeker of jobseekers) {
    // eslint-disable-next-line no-await-in-loop
    const user = await User.create({
      ...seeker,
      email: seeker.email,
      password: PASSWORD,
      role: 'jobseeker',
      resume: PLACEHOLDER_RESUME,
    });
    seekers.push(user);
  }

  // --- Companies -------------------------------------------------------------
  const companyDocs = [];
  for (let i = 0; i < companies.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const company = await Company.create({ ...companies[i], owner: employerUsers[i]._id, isVerified: true });
    // eslint-disable-next-line no-await-in-loop
    await User.updateOne({ _id: employerUsers[i]._id }, { company: company._id });
    companyDocs.push(company);
  }

  // --- Jobs ------------------------------------------------------------------
  const jobDocs = [];
  for (const [index, seedJob] of jobSeed.entries()) {
    const { companyIndex, ...rest } = seedJob;
    const company = companyDocs[companyIndex];
    const owner = employerUsers[companyIndex];

    // eslint-disable-next-line no-await-in-loop
    const job = await Job.create({
      ...rest,
      company: company._id,
      postedBy: owner._id,
      status: 'open',
      // Spread postings over the last few weeks so "recent" sorting looks real.
      publishedAt: new Date(Date.now() - index * 3 * 24 * 60 * 60 * 1000),
    });
    jobDocs.push(job);
  }

  // --- Applications ----------------------------------------------------------
  const applicationPlan = [
    { seeker: 0, job: 0, status: 'shortlisted' },
    { seeker: 0, job: 6, status: 'reviewed' },
    { seeker: 1, job: 2, status: 'interview' },
    { seeker: 2, job: 1, status: 'pending' },
    { seeker: 2, job: 6, status: 'rejected' },
    { seeker: 3, job: 3, status: 'pending' },
  ];

  for (const plan of applicationPlan) {
    const job = jobDocs[plan.job];
    const applicant = seekers[plan.seeker];
    // eslint-disable-next-line no-await-in-loop
    await Application.create({
      job: job._id,
      applicant: applicant._id,
      employer: job.postedBy,
      resume: PLACEHOLDER_RESUME,
      coverLetter:
        'I am excited about this role and believe my background lines up well with what the team is building. I would welcome the chance to talk through how I can contribute.',
      status: plan.status,
      timeline: [{ status: plan.status, note: `Seeded as ${plan.status}` }],
    });
    // eslint-disable-next-line no-await-in-loop
    await Job.updateOne({ _id: job._id }, { $inc: { applicationCount: 1, views: 20 + plan.job * 7 } });
  }

  // Give the demo seeker a couple of saved jobs.
  await User.updateOne({ _id: seekers[0]._id }, { savedJobs: [jobDocs[1]._id, jobDocs[5]._id] });
  await User.updateOne({ _id: seekers[1]._id }, { savedJobs: [jobDocs[0]._id] });

  console.log('\n✅ Seed complete\n');
  console.log('Demo accounts (all use the same password):');
  console.log(`  password       Password123!`);
  console.log(`  admin          ${admin.email}`);
  console.log('  employer       employer1@example.com  (Nimbus Technologies)');
  console.log('  employer       employer2@example.com  (Vertex Analytics)');
  console.log('  jobseeker      ade@example.com');
  console.log('  jobseeker      priya@example.com');
  console.log(`\n  ${companyDocs.length} companies · ${jobDocs.length} jobs · ${applicationPlan.length} applications\n`);
}

async function destroy() {
  await connectDB();
  await Promise.all([User.deleteMany({}), Company.deleteMany({}), Job.deleteMany({}), Application.deleteMany({})]);
  console.log('🗑️  All collections cleared.');
}

(async () => {
  try {
    if (process.argv.includes('--destroy')) {
      await destroy();
    } else {
      await seed();
    }
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await disconnectDB();
    process.exit(1);
  }
})();
