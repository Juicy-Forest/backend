import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// 1. Mock the dependency BEFORE importing the controller.
// We use unstable_mockModule because we are in Native ESM mode (type: module).
jest.unstable_mockModule('../services/sensorService.js', () => ({
    getSensorData: jest.fn()
}));

// 2. Import the mocked service so we can control its behavior in tests
const { getSensorData } = await import('../services/sensorService.js');

// 3. Import the controller (Dynamic import ensures the mock is applied first)
const { default: sensorController } = await import('../controllers/sensorController.js');

// 4. Setup a simple express app for testing
const app = express();
app.use(express.json()); // Good practice, though not strictly used in your GET
app.use('/', sensorController);

describe('Sensor Controller GET /', () => {
    
    // Reset mocks before each test to ensure clean state
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 200 and sensor data when service succeeds', async () => {
        // Arrange: Mock the service to resolve successfully
        const mockData = { temperature: 25, humidity: 60 };
        getSensorData.mockResolvedValue(mockData);

        // Act: Make the request
        const response = await request(app).get('/');

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockData);
        expect(getSensorData).toHaveBeenCalledTimes(1);
    });

    it('should return 500 and error message when service throws error', async () => {
        // Arrange: Mock the service to throw an error
        const errorMessage = 'Sensor connection failed';
        getSensorData.mockRejectedValue(new Error(errorMessage));

        // Act
        const response = await request(app).get('/');

        // Assert
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: errorMessage });
        expect(getSensorData).toHaveBeenCalledTimes(1);
    });
});