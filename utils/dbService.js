import User from '../models/User.js';

async function saveResultToDatabase(userId, fileUrl) {
    try {
        // Find the user by ID
        const user = await User.findById(userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        // Add the new photo to the user's historyPhotos array
        user.historyPhotos.push({
            url: fileUrl,
            createdAt: new Date()
        });

        // Save the updated user document
        await user.save();

        return {
            success: true,
            fileUrl: fileUrl
        };
    } catch (error) {
        console.error('Error saving to database:', error);
        throw error;
    }
}

export { saveResultToDatabase };

module.exports = {
    testMatch: ["**/tests/**/*.test.js", "**/?(*.)+(spec|test).[tj]s?(x)"],
  };