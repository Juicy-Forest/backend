import { WebSocket } from 'ws';
import Message from '../models/Message.js';

export function formatNewMessage(username, userId, message) {
  return {
    type: 'text',
    payload: {
      _id: message._id,
      content: message.content,
      channelId: message.channel._id,
      channelName: message.channel.name,
      author: {
        _id: userId,
        username: username,
        avatarColor: message.author.avatarColor,
      },
      timestamp: message.createdAt 
    }
  };
}

export function formatMessage(message) {
  return {
    type: 'text',
    payload: {
      _id: message._id,
      content: message.content,
      channelId: message.channel._id,
      channelName: message.channel.name,
      author: {
        _id: message.author._id,
        username: message.author.username,
        avatarColor: message.author.avatarColor,
      },
      timestamp: message.createdAt 
    }
  };
}

export function broadcastMessage(wss, sender, message) {
  // Create the standard message object
  const messageObj = formatNewMessage(sender.username, sender._id, message);
  const jsonMessage = JSON.stringify(messageObj);

  // Broadcast to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonMessage);
    }
  });
}

export function broadcastActivity(wss, ws, channelId, avatarColor) {
  wss.clients.forEach((client) => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'activity', channelId: channelId, payload: {username: ws.user.username, avatarColor: avatarColor} }))
    }
  });
}

export function broadcastEditedMessage(wss, message) {
  const editPayload = {
    type: 'editMessage',
    payload: {
      _id: message._id,
      content: message.content,
      timestamp: message.updatedAt,
    }
  };
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(editPayload));
    }
  });
}

export async function saveMessage(senderId, senderUsername, message) {
  return await Message.create({
    author: {
      _id: senderId,
      username: senderUsername,
      avatarColor: message.avatarColor,
    },
    content: message.content,
    channel: message.channelId
  }).then(doc => doc.populate('channel'));
}

export async function editMessage(messageId, newContent, userId){
  const message = await Message.findById(messageId); 

  if(!message){
    throw new Error('Message not found');
  };

  if(message.author._id.toString() !== userId){
    throw new Error('Unauthorized: You can only edit your own messages');
  };

  message.content = newContent;
  await message.save();

  return message;
};

export async function getMessagesByChannelId(channelId) {
  return await Message.find({ channelId: channelId });
}

export async function getFormattedMessages() {
  const messages = await getMessages();
  return messages.map(message => formatMessage(message));
}

export async function getMessages() {
  return await Message.find({}).populate('channel');
}
