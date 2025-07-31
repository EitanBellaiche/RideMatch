const express = require('express');
const router = express.Router();
const {
    getPassengerTrips,
    approvePassenger,
    checkRegistration,
    confirmPayment,
    cancelRide,
    getApprovedPassengers
} = require('../controllers/passengerController');

router.get('/passenger-trips', getPassengerTrips);
router.post('/approve-passenger', approvePassenger);
router.get('/check-registration', checkRegistration);
router.post('/confirm-payment', confirmPayment);
router.delete('/cancel-ride', cancelRide);
router.get('/approved-passengers', getApprovedPassengers);

module.exports = router;
