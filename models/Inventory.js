const { Schema, model } = require('mongoose');

const inventorySchema = new Schema({
    name: {
        required: true,
        type: String,
        unique: true, // don't want to add the same thing twice (like tomato seeds), just once and then update the quantity
    },
    type: {
        required: true,
        type: String,
    },
    quantity: {
        required: true,
        type: Number,
        min: 0,
    },
    quantityType: {
        // in case u want to specify the quantity is in bottles, KGs, etc.
        required: false,
        type: String,
    }
});

inventorySchema.index({name: 1}, {
    collation: {
        locale: 'en',
        strength: 2
    }
});

const Inventory = model('Inventory', inventorySchema);

module.exports = Inventory;