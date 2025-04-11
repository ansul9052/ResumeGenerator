const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');

router.post('/generate', resumeController.generateResume);

module.exports = router; 