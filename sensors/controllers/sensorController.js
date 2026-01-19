import express from 'express';
import { getSensorData } from '../services/sensorService.js';
const sensorController = express.Router();

sensorController.get('/', async (req, res) => {
    try {
        const sensorData = await getSensorData();
        res.status(200).send(sensorData);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default sensorController;
