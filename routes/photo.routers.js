import express from 'express';
import multer from 'multer';
import sizeOf from 'image-size';
import { processIdPhoto } from '../services/aiPhotoService.js';

const router = express.Router();
const upload = multer();

router.post('/process', upload.single('image'), async (req, res) => {
  try {
    const params = JSON.parse(req.body.params);
    
    const result = await processIdPhoto(req.file, params);
    console.log('Photo processed successfully');
    
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