import express from 'express';
import { createServer } from 'http'
import { WebSocketServer } from 'ws';
require('dotenv').config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3033;

const wss = new WebSocketServer({ server });

wss.on('connection', function connection(ws, req) {
  ws.on('error', console.error);

  ws.id = Date.now();
  //ws.verifiedUserId = req.userId;

  const welcomeMessage = JSON.stringify({
    type: 'id_assignment',
    clientId: ws.id,
    message: `Welcome! Your ID is ${ws.id}`
  });

  ws.send(welcomeMessage);

  ws.on('message', function message(load) {
    const data = JSON.parse(load);
    const text = `user_${data.id}: ${data.message}`;
    const response = JSON.stringify({
      type: 'text',
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

