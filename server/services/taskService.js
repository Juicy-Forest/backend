const Task = require('../models/Tasks');

async function getTask(sectionId) {
    if (sectionId) {
        return await Task.find({ sectionId });
    }
    return await Task.find({});
}

async function createTask(data) {
    return await Task.create(data);
}

async function updateTask(id, data) {
    return await Task.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

async function deleteTask(id) {
    return await Task.findByIdAndDelete(id);
}

async function toggleCheckBox(id) {
    const taskToUpdate = await Task.findById(id);
    taskToUpdate.isComplete = !taskToUpdate.isComplete;
    return await taskToUpdate.save();
}

module.exports = {
    getTask,
    createTask,
    updateTask,
    deleteTask,
    toggleCheckBox,
}
