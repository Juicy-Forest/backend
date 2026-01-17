import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

const mockTasks = [
  { _id: '1', name: 'Water plants', description: 'Water all', isComplete: false, sectionId: '123' },
  { _id: '2', name: 'Prune trees', description: 'Prune all', isComplete: true, sectionId: '123' }
];

const mockTaskService = {
  getTask: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  toggleCheckBox: jest.fn()
};

jest.unstable_mockModule('../services/taskService.js', () => mockTaskService);

const tasksController = (await import('../controllers/tasksController.js')).default;

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/tasks', tasksController);
  return app;
}

describe('Tasks Controller', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /tasks', () => {
    it('should return all tasks or filter by sectionId', async () => {
      mockTaskService.getTask.mockResolvedValue(mockTasks);

      await request(app).get('/tasks').expect(200);
      expect(mockTaskService.getTask).toHaveBeenCalledTimes(1);

      await request(app).get('/tasks?sectionId=123').expect(200);
      expect(mockTaskService.getTask).toHaveBeenCalledWith('123');
    });

    it('should handle service errors', async () => {
      mockTaskService.getTask.mockRejectedValue(new Error('Database error'));
      await request(app).get('/tasks').expect(500);
    });
  });

  describe('POST /tasks', () => {
    it('should create a new task', async () => {
      const newTask = { name: 'New task', description: 'Desc', isComplete: false };
      mockTaskService.createTask.mockResolvedValue({ _id: '3', ...newTask });

      const response = await request(app).post('/tasks').send(newTask).expect(201);

      expect(mockTaskService.createTask).toHaveBeenCalledWith(newTask);
      expect(response.body._id).toBe('3');
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update an existing task', async () => {
      const updatedData = { name: 'Updated', isComplete: true };
      mockTaskService.updateTask.mockResolvedValue({ _id: '1', ...updatedData });

      await request(app).put('/tasks/1').send(updatedData).expect(200);

      expect(mockTaskService.updateTask).toHaveBeenCalledWith('1', updatedData);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task', async () => {
      mockTaskService.deleteTask.mockResolvedValue();

      await request(app).delete('/tasks/1').expect(204);

      expect(mockTaskService.deleteTask).toHaveBeenCalledWith('1');
    });
  });

  describe('PUT /tasks/:id/toggle', () => {
    it('should toggle task completion status', async () => {
      mockTaskService.toggleCheckBox.mockResolvedValue({ _id: '1', isComplete: true });

      await request(app).put('/tasks/1/toggle').expect(200);

      expect(mockTaskService.toggleCheckBox).toHaveBeenCalledWith('1');
    });
  });
});
