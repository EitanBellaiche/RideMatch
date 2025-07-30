const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  addEvent,
  joinRide
} = require('../controllers/eventController');

router.get('/events', getAllEvents);
router.post('/add-event', addEvent);
router.post('/join-ride', joinRide);

module.exports = router;
