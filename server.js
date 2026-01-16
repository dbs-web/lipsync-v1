require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// HeyGen API configuration
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const HEYGEN_UPLOAD_URL = 'https://upload.heygen.com/v1/asset';
const HEYGEN_VIDEO_URL = 'https://api.heygen.com/v2/video/av4/generate';

/**
 * Upload an asset to HeyGen
 * @param {Buffer} fileBuffer - File data
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<object>} - Response from HeyGen
 */
async function uploadAssetToHeyGen(fileBuffer, contentType) {
    const response = await axios.post(HEYGEN_UPLOAD_URL, fileBuffer, {
        headers: {
            'Content-Type': contentType,
            'X-API-KEY': HEYGEN_API_KEY,
            'Accept': 'application/json'
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    });
    return response.data;
}

/**
 * Create an Avatar IV video using HeyGen API
 * @param {string} imageKey - Image key from upload
 * @param {string} audioAssetId - Audio asset ID from upload
 * @returns {Promise<object>} - Response from HeyGen
 */
async function createAvatarIVVideo(imageKey, audioAssetId) {
    const response = await axios.post(HEYGEN_VIDEO_URL, {
        image_key: imageKey,
        video_title: `Video_${Date.now()}`,
        audio_asset_id: audioAssetId,
        video_orientation: 'portrait',
        fit: 'cover'
    }, {
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': HEYGEN_API_KEY,
            'Accept': 'application/json'
        }
    });
    return response.data;
}

// API endpoint to generate video
app.post('/api/generate-video', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
]), async (req, res) => {
    try {
        // Check API key
        if (!HEYGEN_API_KEY) {
            return res.status(500).json({
                error: 'HEYGEN_API_KEY não configurada no servidor',
                message: 'Configure a variável de ambiente HEYGEN_API_KEY'
            });
        }

        // Validate files
        if (!req.files?.image?.[0] || !req.files?.audio?.[0]) {
            return res.status(400).json({
                error: 'Arquivos faltando',
                message: 'Por favor, envie uma imagem e um áudio'
            });
        }

        const imageFile = req.files.image[0];
        const audioFile = req.files.audio[0];

        console.log(`Uploading image: ${imageFile.originalname} (${imageFile.mimetype})`);
        console.log(`Uploading audio: ${audioFile.originalname} (${audioFile.mimetype})`);

        // Step 1: Upload image to HeyGen
        console.log('Step 1: Uploading image to HeyGen...');
        const imageUploadResponse = await uploadAssetToHeyGen(
            imageFile.buffer,
            imageFile.mimetype
        );
        console.log('Image upload response:', JSON.stringify(imageUploadResponse, null, 2));

        // Extract image_key from response
        const imageKey = imageUploadResponse.data?.image_key || imageUploadResponse.data?.asset_id;
        if (!imageKey) {
            return res.status(500).json({
                error: 'Falha no upload da imagem',
                heygen_response: imageUploadResponse
            });
        }

        // Step 2: Upload audio to HeyGen
        console.log('Step 2: Uploading audio to HeyGen...');
        const audioUploadResponse = await uploadAssetToHeyGen(
            audioFile.buffer,
            audioFile.mimetype
        );
        console.log('Audio upload response:', JSON.stringify(audioUploadResponse, null, 2));

        // Extract audio_asset_id from response
        const audioAssetId = audioUploadResponse.data?.asset_id || audioUploadResponse.data?.id;
        if (!audioAssetId) {
            return res.status(500).json({
                error: 'Falha no upload do áudio',
                heygen_response: audioUploadResponse
            });
        }

        // Step 3: Create Avatar IV Video
        console.log('Step 3: Creating Avatar IV video...');
        console.log(`Using image_key: ${imageKey}`);
        console.log(`Using audio_asset_id: ${audioAssetId}`);

        const videoResponse = await createAvatarIVVideo(imageKey, audioAssetId);
        console.log('Video creation response:', JSON.stringify(videoResponse, null, 2));

        // Return success response
        res.json({
            success: true,
            message: 'Vídeo iniciado com sucesso!',
            image_upload: imageUploadResponse,
            audio_upload: audioUploadResponse,
            video_generation: videoResponse
        });

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);

        // Return error response with HeyGen details
        res.status(error.response?.status || 500).json({
            error: 'Erro na requisição',
            message: error.message,
            heygen_error: error.response?.data || null
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📁 Servindo arquivos estáticos de: ${path.join(__dirname, 'public')}`);
    console.log(`🔑 API Key configurada: ${HEYGEN_API_KEY ? 'Sim' : 'NÃO - Configure HEYGEN_API_KEY!'}`);
    console.log('\n');
});
