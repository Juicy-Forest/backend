const gardenController = require('express').Router();
const { createGarden, getAllGardens, getGardensByUserId, getGardenById, joinGarden, joinGardenByCode, leaveGarden, updateGarden, deleteGarden } = require('../services/gardenService');
const { parseError } = require('../util/parser');

gardenController.get('/', async (req, res) => {
    try {
        const gardens = await getAllGardens();
        res.status(200).json(gardens.map(g => g.toObject()));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

gardenController.get('/user', async (req, res) => {
    try {
        const gardens = await getGardensByUserId(req.user._id);
        res.status(200).json(gardens.map(g => g.toObject()));
    } catch (error) {
        console.log("ERROR:", error)
        res.status(500).json({ message: error.message });
    }
});

gardenController.get('/:id', async (req, res) => {
    try {
        const garden = await getGardenById(req.params.id);
        if (!garden) {
            return res.status(404).json({ message: 'Garden not found' });
        }
        res.status(200).json(garden.toObject());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

gardenController.post('/', async (req, res) => {
    try {
        const { name, description, location } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }
        if (!location) {
            return res.status(400).json({ message: 'Location is required' });
        }
        // If location is a string, treat as address
        let locationObj = location;
        if (typeof location === 'string') {
            locationObj = { address: location };
        }
        // Initialize grid as default 20x02
        const initGrid = []
        for (let i = 0; i < 400; i++) {
            const tile = {index: i, section: null, plant: ''}
            initGrid.push(tile)
        }
        const garden = await createGarden(
            req.user._id, 
            name, 
            description || '', 
            locationObj, 
            initGrid
        );

        res.status(201).json(garden.toObject());
    } catch (error) {
        console.log(error)
        res.status(400).json({ message: error.message });
    }
});

gardenController.put('/:id', async (req, res) => {
    try {
        // console.log('NEW GRID:', req.body.grid)
        const garden = await updateGarden(req.params.id, req.body, req.user._id);
        res.status(200).json(garden.toObject());
    } catch (error) {
        if (error.message.includes('not found')) {
            res.status(404).json({ message: error.message });
        } else if (error.message.includes('Only owner')) {
            res.status(403).json({ message: error.message });
        } else {
            res.status(400).json({ message: error.message });
        }
    }
});

gardenController.delete('/:id', async (req, res) => {
    try {
        await deleteGarden(req.params.id, req.user._id);
        res.status(204).end();
    } catch (error) {
        if (error.message.includes('not found')) {
            res.status(404).json({ message: error.message });
        } else if (error.message.includes('Only owner')) {
            res.status(403).json({ message: error.message });
        } else {
            res.status(400).json({ message: error.message });
        }
    }
});

gardenController.post('/:id/join', async (req, res) => {
    try {
        const garden = await joinGarden(req.params.id, req.user._id);
        res.status(200).json(garden.toObject());
    } catch (error) {
        if (error.message.includes('not found')) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(400).json({ message: error.message });
        }
    }
});

gardenController.post('/:id/leave', async (req, res) => {
    try {
        const garden = await leaveGarden(req.params.id, req.user._id);
        res.status(200).json(garden.toObject());
    } catch (error) {
        if (error.message.includes('not found')) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(400).json({ message: error.message });
        }
    }
});

gardenController.post('/join', async (req, res) => {
    try {
        const { joinCode } = req.body;
        if (!joinCode) {
            return res.status(400).json({ message: 'Join code is required' });
        }
        const garden = await joinGardenByCode(joinCode, req.user._id);
        res.status(200).json(garden.toObject());
    } catch (error) {
        if (error.message.includes('not found') || error.message.includes('Invalid')) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(400).json({ message: error.message });
        }
    }
});

module.exports = gardenController;
