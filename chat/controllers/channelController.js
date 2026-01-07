import express from 'express'
import { formatChannel, getChannels, saveChannel } from '../services/channelService.js';

const channelController = express.Router();

channelController.get('/', async (req, res) => {
  const channels = await getChannels();
  res.json(channels);
});

channelController.post('/', async (req, res) => {
  const channel = await saveChannel(req.body.name, req.body.gardenId); 
  res.json(formatChannel(channel));
});

export default channelController;
