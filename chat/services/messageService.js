import { WebSocket } from 'ws';
import Message from '../models/Message.js';

export function formatMessage(username, text, userId, messageId, channelId, channelName) {
  return {
    type: 'text',
    payload: {
      _id: messageId,
      content: text,
      channelId: channelId,
      channelName: channelName,
      author: {
        _id: userId,
        username: username
      },
      timestamp: new Date().toISOString()
    }
  };
}

export function broadcastMessage(wss, sender, message) {
  // Create the standard message object
  const messageObj = formatMessage(sender.username, message.content, sender._id, message._id, message.channel._id, message.channel.name);
  const jsonMessage = JSON.stringify(messageObj);

  // Broadcast to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonMessage);
    }
  });
}

export function broadcastActivity(wss, ws, channelId) {
  wss.clients.forEach((client) => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'activity', channelId: channelId, payload: ws.user.username }))
    }
  });
}

export async function saveMessage(senderId, senderUsername, message) {
  return await Message.create({
    author: {
      _id: senderId,
      username: senderUsername
    },
    content: message.content,
    channel: message.channelId
  }).then(doc => doc.populate('channel'));
}

export async function getMessagesByChannelId(channelId) {
  return await Message.find({ channelId: channelId });
}

export async function getFormattedMessages() {
  const messages = await getMessages();
  return messages.map(message => formatMessage(message.author.username, message.content, message.author._id, message._id, message.channel._id, message.channel.name));
}

export async function getMessages() {
  return await Message.find({}).populate(['author', 'channel']);
}
