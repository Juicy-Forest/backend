import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { handleConnection } from './controllers/socketController.js';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3033;

const wss = new WebSocketServer({ server });

// Delegate connection handling to the controller
wss.on('connection', (ws, req) => handleConnection(wss, ws, req));

server.listen(PORT, () => {
  console.log(`Chat microservice running on http://localhost:${PORT}`);
});

