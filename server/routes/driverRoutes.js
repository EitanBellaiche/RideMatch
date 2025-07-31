const express = require('express');
const router = express.Router();
const {
  addDriver,
  getDriversByEvent,
  getDriverTrips,
  getDriverJoinRequests,
  getDriverTripDetails,
  cancelTripByDriver
} = require('../controllers/driverController');

router.post('/add-driver', addDriver);
router.get('/drivers/:eventId', getDriversByEvent);
router.get('/driver-trips', getDriverTrips);
router.get('/driver-requests', getDriverJoinRequests);
router.get('/driver-trip-details', getDriverTripDetails);
router.delete('/cancel-trip-by-driver', cancelTripByDriver);

module.exports = router;
