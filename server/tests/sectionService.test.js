const sectionService = require('../services/sectionService'); 
const SectionInfo = require('../models/Section');

// Mock the Mongoose model
jest.mock('../models/Section');

describe('Section Service', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getSectionsByGarden', () => {
        it('should return sections with populated garden and assignedTo fields', async () => {
            const gardenId = 'garden123';
            const mockSections = [{ name: 'North Plot', garden: gardenId }];

            // Mocking the chain: .find().populate().populate()
            const mockPopulate2 = { populate: jest.fn().mockResolvedValue(mockSections) };
            const mockPopulate1 = { populate: jest.fn().mockReturnValue(mockPopulate2) };
            SectionInfo.find.mockReturnValue(mockPopulate1);

            const result = await sectionService.getSectionsByGarden(gardenId);

            expect(SectionInfo.find).toHaveBeenCalledWith({ garden: gardenId });
            expect(mockPopulate1.populate).toHaveBeenCalledWith('garden');
            expect(mockPopulate2.populate).toHaveBeenCalledWith('assignedTo');
            expect(result).toEqual(mockSections);
        });
    });

    describe('createSection', () => {
        it('should create and save a new section', async () => {
            const sectionData = { name: 'New Section', garden: 'garden123' };
            
            // Mock the constructor and the save method
            const saveMock = jest.fn().mockResolvedValue({ _id: 'sec123', ...sectionData });
            SectionInfo.mockImplementation(() => ({
                save: saveMock
            }));

            const result = await sectionService.createSection(sectionData);

            expect(SectionInfo).toHaveBeenCalledWith(sectionData);
            expect(saveMock).toHaveBeenCalled();
            expect(result._id).toBe('sec123');
        });
    });

    describe('getSectionById', () => {
        it('should find a section by the custom id field', async () => {
            const customId = 'S-01';
            const mockSection = { id: customId, name: 'Section 1' };
            SectionInfo.findOne.mockResolvedValue(mockSection);

            const result = await sectionService.getSectionById(customId);

            expect(SectionInfo.findOne).toHaveBeenCalledWith({ id: customId });
            expect(result).toEqual(mockSection);
        });
    });

    describe('updateSection', () => {
        it('should update and return the section using the custom id field', async () => {
            const customId = 'S-01';
            const updateData = { name: 'Updated Name' };
            const mockUpdated = { id: customId, ...updateData };

            SectionInfo.findOneAndUpdate.mockResolvedValue(mockUpdated);

            const result = await sectionService.updateSection(customId, updateData);

            expect(SectionInfo.findOneAndUpdate).toHaveBeenCalledWith(
                { id: customId },
                updateData,
                { new: true }
            );
            expect(result.name).toBe('Updated Name');
        });
    });

    describe('deleteSection', () => {
        it('should delete and return the section using the custom id field', async () => {
            const customId = 'S-01';
            const mockDeleted = { id: customId };
            SectionInfo.findOneAndDelete.mockResolvedValue(mockDeleted);

            const result = await sectionService.deleteSection(customId);

            expect(SectionInfo.findOneAndDelete).toHaveBeenCalledWith({ id: customId });
            expect(result).toEqual(mockDeleted);
        });
    });
});