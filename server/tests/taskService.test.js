const taskService = require('../services/taskService');
const Task = require('../models/Tasks');

// Mock the Mongoose model
jest.mock('../models/Tasks');

describe('Task Service', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getTask', () => {
        it('should return tasks for a specific sectionId if provided', async () => {
            const sectionId = 'section123';
            const mockTasks = [{ title: 'Task 1', sectionId }];
            Task.find.mockResolvedValue(mockTasks);

            const result = await taskService.getTask(sectionId);

            expect(Task.find).toHaveBeenCalledWith({ sectionId });
            expect(result).toEqual(mockTasks);
        });

        it('should return all tasks if no sectionId is provided', async () => {
            const mockTasks = [{ title: 'Task 1' }, { title: 'Task 2' }];
            Task.find.mockResolvedValue(mockTasks);

            const result = await taskService.getTask();

            expect(Task.find).toHaveBeenCalledWith({});
            expect(result).toEqual(mockTasks);
        });
    });

    describe('createTask', () => {
        it('should create and return a new task', async () => {
            const taskData = { title: 'New Task', sectionId: '123' };
            Task.create.mockResolvedValue(taskData);

            const result = await taskService.createTask(taskData);

            expect(Task.create).toHaveBeenCalledWith(taskData);
            expect(result).toEqual(taskData);
        });
    });

    describe('updateTask', () => {
        it('should update and return the task with validators', async () => {
            const id = 'task123';
            const updateData = { title: 'Updated Title' };
            const mockUpdatedTask = { _id: id, ...updateData };

            Task.findByIdAndUpdate.mockResolvedValue(mockUpdatedTask);

            const result = await taskService.updateTask(id, updateData);

            expect(Task.findByIdAndUpdate).toHaveBeenCalledWith(
                id,
                updateData,
                { new: true, runValidators: true }
            );
            expect(result).toEqual(mockUpdatedTask);
        });
    });

    describe('deleteTask', () => {
        it('should delete and return the deleted task', async () => {
            const id = 'task123';
            const mockDeletedTask = { _id: id, title: 'Deleted Task' };
            Task.findByIdAndDelete.mockResolvedValue(mockDeletedTask);

            const result = await taskService.deleteTask(id);

            expect(Task.findByIdAndDelete).toHaveBeenCalledWith(id);
            expect(result).toEqual(mockDeletedTask);
        });
    });

    describe('toggleCheckBox', () => {
        it('should toggle isComplete from false to true and save', async () => {
            const id = 'task123';
            // Create a mock task instance with a save method
            const mockTaskInstance = {
                _id: id,
                isComplete: false,
                save: jest.fn().mockResolvedValue({ _id: id, isComplete: true })
            };

            Task.findById.mockResolvedValue(mockTaskInstance);

            const result = await taskService.toggleCheckBox(id);

            expect(Task.findById).toHaveBeenCalledWith(id);
            expect(mockTaskInstance.isComplete).toBe(true);
            expect(mockTaskInstance.save).toHaveBeenCalled();
            expect(result.isComplete).toBe(true);
        });

        it('should toggle isComplete from true to false and save', async () => {
            const id = 'task123';
            const mockTaskInstance = {
                _id: id,
                isComplete: true,
                save: jest.fn().mockResolvedValue({ _id: id, isComplete: false })
            };

            Task.findById.mockResolvedValue(mockTaskInstance);

            const result = await taskService.toggleCheckBox(id);

            expect(mockTaskInstance.isComplete).toBe(false);
            expect(mockTaskInstance.save).toHaveBeenCalled();
        });
    });
});