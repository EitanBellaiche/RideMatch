const express = require('express');
const router = express.Router();
const { getPastTrips, submitReview, getReviews } = require('../controllers/reviewController');

router.get('/past-trips', getPastTrips);
router.post('/submit-review', submitReview);
router.get('/reviews', getReviews);

module.exports = router;
