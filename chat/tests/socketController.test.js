import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'JWT-SECRET-TOKEN';

// 1. Create mock functions matching the service export names
const mockGetFormattedMessagesByGardenId = jest.fn(); 
const mockGetFormattedChannelsByGardenId = jest.fn(); 
const mockSaveMessage = jest.fn();
const mockEditMessage = jest.fn();
const mockDeleteMessage = jest.fn();
const mockBroadcastMessage = jest.fn();
const mockBroadcastEditedMessage = jest.fn();
const mockBroadcastDeletedMessage = jest.fn();
const mockBroadcastActivity = jest.fn();

// 2. Setup unstable_mockModule with exact export keys
jest.unstable_mockModule('../services/messageService.js', () => ({
  getFormattedMessagesByGardenId: mockGetFormattedMessagesByGardenId,
  saveMessage: mockSaveMessage,
  editMessage: mockEditMessage,
  deleteMessage: mockDeleteMessage,
  broadcastMessage: mockBroadcastMessage,
  broadcastEditedMessage: mockBroadcastEditedMessage,
  broadcastDeletedMessage: mockBroadcastDeletedMessage,
  broadcastActivity: mockBroadcastActivity
}));

jest.unstable_mockModule('../services/channelService.js', () => ({
  getFormattedChannelsByGardenId: mockGetFormattedChannelsByGardenId
}));

// 3. Import the controller AFTER the mocks are defined
const { handleConnection } = await import('../controllers/socketController.js');

// Helper to create mock WebSocket
function createMockWs() {
  const messageHandlers = [];
  const closeHandlers = [];
  
  return {
    send: jest.fn(),
    close: jest.fn(),
    on: jest.fn((event, handler) => {
      if (event === 'message') messageHandlers.push(handler);
      if (event === 'close') closeHandlers.push(handler);
    }),
    user: null,
    id: null,
    _triggerMessage: (msg) => messageHandlers.forEach(h => h(msg)),
    _triggerClose: () => closeHandlers.forEach(h => h())
  };
}

// Helper to create mock WSS
function createMockWss() {
  return {
    clients: []
  };
}

// Helper to create valid token
function createValidToken(user = { _id: 'user123', username: 'testuser' }) {
  return jwt.sign(user, JWT_SECRET);
}

describe('Socket Controller', () => {
  let mockWs;
  let mockWss;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWs = createMockWs();
    mockWss = createMockWss();

    // Default mock implementations
    mockGetFormattedMessagesByGardenId.mockResolvedValue([]);
    mockGetFormattedChannelsByGardenId.mockResolvedValue([]);
  });

  describe('Authentication', () => {
    it('should close connection when no auth token provided', async () => {
      const req = { headers: { cookie: '' } };
      await handleConnection(mockWss, mockWs, req);
      expect(mockWs.close).toHaveBeenCalledWith(1008, 'Authentication required');
    });

    it('should authenticate with valid token', async () => {
      const token = createValidToken();
      const req = { headers: { cookie: `auth-token=${token}` } };

      await handleConnection(mockWss, mockWs, req);

      expect(mockWs.close).not.toHaveBeenCalled();
      expect(mockWs.user).toBeDefined();
      expect(mockWs.user.username).toBe('testuser');
      expect(mockWs.id).toBe('user123');
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      const token = createValidToken();
      const req = { headers: { cookie: `auth-token=${token}` } };
      await handleConnection(mockWss, mockWs, req);
    });

    it('should handle new message', async () => {
      const savedMessage = { _id: 'msg1', content: 'Hello' };
      mockSaveMessage.mockResolvedValue(savedMessage);

      const messageData = {
        type: 'message',
        content: 'Hello',
        channelId: 'ch123',
        avatarColor: '#FF5733'
      };

      await mockWs._triggerMessage(JSON.stringify(messageData));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSaveMessage).toHaveBeenCalledWith(
        'user123',
        'testuser',
        messageData
      );
      expect(mockBroadcastMessage).toHaveBeenCalledWith(
        mockWss,
        expect.objectContaining({ username: 'testuser' }),
        savedMessage
      );
    });

    it('should handle edit message', async () => {
      const editedMessage = { _id: 'msg1', content: 'Updated' };
      mockEditMessage.mockResolvedValue(editedMessage);

      const editData = {
        type: 'editMessage',
        messageId: 'msg1',
        newContent: 'Updated'
      };

      await mockWs._triggerMessage(JSON.stringify(editData));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockEditMessage).toHaveBeenCalledWith('msg1', 'Updated', 'user123');
      expect(mockBroadcastEditedMessage).toHaveBeenCalledWith(mockWss, editedMessage);
    });

    it('should handle delete message', async () => {
      const deletedMessage = { _id: 'msg1' };
      mockDeleteMessage.mockResolvedValue(deletedMessage);

      const deleteData = {
        type: 'deleteMessage',
        messageId: 'msg1'
      };

      await mockWs._triggerMessage(JSON.stringify(deleteData));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockDeleteMessage).toHaveBeenCalledWith('msg1', 'user123');
      expect(mockBroadcastDeletedMessage).toHaveBeenCalledWith(mockWss, deletedMessage);
    });

    it('should handle activity broadcast', async () => {
      const activityData = {
        type: 'activity',
        channelId: 'ch123',
        avatarColor: '#FF5733'
      };

      await mockWs._triggerMessage(JSON.stringify(activityData));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockBroadcastActivity).toHaveBeenCalledWith(
        mockWss,
        mockWs,
        'ch123',
        '#FF5733'
      );
    });
  });

  describe('Connection Lifecycle', () => {
    it('should register close and message handlers', async () => {
      const token = createValidToken();
      const req = { headers: { cookie: `auth-token=${token}` } };

      await handleConnection(mockWss, mockWs, req);

      expect(mockWs.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });
});