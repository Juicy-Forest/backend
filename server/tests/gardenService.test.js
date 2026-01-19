const gardenService = require('../services/gardenService'); // Adjust path
const Garden = require('../models/Garden');

// Mock the Mongoose model
jest.mock('../models/Garden');

describe('Garden Service', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createGarden', () => {
        it('should create a garden with a unique join code and owner as member', async () => {
            const ownerId = 'user123';
            const gardenData = { name: 'My Garden', description: 'Lovely place' };

            // Mock findOne to return null (meaning the generated code is unique)
            Garden.findOne.mockResolvedValue(null);
            Garden.create.mockImplementation((data) => ({ ...data, _id: 'garden123' }));

            const result = await gardenService.createGarden(ownerId, gardenData.name, gardenData.description);

            expect(Garden.findOne).toHaveBeenCalled();
            expect(Garden.create).toHaveBeenCalledWith(expect.objectContaining({
                name: gardenData.name,
                owner: ownerId,
                members: [ownerId],
                joinCode: expect.any(String)
            }));
            expect(result.joinCode).toHaveLength(9);
        });
    });

    describe('joinGardenByCode', () => {
        it('should add a user to members if code is valid and garden not full', async () => {
            const userId = 'user456';
            const mockGarden = {
                joinCode: 'CODE123',
                members: ['user123'],
                maxMembers: 10,
                save: jest.fn().mockResolvedValue(true)
            };

            Garden.findOne.mockResolvedValue(mockGarden);

            const result = await gardenService.joinGardenByCode('CODE123', userId);

            expect(mockGarden.members).toContain(userId);
            expect(mockGarden.save).toHaveBeenCalled();
            expect(result).toBe(mockGarden);
        });

        it('should throw error if garden is full', async () => {
            const mockGarden = {
                joinCode: 'FULL123',
                members: ['u1', 'u2'],
                maxMembers: 2,
                save: jest.fn()
            };

            Garden.findOne.mockResolvedValue(mockGarden);

            await expect(gardenService.joinGardenByCode('FULL123', 'u3'))
                .rejects.toThrow('Garden is full');
        });
    });

    describe('leaveGarden', () => {
        it('should allow a member to leave', async () => {
            const userId = 'user2';
            const mockGarden = {
                owner: 'user1',
                members: ['user1', 'user2'],
                save: jest.fn().mockResolvedValue(true)
            };

            Garden.findById.mockResolvedValue(mockGarden);

            await gardenService.leaveGarden('g1', userId);

            expect(mockGarden.members).not.toContain(userId);
            expect(mockGarden.save).toHaveBeenCalled();
        });

        it('should throw error if owner tries to leave', async () => {
            const ownerId = 'user1';
            const mockGarden = {
                owner: ownerId,
                members: [ownerId],
                save: jest.fn()
            };

            Garden.findById.mockResolvedValue(mockGarden);

            await expect(gardenService.leaveGarden('g1', ownerId))
                .rejects.toThrow('Owner cannot leave the garden');
        });
    });

    describe('updateGarden', () => {
        it('should allow owner to update fields', async () => {
            const ownerId = 'user1';
            const mockGarden = {
                owner: ownerId,
                name: 'Old Name',
                save: jest.fn().mockResolvedValue(true)
            };

            Garden.findById.mockResolvedValue(mockGarden);

            const result = await gardenService.updateGarden('g1', { name: 'New Name' }, ownerId);

            expect(mockGarden.name).toBe('New Name');
            expect(mockGarden.save).toHaveBeenCalled();
        });

        it('should throw error if non-owner tries to update', async () => {
            const mockGarden = { owner: 'user1' };
            Garden.findById.mockResolvedValue(mockGarden);

            await expect(gardenService.updateGarden('g1', { name: 'Hack' }, 'user2'))
                .rejects.toThrow('Only owner can update the garden');
        });
    });

    describe('removeMember', () => {
        it('should allow owner to remove a specific member', async () => {
            const ownerId = 'owner123';
            const memberId = 'member456';
            const mockGarden = {
                owner: ownerId,
                members: [ownerId, memberId],
                save: jest.fn().mockResolvedValue(true)
            };

            Garden.findById.mockResolvedValue(mockGarden);

            await gardenService.removeMember('garden123', memberId, ownerId);

            expect(mockGarden.members).toEqual([ownerId]);
            expect(mockGarden.save).toHaveBeenCalled();
        });
    });
});