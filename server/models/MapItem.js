const mongoose = require('mongoose');

const mapItemSchema = new mongoose.Schema({
    name: {
        type: String,
        require: [true, 'Please add a name'],
    },
    description: String,

    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    createdAt: {type: Date, default: Date.now}
    },{
    discriminatorKey: 'kind',
    collection: 'mapitems'
    });

    mapItemSchema.index({ location: '2dsphere' });

const MapItem = mongoose.model('MapItem', mapItemSchema);




//item models - subject to change based on application needs
const Tree = MapItem.discriminator('Tree', new mongoose.Schema({
    species:String,
    age: Number
    }));


const Plant = MapItem.discriminator('Plant', new mongoose.Schema({
    isEdible: Boolean
    }));

module.exports = {
    MapItem,
    Tree,
    Plant
};