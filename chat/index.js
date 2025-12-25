import express from 'express';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { handleConnection } from './controllers/socketController.js';
import { initDatabase } from './utils/initDatabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3033;
const server = app.listen(PORT, () => {
  console.log(`Chat microservice running on http://localhost:${PORT}`);
});

initDatabase();

const wss = new WebSocketServer({server});

// Delegate connection handling to the controller
wss.on('connection', async (ws, req) => await handleConnection(wss, ws, req));
