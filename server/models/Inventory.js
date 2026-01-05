const { Schema, model } = require('mongoose');

const inventorySchema = new Schema({
    name: {
        required: true,
        type: String,
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
    },
    isImportant: {
        // sets an item to important or not -> important items get low quantitiy notifcations
        required: false,
        type: Boolean,
    },
    desiredQuantity: {
        // if the quantity of an important item drops below this, a notification must be sent
        required: false,
        type: Number,
    },
    gardenId: {
        type: Schema.Types.ObjectId,
        ref: 'Garden',
        required: true,
    },
});

inventorySchema.index({ gardenId: 1, name: 1 }, { 
    unique: true,
    collation: { 
        locale: 'en', 
        strength: 2 
    } 
});

const Inventory = model('Inventory', inventorySchema);

module.exports = Inventory;