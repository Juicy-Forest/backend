import express from 'express';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { handleConnection } from './controllers/socketController.js';
import { initDatabase } from './utils/initDatabase.js';
import router from './routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3033;

app.get('/', (req, res) => {
    res.json({ status: 'Chat is running' });
});

app.use(express.json());
app.use(router);
initDatabase();

const server = app.listen(PORT, () => {
    console.log(`Chat microservice running on http://localhost:${PORT}`);
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

const wss = new WebSocketServer({ server });

// Delegate connection handling to the controller
wss.on('connection', async (ws, req) => await handleConnection(wss, ws, req));
