import mongoose from 'mongoose';
import User from '../../models/User.js';
import { saveResultToDatabase } from '../../utils/dbService.js';

// Mock the User model
jest.mock('../../models/User.js');

describe('saveResultToDatabase', () => {
  const mockUserId = 'mockUserId';
  const mockFileUrl = 'http://example.com/photo.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save a file URL to the user\'s historyPhotos successfully', async () => {
    // Mock the user document
    const mockUser = {
      historyPhotos: [],
      save: jest.fn(),
    };

    User.findById.mockResolvedValue(mockUser); // Mock findById to return the mockUser

    const result = await saveResultToDatabase(mockUserId, mockFileUrl);

    // Assertions
    expect(User.findById).toHaveBeenCalledWith(mockUserId); // Ensure correct ID is queried
    expect(mockUser.historyPhotos).toHaveLength(1); // Verify photo added
    expect(mockUser.historyPhotos[0].url).toBe(mockFileUrl); // Verify correct URL added
    expect(mockUser.save).toHaveBeenCalled(); // Ensure save is called
    expect(result).toEqual({ success: true, fileUrl: mockFileUrl }); // Verify returned result
  });

  it('should throw an error if the user is not found', async () => {
    User.findById.mockResolvedValue(null); // Mock findById to return null

    await expect(saveResultToDatabase(mockUserId, mockFileUrl)).rejects.toThrow(
      'User not found'
    );

    expect(User.findById).toHaveBeenCalledWith(mockUserId);
    expect(User.prototype.save).not.toHaveBeenCalled(); // Save should not be called
  });

  it('should throw an error if save fails', async () => {
    const mockUser = {
      historyPhotos: [],
      save: jest.fn().mockRejectedValue(new Error('Database save error')), // Mock save to throw error
    };

    User.findById.mockResolvedValue(mockUser);

    await expect(saveResultToDatabase(mockUserId, mockFileUrl)).rejects.toThrow(
      'Database save error'
    );

    expect(User.findById).toHaveBeenCalledWith(mockUserId);
    expect(mockUser.save).toHaveBeenCalled(); // Save is attempted
  });
});
