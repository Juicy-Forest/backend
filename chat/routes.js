import express from 'express';
const router = express.Router();

import channelController from './controllers/channelController.js';

router.use('/channel', channelController);
    
export default router;
