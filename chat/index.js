import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { handleConnection } from './controllers/socketController.js';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3033;
const server = app.listen(PORT, () => {
  console.log(`Chat microservice running on http://localhost:${PORT}`);
});


const wss = new WebSocketServer({server});

function initDatabase(){
    const dbUri = process.env.MONGO_URI || "mongodb://localhost:27017/juicy-forest";
    return mongoose.connect(dbUri);
}

initDatabase();

// Delegate connection handling to the controller
wss.on('connection', async (ws, req) => await handleConnection(wss, ws, req));
