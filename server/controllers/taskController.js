const tasksController = require('express').Router();
const taskService = require('../services/taskService');

tasksController.get('/', async (req, res) => {
    try {
        const { sectionId } = req.query;
        const tasks = await taskService.getTask(sectionId);
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

tasksController.post('/', async (req, res) => {
    try {
        const newItem = await taskService.createTask(req.body);
        res.status(201).json(newItem);
    
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

tasksController.put('/:id', async (req, res) => {
    try {
        const updatedItem = await taskService.updateTask(req.params.id, req.body);
        res.status(200).json(updatedItem);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

tasksController.delete('/:id', async (req, res) => {
    try {
        await taskService.deleteTask(req.params.id); 
        res.status(204).end();

    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

tasksController.put ('/:id/toggle', async(req, res) => {
    try {
        const updatedCheckBox = await taskService.toggleCheckBox(req.params.id);
        res.status(200).json(updatedCheckBox);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

module.exports = tasksController;
