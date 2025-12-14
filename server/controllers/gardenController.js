const gardenController = require('express').Router();
const { createGarden, getAllGardens, getGardensByUserId, getGardenById, joinGarden, joinGardenByCode, leaveGarden, updateGarden, deleteGarden } = require('../services/gardenService');
const { parseError } = require('../util/parser');

/**
 * @swagger
 * /gardens:
 *   get:
 *     summary: Get all gardens
 *     tags:
 *       - Gardens
 *     responses:
 *       200:
 *         description: List of gardens
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   owner:
 *                     type: object
 *                   members:
 *                     type: array
 *                   maxMembers:
 *                     type: number
 *                   createdAt:
 *                     type: string
 */
gardenController.get('/', async (req, res) => {
    try {
        const gardens = await getAllGardens();
        res.status(200).json(gardens.map(g => g.toObject()));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /gardens/user:
 *   get:
 *     summary: Get gardens for current user
 *     tags:
 *       - Gardens
 *     responses:
 *       200:
 *         description: List of user's gardens
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   owner:
 *                     type: object
 *                   members:
 *                     type: array
 *                   maxMembers:
 *                     type: number
 *                   createdAt:
 *                     type: string
 */
gardenController.get('/user', async (req, res) => {
    try {
        const gardens = await getGardensByUserId(req.user._id);
        res.status(200).json(gardens.map(g => g.toObject()));
    } catch (error) {
        console.log("ERROR:", error)
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /gardens/{id}:
 *   get:
 *     summary: Get garden by ID
 *     tags:
 *       - Gardens
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Garden ID
 *     responses:
 *       200:
 *         description: Garden data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 owner:
 *                   type: object
 *                 members:
 *                   type: array
 *                 maxMembers:
 *                   type: number
 *                 createdAt:
 *                   type: string
 *       404:
 *         description: Garden not found
 */
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

/**
 * @swagger
 * /gardens:
 *   post:
 *     summary: Create a new garden
 *     tags:
 *       - Gardens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               maxMembers:
 *                 type: number
 *     responses:
 *       201:
 *         description: Garden created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 owner:
 *                   type: object
 *                 members:
 *                   type: array
 *                 maxMembers:
 *                   type: number
 *                 createdAt:
 *                   type: string
 *       400:
 *         description: Bad request
 */
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

/**
 * @swagger
 * /gardens/{id}:
 *   put:
 *     summary: Update a garden
 *     tags:
 *       - Gardens
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Garden ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               maxMembers:
 *                 type: number
 *     responses:
 *       200:
 *         description: Garden updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 owner:
 *                   type: object
 *                 members:
 *                   type: array
 *                 maxMembers:
 *                   type: number
 *                 createdAt:
 *                   type: string
 *       403:
 *         description: Forbidden - only owner can update
 *       404:
 *         description: Garden not found
 */
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

/**
 * @swagger
 * /gardens/{id}:
 *   delete:
 *     summary: Delete a garden
 *     tags:
 *       - Gardens
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Garden ID
 *     responses:
 *       204:
 *         description: Garden deleted
 *       403:
 *         description: Forbidden - only owner can delete
 *       404:
 *         description: Garden not found
 */
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

/**
 * @swagger
 * /gardens/{id}/join:
 *   post:
 *     summary: Join a garden
 *     tags:
 *       - Gardens
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Garden ID
 *     responses:
 *       200:
 *         description: Joined garden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 owner:
 *                   type: object
 *                 members:
 *                   type: array
 *                 maxMembers:
 *                   type: number
 *                 createdAt:
 *                   type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: Garden not found
 */
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

/**
 * @swagger
 * /gardens/{id}/leave:
 *   post:
 *     summary: Leave a garden
 *     tags:
 *       - Gardens
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Garden ID
 *     responses:
 *       200:
 *         description: Left garden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 owner:
 *                   type: object
 *                 members:
 *                   type: array
 *                 maxMembers:
 *                   type: number
 *                 createdAt:
 *                   type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: Garden not found
 */
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

/**
 * @swagger
 * /gardens/join:
 *   post:
 *     summary: Join a garden by code
 *     tags:
 *       - Gardens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - joinCode
 *             properties:
 *               joinCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Joined garden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 owner:
 *                   type: object
 *                 members:
 *                   type: array
 *                 maxMembers:
 *                   type: number
 *                 createdAt:
 *                   type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: Garden not found
 */
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
