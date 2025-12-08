const inventoryController = require('express').Router();
const inventoryService = require('../services/inventoryService');

inventoryController.get('/', async (req, res) => {
    try {
        const items = await inventoryService.getItems()
        res.status(200).send(items);
    } catch (error) {
        res.status(500).json({message: error.message})
    }
});

inventoryController.post('/', async (req, res) => {
    try {
        const newItem = await inventoryService.createItem(req.body);
        res.status(201).send(newItem);
    } catch (error) {
        res.status(500).json({message: error.message})
    }
});

inventoryController.put('/:id', async (req, res) => {
    try {
        const updatedItem = await inventoryService.updateItem(req.params.id, req.body);
        res.status(200).send(updatedItem);
    } catch (error) {
        res.status(500).json({message: error.message})
    }
});

inventoryController.delete('/:id', async (req, res) => {
    try {
        await inventoryService.deleteItem(req.params.id);
        res.status(204).end();
    } catch (error) {
        res.status(500).json({message: error.message})
    }
});

module.exports = inventoryController