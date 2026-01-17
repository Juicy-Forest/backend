const request = require('supertest');
const express = require('express');
const tasksController = require('../controllers/taskController');
const taskService = require('../services/taskService');

// 1. Mock the taskService
jest.mock('../services/taskService');

// 2. Setup a dummy Express app to host our router
const app = express();
app.use(express.json());
app.use('/tasks', tasksController);

describe('Tasks Controller', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /tasks', () => {
        it('should return 200 and all tasks when no sectionId is provided', async () => {
            const mockTasks = [{ title: 'Task 1' }, { title: 'Task 2' }];
            taskService.getTask.mockResolvedValue(mockTasks);

            const response = await request(app).get('/tasks');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockTasks);
            expect(taskService.getTask).toHaveBeenCalledWith(undefined);
        });

        it('should pass sectionId from query params to the service', async () => {
            taskService.getTask.mockResolvedValue([]);
            
            await request(app).get('/tasks?sectionId=123');

            expect(taskService.getTask).toHaveBeenCalledWith('123');
        });
    });

    describe('POST /tasks', () => {
        it('should return 201 and the created task', async () => {
            const newTask = { title: 'New Task' };
            taskService.createTask.mockResolvedValue({ _id: 'abc', ...newTask });

            const response = await request(app)
                .post('/tasks')
                .send(newTask);

            expect(response.status).toBe(201);
            expect(response.body._id).toBe('abc');
        });

        it('should return 500 if creation fails', async () => {
            taskService.createTask.mockRejectedValue(new Error('Database Error'));

            const response = await request(app)
                .post('/tasks')
                .send({ title: 'Fail Task' });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Database Error');
        });
    });

    describe('PUT /tasks/:id', () => {
        it('should return 200 and updated task', async () => {
            const updateData = { title: 'Updated' };
            taskService.updateTask.mockResolvedValue({ _id: '1', ...updateData });

            const response = await request(app)
                .put('/tasks/1')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(taskService.updateTask).toHaveBeenCalledWith('1', updateData);
        });
    });

    describe('DELETE /tasks/:id', () => {
        it('should return 204 on successful deletion', async () => {
            taskService.deleteTask.mockResolvedValue(true);

            const response = await request(app).delete('/tasks/1');

            expect(response.status).toBe(204);
            expect(response.text).toBe(""); // .end() sends no body
        });
    });

    describe('PUT /tasks/:id/toggle', () => {
        it('should return 200 and the toggled task', async () => {
            taskService.toggleCheckBox.mockResolvedValue({ _id: '1', isComplete: true });

            const response = await request(app).put('/tasks/1/toggle');

            expect(response.status).toBe(200);
            expect(response.body.isComplete).toBe(true);
            expect(taskService.toggleCheckBox).toHaveBeenCalledWith('1');
        });
    });
});