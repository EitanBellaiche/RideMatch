const express = require('express');
const router = express.Router();
const { getTripDetails, getPastTrips } = require('../controllers/tripController');

router.get('/trip-details', getTripDetails);
router.get('/past-trips', getPastTrips);

module.exports = router;
