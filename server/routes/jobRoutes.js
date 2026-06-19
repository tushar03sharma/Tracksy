const express = require('express');
const { getJobs, createJob, getJob, updateJob, deleteJob, getStats } = require('../controllers/jobController');
const { protect } = require('../middleware/auth');
const { createJobValidation, updateJobValidation, validate } = require('../middleware/validators');

const router = express.Router();

// All job routes require authentication
router.use(protect);

// Stats must be defined BEFORE /:id to avoid Express treating "stats" as an ID
router.get('/stats', getStats);

router
  .route('/')
  .get(getJobs)
  .post(createJobValidation, validate, createJob);

router
  .route('/:id')
  .get(getJob)
  .patch(updateJobValidation, validate, updateJob)
  .delete(deleteJob);

module.exports = router;
