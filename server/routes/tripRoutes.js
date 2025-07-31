const express = require('express');
const router = express.Router();
const { getTripDetails } = require('../controllers/tripController');

router.get('/trip-details', getTripDetails);

module.exports = router;
