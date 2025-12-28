import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { broadcastActivity, broadcastEditedMessage, broadcastMessage, editMessage, getFormattedMessages, saveMessage } from '../services/messageService.js';
import { getFormattedChannels } from '../services/channelService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'JWT-SECRET-TOKEN';

export async function handleConnection(wss, ws, req) {
  // Authentication
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

  // Sending chat history to connected client
  let messages = await getFormattedMessages();
  let channels = await getFormattedChannels();
  const initialReqObj = {
    type: 'initialLoad',
    messages: messages,
    channels: channels
  }

  ws.send(JSON.stringify(initialReqObj));
  console.log(`User connected: ${ws.user.username}`);

  ws.on('message', async (message) => {
    try {
      const result = JSON.parse(message);

      if (result.type === 'message') {
        let savedMessage = await saveMessage(ws.id, ws.user.username, result);
        broadcastMessage(wss, ws.user, savedMessage);
      }
      else if (result.type === 'editMessage') {
        const editedMessage = await editMessage(result.messageId, result.newContent, ws.id);
        broadcastEditedMessage(wss, editedMessage);
      }
      else if (result.type === 'activity') {
        broadcastActivity(wss, ws, result.channelId, result.avatarColor);
      }
    } catch (error) {
      console.error('Failed to process message', error);
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    console.log(`User disconnected: ${ws.user.username}`);
  });
}
