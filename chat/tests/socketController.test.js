import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'JWT-SECRET-TOKEN';

// Create mock functions
const mockGetFormattedMessages = jest.fn();
const mockGetFormattedChannels = jest.fn();
const mockSaveMessage = jest.fn();
const mockEditMessage = jest.fn();
const mockDeleteMessage = jest.fn();
const mockBroadcastMessage = jest.fn();
const mockBroadcastEditedMessage = jest.fn();
const mockBroadcastDeletedMessage = jest.fn();
const mockBroadcastActivity = jest.fn();

jest.unstable_mockModule('../services/messageService.js', () => ({
  getFormattedMessages: mockGetFormattedMessages,
  saveMessage: mockSaveMessage,
  editMessage: mockEditMessage,
  deleteMessage: mockDeleteMessage,
  broadcastMessage: mockBroadcastMessage,
  broadcastEditedMessage: mockBroadcastEditedMessage,
  broadcastDeletedMessage: mockBroadcastDeletedMessage,
  broadcastActivity: mockBroadcastActivity
}));

jest.unstable_mockModule('../services/channelService.js', () => ({
  getFormattedChannels: mockGetFormattedChannels
}));

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
    mockGetFormattedMessages.mockResolvedValue([]);
    mockGetFormattedChannels.mockResolvedValue([]);
  });

  describe('Authentication', () => {
    it('should close connection when no auth token provided', async () => {
      const req = { headers: { cookie: '' } };

      await handleConnection(mockWss, mockWs, req);

      expect(mockWs.close).toHaveBeenCalledWith(1008, 'Authentication required');
    });

    it('should close connection when no cookies header present', async () => {
      const req = { headers: {} };

      await handleConnection(mockWss, mockWs, req);

      expect(mockWs.close).toHaveBeenCalledWith(1008, 'Authentication required');
    });

    it('should close connection with invalid token', async () => {
      const req = { headers: { cookie: 'auth-token=invalid-token' } };

      await handleConnection(mockWss, mockWs, req);

      expect(mockWs.close).toHaveBeenCalledWith(1008, 'Invalid token');
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

    it('should attach user data to websocket', async () => {
      const token = createValidToken({ _id: 'abc123', username: 'john', role: 'admin' });
      const req = { headers: { cookie: `auth-token=${token}` } };

      await handleConnection(mockWss, mockWs, req);

      expect(mockWs.user.username).toBe('john');
      expect(mockWs.user.role).toBe('admin');
    });
  });

  describe('Initial Load', () => {
    it('should send initial messages and channels on connection', async () => {
      const mockMessages = [
        { type: 'text', payload: { content: 'Hello' } }
      ];
      const mockChannels = [
        { _id: 'ch1', name: 'general' }
      ];

      mockGetFormattedMessages.mockResolvedValue(mockMessages);
      mockGetFormattedChannels.mockResolvedValue(mockChannels);

      const token = createValidToken();
      const req = { headers: { cookie: `auth-token=${token}` } };

      await handleConnection(mockWss, mockWs, req);

      expect(mockWs.send).toHaveBeenCalled();
      const sentData = JSON.parse(mockWs.send.mock.calls[0][0]);
      
      expect(sentData.type).toBe('initialLoad');
      expect(sentData.messages).toEqual(mockMessages);
      expect(sentData.channels).toEqual(mockChannels);
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

      // Wait for async operations
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

    it('should handle malformed JSON gracefully', async () => {
      // This should not throw
      await mockWs._triggerMessage('not valid json {{{');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify no service calls were made
      expect(mockSaveMessage).not.toHaveBeenCalled();
      expect(mockEditMessage).not.toHaveBeenCalled();
    });

    it('should handle unknown message types', async () => {
      const unknownData = {
        type: 'unknownType',
        data: 'something'
      };

      await mockWs._triggerMessage(JSON.stringify(unknownData));
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not call any message services
      expect(mockSaveMessage).not.toHaveBeenCalled();
      expect(mockEditMessage).not.toHaveBeenCalled();
      expect(mockDeleteMessage).not.toHaveBeenCalled();
    });
  });

  describe('Connection Lifecycle', () => {
    it('should register close handler', async () => {
      const token = createValidToken();
      const req = { headers: { cookie: `auth-token=${token}` } };

      await handleConnection(mockWss, mockWs, req);

      expect(mockWs.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should register message handler', async () => {
      const token = createValidToken();
      const req = { headers: { cookie: `auth-token=${token}` } };

      await handleConnection(mockWss, mockWs, req);

      expect(mockWs.on).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });
});

