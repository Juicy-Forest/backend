import express from 'express';
import sensorController from './controllers/sensorController.js';
const router = express.Router();

router.use('/sensors', sensorController);

export default router;