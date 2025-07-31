const express = require('express');
const router = express.Router();
const { getNavigationLink } = require('../controllers/navigationController');

router.get('/navigation-link', getNavigationLink);

module.exports = router;
