/**
 * Trigger Routes
 * POST /api/trigger/:elderId  { status: "NORMAL"|"WARNING"|"DANGER"|"NOT_WEARING" }
 */

const express           = require('express');
const router            = express.Router();
const triggerController = require('../controllers/triggerController');

router.post('/:elderId', triggerController.triggerStatus);

module.exports = router;
