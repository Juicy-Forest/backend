import express from 'express';
import { createServer } from 'http'
import WebSocket, { WebSocketServer } from 'ws';
import dotenv from 'dotenv'
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3033;
const JWT_SECRET = process.env.JWT_SECRET || 'JWT-SECRET-TOKEN';

const wss = new WebSocketServer({ server });

wss.on('connection', function connection(ws, req) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies['auth-token'];

  if (!token) {
    console.log('No authentication cookie')
    ws.close(1008, 'authentication required')
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    ws.user = decoded;
  } catch (error) {
    ws.close(1008, 'Invalid token');
    return;
  }

  ws.on('error', console.error);

  ws.id = Date.now();

  ws.on('message', function message(load) {
    const data = JSON.parse(load);
    const text = `${data.message}`;
    const response = JSON.stringify({
      username: ws.user.username,
      message: text
    })
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(response);
      }
    })
  });

})

server.listen(PORT, () => {
  console.log(`Chat microservice running on http:/localhost:${PORT}`);
});

