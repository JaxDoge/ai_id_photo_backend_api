import express from 'express';
import multer from 'multer';
import sizeOf from 'image-size';
import { processIdPhoto } from '../services/aiPhotoService.js';

const router = express.Router();
const upload = multer();

router.post('/process', upload.single('image'), async (req, res) => {
  try {
    
    const params = JSON.parse(req.body.params);

    if (params.sizeType === 'only change background') {
      const dimensions = sizeOf(req.file.buffer);
      params.height = dimensions.height;
      params.width = dimensions.width;
    }
    
    const result = await processIdPhoto({
      image: req.file,
      ...params
    });
    
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