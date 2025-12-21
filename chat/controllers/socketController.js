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
  
  const messages = await getMessages();
  console.log(messages);
  messages.forEach((message) => {
    const messageObj = formatMessage(message.senderUsername, message.content, message.senderId);
    const jsonMessage = JSON.stringify(messageObj);

    ws.send(jsonMessage);
  })

  console.log(`User connected: ${ws.user.username}`);

  ws.on('message', async (message) => {
    try {
      const parsed = JSON.parse(message);
      await saveMessage(ws.id, ws.user.username, parsed.message);
      broadcastMessage(wss, ws.user, parsed.message);
    } catch (error) {
      console.error('Failed to process message', error);
    }
  });

  // 4. Handle Disconnect
  ws.on('close', () => {
    console.log(`User disconnected: ${ws.user.username}`);
  });
}
