import axios from 'axios';
import dotenv from 'dotenv';
import FormData from 'form-data';
import axiosRetry from 'axios-retry';
import sizeOf from 'image-size';

dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;
const AI_SERVICE_PORT = process.env.AI_SERVICE_PORT;

const ONLY_CHANGE_BACKGROUND = 'only change background';

export async function processIdPhoto(image, params) {
    // Configure retry behavior
    axiosRetry(axios, { 
        retries: 3,
        retryDelay: axiosRetry.exponentialDelay,
        retryCondition: (error) => {
            // Retry on timeout errors and network errors
            return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
                    error.code === 'ETIMEDOUT';
        },
        shouldResetTimeout: true
    });

    // Rename keys in params if they exist
    const renamedParams = {
        ...params,
        render: params.renderMode,
        color: params.backgroundColor
    };
    // Remove old keys
    delete renamedParams.renderMode;
    delete renamedParams.backgroundColor;
    delete renamedParams.sizeType;
    delete renamedParams.presetSize;

    if (params.sizeType === ONLY_CHANGE_BACKGROUND) {
        const dimensions = sizeOf(image.buffer);
        renamedParams.height = dimensions.height;
        renamedParams.width = dimensions.width;

        console.log('Getting image without background...');
        const image_no_background_base64 = await processCallHumanMatting(image, renamedParams);
        console.log('Adding background...');
        return await processCallAddBackground(image_no_background_base64, renamedParams);
    } else {
        console.log('Getting image without background...');
        const image_no_background_base64_hd = await processCallIdphoto(image, renamedParams);
        console.log('Adding background...');
        return await processCallAddBackground(image_no_background_base64_hd, renamedParams);
    }
}

async function processCallHumanMatting(image, params) {
    try {
        const formData = new FormData();
    
        // Ensure we're sending the buffer correctly
        if (!image.buffer) {
            throw new Error('No image buffer provided');
        }
        
        // Append the image buffer with proper metadata
        formData.append('input_image', image.buffer, {
            filename: image.originalname,
            contentType: image.mimetype,
        });

        const defaultParams = {
            human_matting_model: 'modnet_photographic_portrait_matting',
            dpi: 300,
        };        

        const finalParams = { ...defaultParams, ...params };
    
        const requiredParams = [
            'human_matting_model',
        ];

        Object.entries(finalParams)
            .filter(([key]) => requiredParams.includes(key))
            .forEach(([key, value]) => {
                formData.append(key, value);
            });

        const response = await axios({
            method: 'post',
            url: `http://${AI_SERVICE_URL}:${AI_SERVICE_PORT}/human_matting`,
            data: formData,
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 120000,
        });
      
        if (response.data.status === false) {
            throw new Error('Ai service returned false');
        }
          
        return response.data.image_base64;            
    } catch (error) {
        console.error('Error processing human matting:', error);
        throw error;
    }
}

async function processCallIdphoto(image, params) {
    try {
        const formData = new FormData();
    
        // Ensure we're sending the buffer correctly
        if (!image.buffer) {
            throw new Error('No image buffer provided');
        }
        
        // Append the image buffer with proper metadata
        formData.append('input_image', image.buffer, {
            filename: image.originalname,
            contentType: image.mimetype,
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
          hd: 'true',
          dpi: 300,
        };
    
        const finalParams = { ...defaultParams, ...params };
    
        const requiredParams = [
            'height',
            'width',
            'human_matting_model',
            'face_detect_model',
            'hd',
            'dpi',
            'head_measure_ratio',
            'head_height_ratio',
            'top_distance_max',
            'top_distance_min',
        ];
        
        Object.entries(finalParams)
            .filter(([key]) => requiredParams.includes(key))
            .forEach(([key, value]) => {
                formData.append(key, value);
            });
    
        const response = await axios({
          method: 'post',
          url: `http://${AI_SERVICE_URL}:${AI_SERVICE_PORT}/idphoto`,
          data: formData,
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 120000,
        });

        if (response.data.status === false) {
            throw new Error('Ai service returned false');
        }
    
        return response.data.image_base64_hd;
      } catch (error) {
        console.error('Error processing ID photo:', error);
        throw error;
      }
}

async function processCallAddBackground(image_no_background_base64, params) {
    try {
        const formData = new FormData();

        formData.append('input_image_base64', image_no_background_base64);

        const defaultParams = {
            dpi: 300,
        };

        const finalParams = { ...defaultParams, ...params };

        const requiredParams = [
            'color',
            'dpi',
            'render',
        ];

        Object.entries(finalParams)
            .filter(([key]) => requiredParams.includes(key))
            .forEach(([key, value]) => {
                formData.append(key, value);
            });

        const response = await axios({
            method: 'post',
            url: `http://${AI_SERVICE_URL}:${AI_SERVICE_PORT}/add_background`,
            data: formData,
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 120000,
        });

        if (response.data.status === false) {
            throw new Error('Ai service returned false');
        }
  
        return response.data
    } catch (error) {
        console.error('Error adding background:', error);
        throw error;
    }
}
