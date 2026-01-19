const request = require('supertest');
const express = require('express');
const gardenController = require('../controllers/gardenController');
const gardenService = require('../services/gardenService');

// Mock the service layer
jest.mock('../services/gardenService');

const app = express();
app.use(express.json());
// Mock middleware to provide req.user
app.use((req, res, next) => {
    req.user = { _id: 'user123' };
    next();
});
app.use('/gardens', gardenController);

describe('Garden Controller', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /gardens', () => {
        it('should return 200 and list of gardens', async () => {
            const mockGardens = [
                { name: 'Garden 1', toObject: () => ({ name: 'Garden 1' }) },
                { name: 'Garden 2', toObject: () => ({ name: 'Garden 2' }) }
            ];
            gardenService.getAllGardens.mockResolvedValue(mockGardens);

            const response = await request(app).get('/gardens');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0].name).toBe('Garden 1');
        });
    });

    describe('POST /gardens', () => {
        it('should return 201 and create a garden with a 400-tile grid', async () => {
            const payload = { name: 'New Garden', location: '123 Street' };
            const mockCreated = { 
                ...payload, 
                toObject: () => ({ ...payload, grid: new Array(400).fill({}) }) 
            };

            gardenService.createGarden.mockResolvedValue(mockCreated);

            const response = await request(app)
                .post('/gardens')
                .send(payload);

            expect(response.status).toBe(201);
            // Verify the service was called with the initialized grid
            const callArgs = gardenService.createGarden.mock.calls[0];
            const gridArg = callArgs[4]; // The 5th argument in createGarden
            
            expect(gridArg).toHaveLength(400);
            expect(gridArg[0]).toEqual({ index: 0, section: null, plant: '' });
        });

        it('should return 400 if name or location is missing', async () => {
            const response = await request(app).post('/gardens').send({ name: 'Only Name' });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Location is required');
        });
    });

    describe('PUT /gardens/:id', () => {
        it('should return 403 if service throws "Only owner" error', async () => {
            gardenService.updateGarden.mockRejectedValue(new Error('Only owner can update'));

            const response = await request(app)
                .put('/gardens/123')
                .send({ name: 'Changed' });

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('Only owner');
        });

        it('should return 404 if garden not found', async () => {
            gardenService.updateGarden.mockRejectedValue(new Error('Garden not found'));

            const response = await request(app).put('/gardens/999').send({});

            expect(response.status).toBe(404);
        });
    });

    describe('POST /gardens/join', () => {
        it('should join a garden via joinCode', async () => {
            const mockGarden = { name: 'Joined Garden', toObject: () => ({ name: 'Joined Garden' }) };
            gardenService.joinGardenByCode.mockResolvedValue(mockGarden);

            const response = await request(app)
                .post('/gardens/join')
                .send({ joinCode: 'ABC-123' });

            expect(response.status).toBe(200);
            expect(gardenService.joinGardenByCode).toHaveBeenCalledWith('ABC-123', 'user123');
        });

        it('should return 400 if joinCode is missing', async () => {
            const response = await request(app).post('/gardens/join').send({});
            expect(response.status).toBe(400);
        });
    });

    describe('POST /gardens/:id/removeMember', () => {
        it('should allow owner to remove a member', async () => {
            const mockGarden = { toObject: () => ({ message: 'success' }) };
            gardenService.removeMember.mockResolvedValue(mockGarden);

            const response = await request(app)
                .post('/gardens/123/removeMember')
                .send({ memberId: 'member456' });

            expect(response.status).toBe(200);
            expect(gardenService.removeMember).toHaveBeenCalledWith('123', 'member456', 'user123');
        });
    });
});