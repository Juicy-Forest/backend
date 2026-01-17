import { jest } from '@jest/globals';

// Mock Mongoose model
const mockTaskModel = {
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn()
};

jest.unstable_mockModule('../models/Tasks.js', () => ({
  default: mockTaskModel
}));

const { getTask, createTask, updateTask, deleteTask, toggleCheckBox } = 
  await import('../services/taskService.js');

describe('Task Service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getTask', () => {
    it('should return all tasks or filter by sectionId', async () => {
      const mockTasks = [{ _id: '1', name: 'Task 1', isComplete: false }];
      mockTaskModel.find.mockResolvedValue(mockTasks);

      expect(await getTask()).toEqual(mockTasks);
      expect(mockTaskModel.find).toHaveBeenCalledWith({});

      await getTask('section123');
      expect(mockTaskModel.find).toHaveBeenCalledWith({ sectionId: 'section123' });
    });
  });

  describe('createTask', () => {
    it('should create a task with provided data', async () => {
      const taskData = { name: 'New Task', isComplete: false };
      const mockCreated = { _id: '1', ...taskData };
      mockTaskModel.create.mockResolvedValue(mockCreated);

      const result = await createTask(taskData);

      expect(mockTaskModel.create).toHaveBeenCalledWith(taskData);
      expect(result).toEqual(mockCreated);
    });

    it('should propagate database errors', async () => {
      mockTaskModel.create.mockRejectedValue(new Error('Database error'));
      await expect(createTask({})).rejects.toThrow('Database error');
    });
  });

  describe('updateTask', () => {
    it('should update a task by id', async () => {
      const mockUpdated = { _id: '1', name: 'Updated' };
      mockTaskModel.findByIdAndUpdate.mockResolvedValue(mockUpdated);

      const result = await updateTask('1', { name: 'Updated' });

      expect(mockTaskModel.findByIdAndUpdate).toHaveBeenCalledWith('1', { name: 'Updated' }, 
        { new: true, runValidators: true });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task by id', async () => {
      const mockDeleted = { _id: '1', name: 'Deleted' };
      mockTaskModel.findByIdAndDelete.mockResolvedValue(mockDeleted);

      const result = await deleteTask('1');

      expect(mockTaskModel.findByIdAndDelete).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockDeleted);
    });
  });

  describe('toggleCheckBox', () => {
    it('should toggle task completion status', async () => {
      const mockTask = { _id: '1', isComplete: false, save: jest.fn() };
      mockTask.save.mockResolvedValue({ ...mockTask, isComplete: true });
      mockTaskModel.findById.mockResolvedValue(mockTask);

      await toggleCheckBox('1');

      expect(mockTaskModel.findById).toHaveBeenCalledWith('1');
      expect(mockTask.isComplete).toBe(true);
      expect(mockTask.save).toHaveBeenCalled();
    });
  });
});
