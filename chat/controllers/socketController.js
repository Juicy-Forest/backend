import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { broadcastMessage, formatMessage, getMessages, saveMessage } from '../services/messageService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'JWT-SECRET-TOKEN';

export async function handleConnection(wss, ws, req) {
  // 1. Authentication
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies['auth-token'];

  if (!token) {
    ws.close(1008, 'Authentication required');
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    ws.user = decoded; // Attach user to socket
    ws.id = decoded._id;
  } catch (err) {
    ws.close(1008, 'Invalid token');
    return;
  }

  let messages = await getMessages();
  messages = messages.map(message => formatMessage(message.senderUsername, message.content, message.senderId, message._id, message.channelId))
  ws.send(JSON.stringify(messages));
  console.log(`User connected: ${ws.user.username}`);

  ws.on('message', async (message) => {
    try {
      const result = JSON.parse(message);
      let savedMessage = await saveMessage(ws.id, ws.user.username, result.content, result.channelId);
      broadcastMessage(wss, ws.user, result.content, savedMessage._id, result.channelId);
    } catch (error) {
      console.error('Failed to process message', error);
    }
  });

  // 4. Handle Disconnect
  ws.on('close', () => {
    console.log(`User disconnected: ${ws.user.username}`);
  });
}
