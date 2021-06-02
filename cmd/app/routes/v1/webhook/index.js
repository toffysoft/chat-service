const express = require('express');
const queueRoutes = require('./queue');
const router = express.Router();
router.get('/', (req, res) => res.status(200).json({ message: 'ok' }));
router.use('/queue', queueRoutes);

module.exports = router;
