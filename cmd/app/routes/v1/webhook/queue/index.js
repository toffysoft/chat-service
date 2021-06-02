const express = require('express');

const queueController = require('../../../../../../controller/queue.controller');
const queueValidation = require('../../../../../../validations/queue.validation');

const router = express.Router();

router.post('/', queueValidation.webhookQueueValidate, queueController.queue);

module.exports = router;
