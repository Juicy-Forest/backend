const { Schema, model } = require('mongoose');

const PLANT_TYPES = ['Plant', 'Tree', 'Bush', 'Flower', 
    'Greenhouse', 'Pathway', 'Pond', 'Fence', ''];

const GridTileSchema = new Schema({
    index: { type: Number, required: true },  
    section: { 
        type: Schema.Types.ObjectId,  
        ref: 'Section',
        default: null
    },
    plant: {
        default: '',
        enum: PLANT_TYPES,
        type: String
    }
}, { _id: false });

const gardenSchema = new Schema({
    name: {
        required: true,
        type: String,
        unique: true,
    },
    description: {
        type: String,
    },
    location: {
        lat: {
            type: Number,
        },
        lng: {
            type: Number,
        },
        address: {
            type: String,
        },
    },
    joinCode: {
        type: String,
        unique: true,
        required: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    maxMembers: {
        type: Number,
        default: 10,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    grid: { type: [GridTileSchema], default: [] },
});

gardenSchema.index({ name: 1 }, {
    collation: {
        locale: 'en',
        strength: 2
    }
});

const Garden = model('Garden', gardenSchema);

module.exports = Garden;
