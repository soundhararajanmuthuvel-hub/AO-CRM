const { Task, Contact, User } = require('../models');

exports.getTasks = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const tasks = await Task.findAll({
      where: { workspaceId },
      include: [
        { model: Contact, attributes: ['id', 'name', 'phone'] },
        { model: User, attributes: ['id', 'name', 'email'] }
      ],
      order: [['dueDate', 'ASC']]
    });
    return res.json(tasks);
  } catch (error) {
    console.error('getTasks error:', error);
    return res.status(500).json({ error: 'Server error retrieving tasks' });
  }
};

exports.createTask = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { title, description, dueDate, contactId, reminderType, assignedTo } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ error: 'Title and due date are required' });
    }

    const task = await Task.create({
      workspaceId,
      title,
      description,
      dueDate,
      contactId: contactId || null,
      reminderType: reminderType || 'CRM Notification',
      assignedTo: assignedTo || null,
      status: 'Pending'
    });

    const populatedTask = await Task.findByPk(task.id, {
      include: [
        { model: Contact, attributes: ['id', 'name', 'phone'] },
        { model: User, attributes: ['id', 'name', 'email'] }
      ]
    });

    return res.json({ success: true, task: populatedTask });
  } catch (error) {
    console.error('createTask error:', error);
    return res.status(500).json({ error: 'Server error creating task' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { taskId } = req.params;
    const { title, description, dueDate, contactId, reminderType, assignedTo, status } = req.body;

    const task = await Task.findOne({ where: { id: taskId, workspaceId } });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await task.update({
      title,
      description,
      dueDate,
      contactId: contactId || null,
      reminderType: reminderType || 'CRM Notification',
      assignedTo: assignedTo || null,
      status
    });

    const populatedTask = await Task.findByPk(task.id, {
      include: [
        { model: Contact, attributes: ['id', 'name', 'phone'] },
        { model: User, attributes: ['id', 'name', 'email'] }
      ]
    });

    return res.json({ success: true, task: populatedTask });
  } catch (error) {
    console.error('updateTask error:', error);
    return res.status(500).json({ error: 'Server error updating task' });
  }
};

exports.toggleTaskStatus = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { taskId } = req.params;
    const { status } = req.body; // 'Pending' or 'Completed'

    const task = await Task.findOne({ where: { id: taskId, workspaceId } });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.status = status;
    await task.save();

    return res.json({ success: true, task });
  } catch (error) {
    console.error('toggleTaskStatus error:', error);
    return res.status(500).json({ error: 'Server error updating task status' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { taskId } = req.params;

    const task = await Task.findOne({ where: { id: taskId, workspaceId } });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await task.destroy();
    return res.json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    console.error('deleteTask error:', error);
    return res.status(500).json({ error: 'Server error deleting task' });
  }
};
