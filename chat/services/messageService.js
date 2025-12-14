import { WebSocket } from 'ws';

export function formatMessage(username, text, userId = null) {
  return {
    type: 'text',
    payload: {
      content: text,
      author: {
        _id: userId,
        username: username
      },
      timestamp: new Date().toISOString()
    }
  };
}

export function broadcastMessage(wss, sender, text) {
  // Create the standard message object
  const messageObj = formatMessage(sender.username, text, sender._id);
  const jsonMessage = JSON.stringify(messageObj);

  // Broadcast to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonMessage);
    }
  });
}
