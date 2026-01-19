const Inventory = require('../models/Inventory');

async function getItems() {
    return await Inventory.find({});
}

async function createItem(data) {
    return await Inventory.create(data);
}

async function updateItem(id, data) {
    return await Inventory.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

async function deleteItem(id) {
    return await Inventory.findByIdAndDelete(id);
}

module.exports = {
    getItems,
    createItem,
    updateItem,
    deleteItem
};