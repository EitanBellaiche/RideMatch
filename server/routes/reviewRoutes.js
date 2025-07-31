const express = require('express');
const router = express.Router();
const { getPastTrips, submitReview } = require('../controllers/reviewController');

router.get('/past-trips', getPastTrips);
router.post('/submit-review', submitReview);

module.exports = router;
