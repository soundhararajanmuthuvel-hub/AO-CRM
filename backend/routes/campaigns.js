const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', campaignController.getCampaigns);
router.post('/', campaignController.createCampaign);
router.delete('/:id', campaignController.deleteCampaign);
router.post('/:id/start', campaignController.startCampaign);
router.post('/:id/pause', campaignController.pauseCampaign);
router.post('/:id/resume', campaignController.resumeCampaign);
router.post('/:id/cancel', campaignController.cancelCampaign);

module.exports = router;
