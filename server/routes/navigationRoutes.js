const express = require('express');
const router = express.Router();
const { getNavigationLink } = require('../controllers/navigationController');

router.get('/api/navigation-link', getNavigationLink);

module.exports = router;
