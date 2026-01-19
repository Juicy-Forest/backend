const request = require('supertest');
const express = require('express');
const sectionController = require('../controllers/sectionController'); // Adjust path
const sectionService = require('../services/sectionService'); // Adjust path

// Mock the service layer
jest.mock('../services/sectionService');

const app = express();
app.use(express.json());
app.use('/sections', sectionController);

describe('Section Controller', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /sections/:gardenId', () => {
        it('should return 200 and sections for a garden', async () => {
            const mockSections = [{ name: 'Section A' }];
            sectionService.getSectionsByGarden.mockResolvedValue(mockSections);

            const response = await request(app).get('/sections/garden123');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockSections);
            expect(sectionService.getSectionsByGarden).toHaveBeenCalledWith('garden123');
        });

        it('should return 500 on service failure', async () => {
            sectionService.getSectionsByGarden.mockRejectedValue(new Error('DB Fail'));

            const response = await request(app).get('/sections/garden123');

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Error getting garden sections');
        });
    });

    describe('POST /sections/:gardenId', () => {
        it('should return 201 and merge gardenId into the data', async () => {
            const bodyData = { name: 'New Section' };
            const savedSection = { _id: 's1', ...bodyData, garden: 'garden123' };
            
            sectionService.createSection.mockResolvedValue(savedSection);

            const response = await request(app)
                .post('/sections/garden123')
                .send(bodyData);

            expect(response.status).toBe(201);
            // Verify service was called with the merged object
            expect(sectionService.createSection).toHaveBeenCalledWith({
                name: 'New Section',
                garden: 'garden123'
            });
            expect(response.body.garden).toBe('garden123');
        });
    });

    describe('PUT /sections/:sectionId', () => {
        it('should return 200 if updated successfully', async () => {
            const updateData = { name: 'Updated Name' };
            sectionService.updateSection.mockResolvedValue({ id: 'sec1', ...updateData });

            const response = await request(app)
                .put('/sections/sec1')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(sectionService.updateSection).toHaveBeenCalledWith('sec1', updateData);
        });

        it('should return 404 if section does not exist', async () => {
            sectionService.updateSection.mockResolvedValue(null);

            const response = await request(app)
                .put('/sections/missing')
                .send({ name: 'test' });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Section not found');
        });
    });

    describe('DELETE /sections/:sectionId', () => {
        it('should return 200 and success message on deletion', async () => {
            sectionService.deleteSection.mockResolvedValue({ id: 'sec1' });

            const response = await request(app).delete('/sections/sec1');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Deleted successfully.');
        });

        it('should return 404 if nothing was deleted', async () => {
            sectionService.deleteSection.mockResolvedValue(null);

            const response = await request(app).delete('/sections/missing');

            expect(response.status).toBe(404);
        });
    });
});