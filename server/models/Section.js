const { mongoose, model } = require('mongoose');
const IssueSchema = new mongoose.Schema(
    {
        type: { type: String, required: true },
        severity: { type: String },
        description: { type: String },
    },
    { _id: false }
);

const SectionInfoSchema = new mongoose.Schema({
    sectionName: {
        type: String,
        required: true,
    },
    temperature: {
        type: String,
        default: '',
    },
    humidityLevel: {
        type: Number,
        default: 0,
    },
    soilMoisture: {
        type: String,
        default: '',
    },
    lastWatered: {
        type: String, 
        default: '',
    },
    issues: {
        type: [IssueSchema],
        default: [],
    },
    plants: {
        type: [String],
        default: [],
    },
    color: {
        type: String,
        default: '#FFFFFF',
    },
    // FKs
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    garden: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Garden',
        required: true
    },
});

const Section = model('Section', SectionInfoSchema);


module.exports = Section;