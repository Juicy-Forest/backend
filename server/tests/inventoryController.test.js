const request = require('supertest');
const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const inventoryService = require('../services/inventoryService');

// 1. Mock the service layer
jest.mock('../services/inventoryService');

// 2. Setup a temporary Express app to test the router
const app = express();
app.use(express.json()); // Essential for parsing POST/PUT bodies
app.use('/inventory', inventoryController);

describe('Inventory Controller', () => {
  
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /inventory', () => {
        it('should return 200 and a list of items', async () => {
            const mockItems = [{ name: 'Item A' }, { name: 'Item B' }];
            inventoryService.getItems.mockResolvedValue(mockItems);

            const response = await request(app).get('/inventory');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockItems);
            expect(inventoryService.getItems).toHaveBeenCalledTimes(1);
        });

        it('should return 500 if the service fails', async () => {
            inventoryService.getItems.mockRejectedValue(new Error('Database error'));

            const response = await request(app).get('/inventory');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Database error' });
        });
    });

    describe('POST /inventory', () => {
        it('should return 201 and the created item', async () => {
            const newItem = { name: 'New Item', quantity: 5 };
            inventoryService.createItem.mockResolvedValue({ _id: '1', ...newItem });

            const response = await request(app)
                .post('/inventory')
                .send(newItem);

            expect(response.status).toBe(201);
            expect(response.body._id).toBe('1');
            expect(inventoryService.createItem).toHaveBeenCalledWith(newItem);
        });
    });

    describe('PUT /inventory/:id', () => {
        it('should return 200 and the updated item', async () => {
            const updatedData = { quantity: 10 };
            inventoryService.updateItem.mockResolvedValue({ _id: '123', ...updatedData });

            const response = await request(app)
                .put('/inventory/123')
                .send(updatedData);

            expect(response.status).toBe(200);
            expect(response.body.quantity).toBe(10);
            expect(inventoryService.updateItem).toHaveBeenCalledWith('123', updatedData);
        });
    });

    describe('DELETE /inventory/:id', () => {
        it('should return 204 on successful deletion', async () => {
            inventoryService.deleteItem.mockResolvedValue({ _id: '123' });

            const response = await request(app).delete('/inventory/123');

            expect(response.status).toBe(204);
            expect(inventoryService.deleteItem).toHaveBeenCalledWith('123');
        });
    });
});