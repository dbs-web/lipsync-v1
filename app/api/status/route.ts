import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import axios from 'axios';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get('videoId');

        if (!videoId) {
            return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
        }

        console.log(`Checking status for video: ${videoId}`);

        // 1. Fetch Status from HeyGen
        const heygenResp = await axios.get(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
            headers: {
                'X-API-KEY': HEYGEN_API_KEY,
                'Accept': 'application/json'
            }
        });

        const data = heygenResp.data?.data;
        if (!data) {
            throw new Error("Invalid response from HeyGen");
        }

        const { status, video_url, thumbnail_url, error } = data;
        console.log(`HeyGen Status: ${status}, URL: ${video_url}, Thumbnail: ${thumbnail_url}`);

        // Map HeyGen status to our status
        // HeyGen v1 statuses: 'waiting', 'processing', 'completed', 'failed'
        // HeyGen v2 might differ, but v1 endpoint works for v2 videos usually.
        // Let's check consistency.

        let dbStatus = 'processing';
        if (status === 'completed') dbStatus = 'completed';
        else if (status === 'failed') dbStatus = 'failed';

        // 2. Update Convex
        await convex.mutation(api.videos.updateStatus, {
            heygenId: videoId,
            status: dbStatus,
            url: video_url || undefined,
            thumbnailUrl: thumbnail_url || undefined,
            error: error || undefined
        });

        return NextResponse.json({ success: true, status: dbStatus, url: video_url });

    } catch (err: any) {
        console.error("Status Check Error:", err.message);
        return NextResponse.json(
            { error: err.message, details: err.response?.data },
            { status: 500 }
        );
    }
}
