const Job = require('../models/Job');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// ─── GET /api/jobs ────────────────────────────────────────────────────────────
// Supports: search by company, filter by status, sort by date, pagination
const getJobs = catchAsync(async (req, res) => {
  const { search, status, sort = '-appliedDate', page = 1, limit = 10 } = req.query;

  // Base filter — always scope to the logged-in user
  const filter = { user: req.user._id };

  // Optional: filter by status
  if (status && status !== 'All') filter.status = status;

  // Optional: search company name (case-insensitive regex)
  if (search) filter.company = { $regex: search, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort(sort).skip(skip).limit(Number(limit)),
    Job.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: jobs.length,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    },
    data: { jobs },
  });
});

// ─── POST /api/jobs ───────────────────────────────────────────────────────────
const createJob = catchAsync(async (req, res) => {
  // Attach user from JWT — prevents users from spoofing other user IDs
  const job = await Job.create({ ...req.body, user: req.user._id });
  res.status(201).json({ status: 'success', data: { job } });
});

// ─── GET /api/jobs/:id ────────────────────────────────────────────────────────
const getJob = catchAsync(async (req, res, next) => {
  // Filter by both _id AND user → user can only fetch their own jobs
  const job = await Job.findOne({ _id: req.params.id, user: req.user._id });
  if (!job) return next(new AppError('Job not found or access denied.', 404));
  res.status(200).json({ status: 'success', data: { job } });
});

// ─── PATCH /api/jobs/:id ──────────────────────────────────────────────────────
const updateJob = catchAsync(async (req, res, next) => {
  const job = await Job.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id }, // ownership check
    req.body,
    {
      new: true,           // return the updated document
      runValidators: true, // re-run schema validators on update
    }
  );
  if (!job) return next(new AppError('Job not found or access denied.', 404));
  res.status(200).json({ status: 'success', data: { job } });
});

// ─── DELETE /api/jobs/:id ─────────────────────────────────────────────────────
const deleteJob = catchAsync(async (req, res, next) => {
  const job = await Job.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!job) return next(new AppError('Job not found or access denied.', 404));
  res.status(204).json({ status: 'success', data: null }); // 204 = No Content
});

// ─── GET /api/jobs/stats ──────────────────────────────────────────────────────
// Returns count per status + monthly breakdown for dashboard
const getStats = catchAsync(async (req, res) => {
  const [statusStats, monthlyStats] = await Promise.all([
    // Group jobs by status and count each
    Job.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Group jobs by year-month and count applications per month
    Job.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: {
            year: { $year: '$appliedDate' },
            month: { $month: '$appliedDate' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }, // Last 12 months
    ]),
  ]);

  const total = statusStats.reduce((acc, s) => acc + s.count, 0);

  res.status(200).json({
    status: 'success',
    data: { total, statusStats, monthlyStats },
  });
});

module.exports = { getJobs, createJob, getJob, updateJob, deleteJob, getStats };
