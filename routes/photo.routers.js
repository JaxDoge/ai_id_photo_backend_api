import express from 'express';
import multer from 'multer';
import { processIdPhoto } from '../services/aiPhotoService.js';
import { uploadToS3 } from '../utils/s3Upload.js';
import { saveResultToDatabase } from '../utils/dbService.js';

const router = express.Router();
const upload = multer();

router.post('/process', upload.single('image'), async (req, res) => {
  try {
    const params = JSON.parse(req.body.params);
    const user_id = req.body.user_id;
    
    const result = await processIdPhoto(req.file, params);
    console.log('Photo processed successfully');

    // Save the result to S3
    const buffer = Buffer.from(result.image_base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const s3_file_url = await uploadToS3(buffer, user_id);
    console.log('Photo uploaded to S3 successfully');

    // Save the result to the database
    await saveResultToDatabase(user_id, s3_file_url);
    console.log('Photo url saved to database successfully');
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error processing photo:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/proxy', async (req, res) => {
  const { url } = req.query;

  if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
  }

  try {
      console.log('Proxying URL:', url);

      // Dynamically import the fetch function
      const fetch = (await import('node-fetch')).default;

      const response = await fetch(url, {
          headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Referer': 'https://jpeg.org/',
          },
      });

      if (!response.ok) {
          throw new Error(`Failed to fetch the resource: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      res.setHeader('Content-Type', contentType);

      response.body.pipe(res);
  } catch (error) {
      console.error('Error proxying the resource:', error);
      res.status(500).json({
          success: false,
          message: 'Failed to fetch the resource',
          error: error.message,
      });
  }
});

export default router;