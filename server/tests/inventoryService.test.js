const inventoryService = require('../services/inventoryService');
const Inventory = require('../models/Inventory');

// Mock the Mongoose model
jest.mock('../models/Inventory');

describe('Inventory Service', () => {
  
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getItems', () => {
        it('should return all inventory items', async () => {
            const mockItems = [{ name: 'Item 1' }, { name: 'Item 2' }];
            Inventory.find.mockResolvedValue(mockItems);

            const result = await inventoryService.getItems();

            expect(Inventory.find).toHaveBeenCalledWith({});
            expect(result).toEqual(mockItems);
        });
    });

    describe('createItem', () => {
        it('should create and return a new item', async () => {
            const itemData = { name: 'New Item', quantity: 10 };
            Inventory.create.mockResolvedValue(itemData);

            const result = await inventoryService.createItem(itemData);

            expect(Inventory.create).toHaveBeenCalledWith(itemData);
            expect(result).toEqual(itemData);
        });
    });

    describe('updateItem', () => {
        it('should update and return the item with validators enabled', async () => {
            const id = '123';
            const updateData = { quantity: 20 };
            const mockUpdatedItem = { _id: id, ...updateData };

            Inventory.findByIdAndUpdate.mockResolvedValue(mockUpdatedItem);

            const result = await inventoryService.updateItem(id, updateData);

            expect(Inventory.findByIdAndUpdate).toHaveBeenCalledWith(
                id, 
                updateData, 
                { new: true, runValidators: true }
            );
            expect(result).toEqual(mockUpdatedItem);
        });
    });

    describe('deleteItem', () => {
        it('should delete and return the item', async () => {
            const id = '123';
            const mockDeletedItem = { _id: id, name: 'Deleted Item' };

            Inventory.findByIdAndDelete.mockResolvedValue(mockDeletedItem);

            const result = await inventoryService.deleteItem(id);

            expect(Inventory.findByIdAndDelete).toHaveBeenCalledWith(id);
            expect(result).toEqual(mockDeletedItem);
        });
    });
});