const request = require('supertest');
const express = require('express');

// Mock the services
jest.mock('../services/gardenService', () => ({
    removeMember: jest.fn(),
    updateGarden: jest.fn(),
    getGardenById: jest.fn(),
    leaveGarden: jest.fn()
}));

jest.mock('../util/parser', () => ({
    parseError: jest.fn((err) => err.message)
}));

const gardenController = require('../controllers/gardenController');
const gardenService = require('../services/gardenService');

function createTestApp() {
    const app = express();
    app.use(express.json());
  
    // Mock auth middleware
    app.use((req, res, next) => {
        req.user = {
            _id: 'user123',
            username: 'testuser',
            email: 'test@example.com'
        };
        next();
    });
  
    app.use('/garden', gardenController);
    return app;
}

describe('Garden Controller - Member Management', () => {
    let app;

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });

    describe('Remove Member from Garden', () => {
        it('should remove a member from garden as owner', async () => {
            const mockUpdatedGarden = {
                _id: 'garden1',
                name: 'Test Garden',
                members: ['user123'],
                owner: 'user123'
            };

            gardenService.removeMember.mockResolvedValue(mockUpdatedGarden);

            const result = await gardenService.removeMember('garden1', 'user456', 'user123');
      
            expect(result).toBeDefined();
            expect(gardenService.removeMember).toHaveBeenCalledWith('garden1', 'user456', 'user123');
        });

        it('should not allow non-owner to remove members', async () => {
            gardenService.removeMember.mockRejectedValue(new Error('Only owner can remove members'));

            await expect(gardenService.removeMember('garden1', 'user456', 'user789'))
                .rejects
                .toThrow('Only owner can remove members');

            expect(gardenService.removeMember).toHaveBeenCalledWith('garden1', 'user456', 'user789');
        });

        it('should throw error if garden not found', async () => {
            gardenService.removeMember.mockRejectedValue(new Error('Garden not found'));

            await expect(gardenService.removeMember('nonexistent', 'user456', 'user123'))
                .rejects
                .toThrow('Garden not found');
        });

        it('should throw error if member not in garden', async () => {
            gardenService.removeMember.mockRejectedValue(new Error('Member not found in garden'));

            await expect(gardenService.removeMember('garden1', 'nonexistent', 'user123'))
                .rejects
                .toThrow('Member not found in garden');
        });
    });

    describe('Update Garden Settings', () => {
        it('should update garden name', async () => {
            const updateData = { name: 'Updated Garden Name' };
            const mockUpdatedGarden = {
                _id: 'garden1',
                name: 'Updated Garden Name',
                description: 'Test garden',
                toObject: jest.fn().mockReturnValue({
                    _id: 'garden1',
                    name: 'Updated Garden Name'
                })
            };

            gardenService.updateGarden.mockResolvedValue(mockUpdatedGarden);

            const response = await request(app)
                .put('/garden/garden1')
                .send(updateData)
                .expect(200);

            expect(gardenService.updateGarden).toHaveBeenCalledWith('garden1', updateData, 'user123');
            expect(response.body.name).toBe('Updated Garden Name');
        });

        it('should update garden description', async () => {
            const updateData = { description: 'Updated description' };
            const mockUpdatedGarden = {
                _id: 'garden1',
                name: 'Test Garden',
                description: 'Updated description',
                toObject: jest.fn().mockReturnValue({
                    _id: 'garden1',
                    description: 'Updated description'
                })
            };

            gardenService.updateGarden.mockResolvedValue(mockUpdatedGarden);

            const response = await request(app)
                .put('/garden/garden1')
                .send(updateData)
                .expect(200);

            expect(gardenService.updateGarden).toHaveBeenCalledWith('garden1', updateData, 'user123');
        });

        it('should return 403 if user is not owner', async () => {
            gardenService.updateGarden.mockRejectedValue(new Error('Only owner can update the garden'));

            const response = await request(app)
                .put('/garden/garden1')
                .send({ name: 'New Name' })
                .expect(403);

            expect(response.body).toHaveProperty('message');
        });

        it('should return 404 if garden not found', async () => {
            gardenService.updateGarden.mockRejectedValue(new Error('Garden not found'));

            const response = await request(app)
                .put('/garden/garden1')
                .send({ name: 'New Name' })
                .expect(404);

            expect(response.body).toHaveProperty('message');
        });
    });

    describe('Leave Garden', () => {
        it('should allow member to leave garden', async () => {
            const mockGarden = {
                _id: 'garden1',
                name: 'Test Garden',
                members: ['user456'],
                owner: 'user456'
            };

            gardenService.leaveGarden.mockResolvedValue(mockGarden);

            const result = await gardenService.leaveGarden('garden1', 'user123');
      
            expect(gardenService.leaveGarden).toHaveBeenCalledWith('garden1', 'user123');
            expect(result).toBeDefined();
        });

        it('should throw error if user is owner', async () => {
            gardenService.leaveGarden.mockRejectedValue(new Error('Owner cannot leave the garden'));

            await expect(gardenService.leaveGarden('garden1', 'user123'))
                .rejects
                .toThrow('Owner cannot leave the garden');
        });

        it('should throw error if not a member', async () => {
            gardenService.leaveGarden.mockRejectedValue(new Error('Not a member of this garden'));

            await expect(gardenService.leaveGarden('garden1', 'user789'))
                .rejects
                .toThrow('Not a member of this garden');
        });

        it('should throw error if garden not found', async () => {
            gardenService.leaveGarden.mockRejectedValue(new Error('Garden not found'));

            await expect(gardenService.leaveGarden('nonexistent', 'user123'))
                .rejects
                .toThrow('Garden not found');
        });
    });
});
