const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.put('/:taskId', taskController.updateTask);
router.put('/:taskId/toggle', taskController.toggleTaskStatus);
router.delete('/:taskId', taskController.deleteTask);

module.exports = router;
