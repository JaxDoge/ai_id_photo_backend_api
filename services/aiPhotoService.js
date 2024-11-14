import axios from 'axios';
import dotenv from 'dotenv';
import FormData from 'form-data';

dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;
const AI_SERVICE_PORT = process.env.AI_SERVICE_PORT;

export async function processIdPhoto(image, params) {
  try {
    const formData = new FormData();

    formData.append('image', image.buffer, {
      filename: image.originalname,
      contentType: image.mimetype
    });

    const defaultParams = {
      head_measure_ratio: 0.2,
      head_height_ratio: 0.45,
      top_distance_max: 0.12,
      top_distance_min: 0.1,
      height: 413,
      width: 295,
      human_matting_model: 'modnet_photographic_portrait_matting',
      face_detect_model: 'mtcnn',
      hd: true,
      dpi: 300,
      face_alignment: true,
    };

    const finalParams = { ...defaultParams, ...params };

    console.log(finalParams);

    Object.entries(finalParams).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await axios({
      method: 'post',
      url: `http://${AI_SERVICE_URL}:${AI_SERVICE_PORT}/idphoto`,
      data: formData,
      headers: {
        ...formData.getHeaders(),
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error processing ID photo:', error);
    throw error;
  }
}
