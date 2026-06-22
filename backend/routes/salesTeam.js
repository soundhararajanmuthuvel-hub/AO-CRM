const express = require('express');
const router = express.Router();
const salesTeamController = require('../controllers/salesTeamController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/territories', salesTeamController.getTerritories);
router.post('/territories', salesTeamController.createTerritory);

router.get('/routes', salesTeamController.getRoutes);
router.post('/routes', salesTeamController.createRoute);

router.get('/visits', salesTeamController.getDailyVisits);
router.post('/visits', salesTeamController.createDailyVisit);
router.put('/visits/:visitId/status', salesTeamController.updateDailyVisitStatus);

router.get('/leaderboard', salesTeamController.getLeaderboard);

module.exports = router;
