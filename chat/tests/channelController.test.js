import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// Mock the channel service
const mockChannels = [
    { _id: '507f1f77bcf86cd799439011', name: 'general', gardenId: '507f1f77bcf86cd799439001' },
    { _id: '507f1f77bcf86cd799439012', name: 'random', gardenId: '507f1f77bcf86cd799439001' }
];

const mockChannelService = {
    getChannels: jest.fn(),
    saveChannel: jest.fn(),
    formatChannel: jest.fn((channel) => ({
        _id: channel._id,
        name: channel.name
    }))
};

// Mock the module before importing
jest.unstable_mockModule('../services/channelService.js', () => mockChannelService);

// Import the controller after mocking
const channelController = (await import('../controllers/channelController.js')).default;

function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use('/channel', channelController);
    return app;
}

describe('Channel Controller', () => {
    let app;

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });

    describe('GET /channel', () => {
        it('should return all channels', async () => {
            mockChannelService.getChannels.mockResolvedValue(mockChannels);

            const response = await request(app)
                .get('/channel')
                .expect(200);

            expect(response.body).toEqual(mockChannels);
            expect(mockChannelService.getChannels).toHaveBeenCalledTimes(1);
        });

        it('should return empty array when no channels exist', async () => {
            mockChannelService.getChannels.mockResolvedValue([]);

            const response = await request(app)
                .get('/channel')
                .expect(200);

            expect(response.body).toEqual([]);
        });

        it('should handle service errors gracefully', async () => {
            mockChannelService.getChannels.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/channel')
                .expect(500);
        });
    });

    describe('POST /channel', () => {
        const newChannel = {
            name: 'announcements',
            gardenId: '507f1f77bcf86cd799439001'
        };

        const savedChannel = {
            _id: '507f1f77bcf86cd799439013',
            name: 'announcements',
            gardenId: '507f1f77bcf86cd799439001'
        };

        it('should create a new channel', async () => {
            mockChannelService.saveChannel.mockResolvedValue(savedChannel);

            const response = await request(app)
                .post('/channel')
                .send(newChannel)
                .expect(200);

            expect(response.body).toEqual({
                _id: savedChannel._id,
                name: savedChannel.name
            });
            expect(mockChannelService.saveChannel).toHaveBeenCalledWith(newChannel.name, newChannel.gardenId);
        });

        it('should handle channel creation with valid data', async () => {
            mockChannelService.saveChannel.mockResolvedValue(savedChannel);

            const response = await request(app)
                .post('/channel')
                .send({ name: 'test-channel', gardenId: '507f1f77bcf86cd799439001' })
                .set('Content-Type', 'application/json')
                .expect(200);

            expect(mockChannelService.saveChannel).toHaveBeenCalled();
        });

        it('should handle duplicate channel names gracefully', async () => {
            mockChannelService.saveChannel.mockRejectedValue(
                new Error('Duplicate key error')
            );

            const response = await request(app)
                .post('/channel')
                .send(newChannel)
                .expect(500);
        });
    });
});

