import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import axios from 'axios';

// Initialize Convex Client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const HEYGEN_UPLOAD_URL = 'https://upload.heygen.com/v1/asset';
const HEYGEN_VIDEO_URL = 'https://api.heygen.com/v2/video/av4/generate';

// Helper to upload asset
async function uploadAssetToHeyGen(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const response = await axios.post(HEYGEN_UPLOAD_URL, buffer, {
        headers: {
            'Content-Type': file.type,
            'X-API-KEY': HEYGEN_API_KEY,
        },
    });
    return response.data;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const audio = formData.get('audio') as File;
        const aspectRatio = formData.get('aspectRatio') as string || 'portrait';

        if (!image || !audio) {
            return NextResponse.json({ error: 'Missing files' }, { status: 400 });
        }

        // 1. Upload Assets
        console.log('Uploading image...');
        const imageResp = await uploadAssetToHeyGen(image);
        const imageKey = imageResp.data?.image_key || imageResp.data?.asset_id;

        console.log('Uploading audio...');
        const audioResp = await uploadAssetToHeyGen(audio);
        const audioAssetId = audioResp.data?.asset_id || audioResp.data?.id;

        if (!imageKey || !audioAssetId) {
            throw new Error("Failed to upload assets to HeyGen");
        }

        // 2. Prepare HeyGen Payload - Only portrait or landscape
        let dimension;
        if (aspectRatio === 'landscape') {
            dimension = { width: 1920, height: 1080 };
        } else {
            dimension = { width: 1080, height: 1920 }; // Portrait default
        }

        const callbackUrl = `${process.env.CONVEX_URL!.replace('.cloud', '.site')}/heygen/callback`;
        console.log('Callback URL:', callbackUrl);

        // 3. Initiate Video Generation
        const payload: any = {
            image_key: imageKey,
            video_title: `Video_${Date.now()}`,
            audio_asset_id: audioAssetId,
            fit: 'cover',
            callback_id: callbackUrl
        };

        if (dimension) payload.dimension = dimension;
        // v2 API often prefers dimension over video_orientation for specific control, 
        // but if we wanted to use video_orientation:
        // payload.video_orientation = aspectRatio === 'square' ? undefined : aspectRatio;

        const generateResp = await axios.post(HEYGEN_VIDEO_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': HEYGEN_API_KEY,
            }
        });

        const videoId = generateResp.data.data.video_id;

        // 4. Save to Convex
        await convex.mutation(api.videos.createVideo, { heygenId: videoId });

        return NextResponse.json({ success: true, videoId });

    } catch (error: any) {
        console.error("Generation Error:", error.response?.data || error.message);
        return NextResponse.json(
            { error: error.message, details: error.response?.data },
            { status: 500 }
        );
    }
}
