import { jest } from '@jest/globals';
import { WebSocket } from 'ws';

// Mock Message model
const mockMessageModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn()
};

jest.unstable_mockModule('../models/Message.js', () => ({
    default: mockMessageModel
}));

const {
    formatNewMessage,
    formatMessage,
    broadcastMessage,
    broadcastActivity,
    broadcastEditedMessage,
    broadcastDeletedMessage,
    saveMessage,
    editMessage,
    deleteMessage
} = await import('../services/messageService.js');

describe('Message Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('formatNewMessage', () => {
        it('should format a new message correctly', () => {
            const message = {
                _id: 'msg123',
                content: 'Hello world',
                channel: { _id: 'ch123', name: 'general' },
                author: { avatarColor: '#FF5733' },
                createdAt: new Date('2025-01-06T10:00:00Z')
            };

            const result = formatNewMessage('testuser', 'user123', message);

            expect(result).toEqual({
                type: 'text',
                payload: {
                    _id: 'msg123',
                    content: 'Hello world',
                    channelId: 'ch123',
                    channelName: 'general',
                    author: {
                        _id: 'user123',
                        username: 'testuser',
                        avatarColor: '#FF5733'
                    },
                    timestamp: message.createdAt
                }
            });
        });
    });

    describe('formatMessage', () => {
        it('should format an existing message correctly', () => {
            const message = {
                _id: 'msg123',
                content: 'Hello world',
                channel: { _id: 'ch123', name: 'general' },
                author: {
                    _id: 'user123',
                    username: 'testuser',
                    avatarColor: '#FF5733'
                },
                createdAt: new Date('2025-01-06T10:00:00Z')
            };

            const result = formatMessage(message);

            expect(result.type).toBe('text');
            expect(result.payload._id).toBe('msg123');
            expect(result.payload.author.username).toBe('testuser');
        });
    });

    describe('broadcastMessage', () => {
        it('should broadcast message to all connected clients', () => {
            const mockClients = [
                { readyState: WebSocket.OPEN, send: jest.fn() },
                { readyState: WebSocket.OPEN, send: jest.fn() },
                { readyState: WebSocket.CLOSED, send: jest.fn() }
            ];

            const mockWss = {
                clients: mockClients
            };

            const sender = { username: 'testuser', _id: 'user123' };
            const message = {
                _id: 'msg123',
                content: 'Hello',
                channel: { _id: 'ch123', name: 'general' },
                author: { avatarColor: '#FF5733' },
                createdAt: new Date()
            };

            broadcastMessage(mockWss, sender, message);

            // Only OPEN connections should receive the message
            expect(mockClients[0].send).toHaveBeenCalled();
            expect(mockClients[1].send).toHaveBeenCalled();
            expect(mockClients[2].send).not.toHaveBeenCalled();
        });

        it('should send properly formatted JSON', () => {
            const mockClient = { readyState: WebSocket.OPEN, send: jest.fn() };
            const mockWss = { clients: [mockClient] };

            const sender = { username: 'testuser', _id: 'user123' };
            const message = {
                _id: 'msg123',
                content: 'Hello',
                channel: { _id: 'ch123', name: 'general' },
                author: { avatarColor: '#FF5733' },
                createdAt: new Date()
            };

            broadcastMessage(mockWss, sender, message);

            const sentData = JSON.parse(mockClient.send.mock.calls[0][0]);
            expect(sentData.type).toBe('text');
            expect(sentData.payload.content).toBe('Hello');
        });
    });

    describe('broadcastActivity', () => {
        it('should broadcast typing activity to other clients', () => {
            const sender = {
                readyState: WebSocket.OPEN,
                send: jest.fn(),
                user: { username: 'typingUser' }
            };

            const otherClient = { readyState: WebSocket.OPEN, send: jest.fn() };

            const mockWss = { clients: [sender, otherClient] };

            broadcastActivity(mockWss, sender, 'ch123', '#FF5733');

            // Sender should not receive their own activity
            expect(sender.send).not.toHaveBeenCalled();
            // Other clients should receive the activity
            expect(otherClient.send).toHaveBeenCalled();

            const sentData = JSON.parse(otherClient.send.mock.calls[0][0]);
            expect(sentData.type).toBe('activity');
            expect(sentData.channelId).toBe('ch123');
            expect(sentData.payload.username).toBe('typingUser');
        });
    });

    describe('broadcastEditedMessage', () => {
        it('should broadcast edited message to all clients', () => {
            const mockClients = [
                { readyState: WebSocket.OPEN, send: jest.fn() },
                { readyState: WebSocket.OPEN, send: jest.fn() }
            ];

            const mockWss = { clients: mockClients };

            const editedMessage = {
                _id: 'msg123',
                content: 'Updated content',
                updatedAt: new Date()
            };

            broadcastEditedMessage(mockWss, editedMessage);

            mockClients.forEach(client => {
                expect(client.send).toHaveBeenCalled();
                const sentData = JSON.parse(client.send.mock.calls[0][0]);
                expect(sentData.type).toBe('editMessage');
                expect(sentData.payload._id).toBe('msg123');
                expect(sentData.payload.content).toBe('Updated content');
            });
        });
    });

    describe('broadcastDeletedMessage', () => {
        it('should broadcast deleted message ID to all clients', () => {
            const mockClient = { readyState: WebSocket.OPEN, send: jest.fn() };
            const mockWss = { clients: [mockClient] };

            const deletedMessage = { _id: 'msg123' };

            broadcastDeletedMessage(mockWss, deletedMessage);

            const sentData = JSON.parse(mockClient.send.mock.calls[0][0]);
            expect(sentData.type).toBe('deleteMessage');
            expect(sentData.payload._id).toBe('msg123');
        });
    });

    describe('saveMessage', () => {
        it('should create and populate a new message', async () => {
            const populatedMessage = {
                _id: 'msg123',
                content: 'Hello',
                author: { _id: 'user123', username: 'testuser', avatarColor: '#FF5733' },
                channel: { _id: 'ch123', name: 'general' }
            };

            const mockPopulate = jest.fn().mockResolvedValue(populatedMessage);
            mockMessageModel.create.mockResolvedValue({ populate: mockPopulate });

            const messageData = {
                content: 'Hello',
                channelId: 'ch123',
                avatarColor: '#FF5733'
            };

            const result = await saveMessage('user123', 'testuser', messageData);

            expect(mockMessageModel.create).toHaveBeenCalledWith({
                author: {
                    _id: 'user123',
                    username: 'testuser',
                    avatarColor: '#FF5733'
                },
                content: 'Hello',
                channel: 'ch123'
            });
            expect(mockPopulate).toHaveBeenCalledWith('channel');
            expect(result).toEqual(populatedMessage);
        });
    });

    describe('editMessage', () => {
        it('should edit message when user is the author', async () => {
            const mockMessage = {
                _id: 'msg123',
                content: 'Original content',
                author: { _id: { toString: () => 'user123' } },
                save: jest.fn().mockResolvedValue(true)
            };

            mockMessageModel.findById.mockResolvedValue(mockMessage);

            const result = await editMessage('msg123', 'Updated content', 'user123');

            expect(mockMessage.content).toBe('Updated content');
            expect(mockMessage.save).toHaveBeenCalled();
        });

        it('should throw error when message not found', async () => {
            mockMessageModel.findById.mockResolvedValue(null);

            await expect(editMessage('nonexistent', 'content', 'user123'))
                .rejects.toThrow('Message not found');
        });

        it('should throw error when user is not the author', async () => {
            const mockMessage = {
                _id: 'msg123',
                author: { _id: { toString: () => 'differentUser' } }
            };

            mockMessageModel.findById.mockResolvedValue(mockMessage);

            await expect(editMessage('msg123', 'content', 'user123'))
                .rejects.toThrow('Unauthorized: You can only edit your own messages');
        });
    });

    describe('deleteMessage', () => {
        it('should delete message when user is the author', async () => {
            const mockMessage = {
                _id: 'msg123',
                author: { _id: { toString: () => 'user123' } },
                deleteOne: jest.fn().mockResolvedValue(true)
            };

            mockMessageModel.findById.mockResolvedValue(mockMessage);

            const result = await deleteMessage('msg123', 'user123');

            expect(mockMessage.deleteOne).toHaveBeenCalled();
            expect(result).toEqual(mockMessage);
        });

        it('should throw error when message not found', async () => {
            mockMessageModel.findById.mockResolvedValue(null);

            await expect(deleteMessage('nonexistent', 'user123'))
                .rejects.toThrow('Message not found');
        });

        it('should throw error when user is not the author', async () => {
            const mockMessage = {
                _id: 'msg123',
                author: { _id: { toString: () => 'differentUser' } }
            };

            mockMessageModel.findById.mockResolvedValue(mockMessage);

            await expect(deleteMessage('msg123', 'user123'))
                .rejects.toThrow('Unauthorized: You can only delete your own messages');
        });
    });
});

