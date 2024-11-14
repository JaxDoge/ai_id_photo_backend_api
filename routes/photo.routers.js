import express from 'express';
import { processIdPhoto } from '../services/aiPhotoService.js';

const router = express.Router();

router.post('/process', async (req, res) => {
  try {
    const result = await processIdPhoto(req.body);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;