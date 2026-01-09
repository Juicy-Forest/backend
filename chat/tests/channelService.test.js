import { jest } from '@jest/globals';

// Mock Mongoose model
const mockChannelModel = {
  create: jest.fn(),
  find: jest.fn()
};

jest.unstable_mockModule('../models/Channel.js', () => ({
  default: mockChannelModel
}));

const { saveChannel, getChannels, getFormattedChannels, formatChannel } = 
  await import('../services/channelService.js');

describe('Channel Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveChannel', () => {
    it('should create a channel with name and gardenId', async () => {
      const mockChannel = {
        _id: '507f1f77bcf86cd799439011',
        name: 'general',
        gardenId: '507f1f77bcf86cd799439001'
      };
      mockChannelModel.create.mockResolvedValue(mockChannel);

      const result = await saveChannel('general', '507f1f77bcf86cd799439001');

      expect(mockChannelModel.create).toHaveBeenCalledWith({
        name: 'general',
        gardenId: '507f1f77bcf86cd799439001'
      });
      expect(result).toEqual(mockChannel);
    });

    it('should propagate database errors', async () => {
      mockChannelModel.create.mockRejectedValue(new Error('Database connection failed'));

      await expect(saveChannel('test', '123')).rejects.toThrow('Database connection failed');
    });
  });

  describe('getChannels', () => {
    it('should return all channels', async () => {
      const mockChannels = [
        { _id: '1', name: 'general', gardenId: 'garden1' },
        { _id: '2', name: 'random', gardenId: 'garden1' }
      ];
      mockChannelModel.find.mockResolvedValue(mockChannels);

      const result = await getChannels();

      expect(mockChannelModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockChannels);
    });

    it('should return empty array when no channels exist', async () => {
      mockChannelModel.find.mockResolvedValue([]);

      const result = await getChannels();

      expect(result).toEqual([]);
    });
  });

  describe('formatChannel', () => {
    it('should format channel with only _id and name', () => {
      const channel = {
        _id: '507f1f77bcf86cd799439011',
        name: 'general',
        gardenId: '507f1f77bcf86cd799439001',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = formatChannel(channel);

      expect(result).toEqual({
        _id: '507f1f77bcf86cd799439011',
        name: 'general'
      });
      expect(result).not.toHaveProperty('gardenId');
      expect(result).not.toHaveProperty('createdAt');
    });
  });

  describe('getFormattedChannels', () => {
    it('should return formatted channels', async () => {
      const mockChannels = [
        { _id: '1', name: 'general', gardenId: 'garden1' },
        { _id: '2', name: 'random', gardenId: 'garden1' }
      ];
      mockChannelModel.find.mockResolvedValue(mockChannels);

      const result = await getFormattedChannels();

      expect(result).toEqual([
        { _id: '1', name: 'general' },
        { _id: '2', name: 'random' }
      ]);
    });
  });
});

