const express = require('express');
const router = express.Router();

const adminRoutes = require('./admin');
const authRoutes = require('./auth');
const pageRoutes = require('./pages');

router.use('/admin', adminRoutes);
router.use('/', authRoutes);
router.use('/', pageRoutes);

module.exports = router;
