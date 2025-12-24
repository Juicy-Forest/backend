const { Schema, model } = require('mongoose');

const taskSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    isComplete: {
        type: Boolean,
        default: false
    }
});

const Task = model('Task', taskSchema);

module.exports = Task;
