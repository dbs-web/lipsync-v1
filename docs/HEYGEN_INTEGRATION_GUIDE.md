# HeyGen Integration Guide (Standalone)

This guide details how to implement HeyGen video generation, callback handling, and video display in a Next.js application.

## 1. Environment & Security

### `HEYGEN_SECRET` Explained
The `HEYGEN_SECRET` is a **webhook secret** provided by HeyGen (usually in their dashboard settings). It is used to **verify the authenticity** of the callback requests to ensure they actually came from HeyGen and not an attacker.

**Mechanism:**
1.  HeyGen signs the request body using `HMAC-SHA256` with your secret.
2.  They send this signature in the `signature` header.
3.  Your server re-calculates the signature and compares it.

### Required Environment Variables
```env
# HeyGen API Key (from https://app.heygen.com/settings/api)
HEYGEN_API_KEY=your_api_key_here

# HeyGen Webhook Secret (for signature verification)
HEYGEN_SECRET=your_webhook_secret_here

# Your App's Public URL
NEXT_PUBLIC_APP_URL=https://your-app.com
```
*(Note: `HEYGEN_API_URL` is typically not needed if you use the standard `https://api.heygen.com` endpoints)*

---

## 2. Backend Implementation (Next.js App Router)

### A. The Adapter (Helper Class)
Create a helper to manage API calls and Security.

`src/lib/heygen/adapter.ts`
```typescript
import { createHmac } from 'crypto';

export class HeyGenAdapter {
  private apiKey = process.env.HEYGEN_API_KEY!;
  private secret = process.env.HEYGEN_SECRET!;

  // 1. Generate Video
  async generateVideo(payload: any) {
    return fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify(payload),
    });
  }

  // 2. Verify Callback Signature
  async verifySignature(request: Request, bodyText: string): Promise<boolean> {
    const signature = request.headers.get('signature') || '';
    if (!signature) return false;

    const hmac = createHmac('sha256', this.secret);
    hmac.update(bodyText, 'utf-8');
    const computedSignature = hmac.digest('hex');

    return signature === computedSignature;
  }
}
```

### B. The Callback Route
Handle the async completion hook.

[src/app/api/heygen/callback/route.ts](file:///d:/kairos/src/app/api/heygen/callback/route.ts)
```typescript
import { NextResponse } from 'next/server';
import { HeyGenAdapter } from '@/lib/heygen/adapter';
// Import your DB client (e.g., Prisma)
import { db } from '@/lib/db'; 

export async function POST(request: Request) {
  const adapter = new HeyGenAdapter();
  
  // 1. Get raw text for signature verification
  const bodyText = await request.text();
  
  // 2. Verify Security
  const isValid = await adapter.verifySignature(request, bodyText);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const body = JSON.parse(bodyText);
  const { event_type, event_data } = body;

  // 3. Handle Success
  if (event_type === 'avatar_video.success') {
    const { video_id, url } = event_data;

    // UPDATE functionality:
    // Update your database to mark video as ready
    await db.video.update({
      where: { heygenId: video_id },
      data: { 
        url: url,
        status: 'COMPLETED'
      }
    });

    return NextResponse.json({ received: true });
  }

  // 4. Handle Failure
  if (event_type === 'avatar_video.fail') {
     const { video_id, msg } = event_data;
     await db.video.update({
      where: { heygenId: video_id },
      data: { status: 'FAILED', error: msg }
    });
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ message: 'Ignored event' });
}
```

---

## 3. Frontend Implementation

### A. Triggering Generation
Call your own API, which then calls HeyGen, ensuring you attach the `callback_id`.

```typescript
// Client-side function
const generateVideo = async () => {
  const res = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: {
       'x-api-key': 'YOUR_KEY_BUT_BETTER_PROXY_THROUGH_YOUR_BACKEND' 
    },
    body: JSON.stringify({
      video_inputs: [{ /* ... settings ... */ }],
      // CRITICAL: Point back to your server
      callback_id: `${process.env.NEXT_PUBLIC_APP_URL}/api/heygen/callback` 
    })
  });
  
  const data = await res.json();
  // SAVE data.data.video_id to your local DB immediately with status 'PROCESSING'
};
```

### B. Displaying the Result
Since the process is async, you must poll your own database.

`src/components/VideoPlayer.tsx`
```tsx
'use client';
import { useState, useEffect } from 'react';

export default function VideoPlayer({ videoId }) {
  const [video, setVideo] = useState(null);

  useEffect(() => {
    let interval;
    
    const checkStatus = async () => {
      // Endpoint that queries YOUR db
      const res = await fetch(\`/api/videos/\${videoId}\`);
      const data = await res.json();
      
      setVideo(data);

      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        clearInterval(interval);
      }
    };

    // Poll every 3 seconds
    interval = setInterval(checkStatus, 3000);
    checkStatus(); // Initial check

    return () => clearInterval(interval);
  }, [videoId]);

  if (!video) return <div>Loading...</div>;
  
  if (video.status === 'PROCESSING') {
    return <div className="animate-pulse">Gerando vídeo... (Aguarde)</div>;
  }

  if (video.status === 'FAILED') {
    return <div className="text-red-500">Erro: {video.error}</div>;
  }

  return (
    <video controls src={video.url} className="w-full rounded-xl shadow-lg" />
  );
}
```

## Summary Checklist
1.  [ ] **Env**: Set `HEYGEN_API_KEY` and `HEYGEN_SECRET`.
2.  [ ] **DB**: Create a table/collection to store `video_id`, `status`, and `url`.
3.  [ ] **Generate**: Send `callback_id` pointing to your route.
4.  [ ] **Save**: Immediately save the `video_id` in DB as `PROCESSING`.
5.  [ ] **Callback**: Verify signature -> Update DB with `url` + `COMPLETED`.
6.  [ ] **Frontend**: Poll DB -> Render `<video />` when URL is ready.
