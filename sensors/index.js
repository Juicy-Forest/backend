import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import router from './routes.js';
import { initDatabase } from './configs/database.js';
import { startListeningOnSerialPort } from './services/sensorService.js';
import webConstants from './web-constants.js';

const app = express();

app.use(cors({ credentials: true, origin: 'http://localhost:5173', allowHeaders: ['Content-Type, X-Authorization'] }));
app.use(express.json());
app.use(router);
initDatabase();

const server = app.listen(webConstants.PORT, () => console.log(`Server listening on http://localhost:${webConstants.PORT}`));

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('user connected');

    ws.on('close', () => {
        console.log('user disconnected');
    });
});

const broadcastSensorData = (data) => {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};

startListeningOnSerialPort(broadcastSensorData);