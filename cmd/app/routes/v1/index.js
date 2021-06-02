const express = require('express');

const backOfficeRoutes = require('./backoffice');
const appRoutes = require('./app');
const webhookRoutes = require('./webhook');

const router = express.Router();

router.use('/back_office', backOfficeRoutes);
router.use('/webhook', webhookRoutes);
router.use('/', appRoutes);

module.exports = router;
