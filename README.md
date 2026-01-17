# Lipsync v1

Lipsync v1 is a Next.js application that integrates with the **HeyGen API** to generate Avatar IV videos synchronization from uploaded images and audio files. It uses **Convex** as a real-time backend database to manage video generation status and history.

## Features

- **Video Generation**: Upload an image (portrait or landscape) and audio file to generate a talking avatar video.
- **Auto-Orientation**: Automatically detects uploaded image orientation and requests the correct video aspect ratio (1920x1080 or 1080x1920).
- **Real-time Updates**: Status changes (Processing → Completed) are reflected instantly in the UI via Convex subscriptions.
- **Video Gallery**: View a history of generated videos with thumbnails.
- **Modal Player**: Watch generated videos directly within the app in a rich modal player.
- **Manual Status Check**: Fallback "Refresh" button to manually sync status with HeyGen if webhooks are delayed.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Backend/Database**: [Convex](https://convex.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **External API**: [HeyGen API](https://docs.heygen.com/)

## Prerequisites

- Node.js 18+
- HeyGen API Key (Enterprise/Pro plan required for Avatar IV)
- Convex Account (free tier works)

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd lipsync-v1
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   # HeyGen API Key
   HEYGEN_API_KEY=your_heygen_api_key_here

   # Convex Code (Managed automatically by npx convex dev)
   CONVEX_DEPLOYMENT=...
   NEXT_PUBLIC_CONVEX_URL=...
   ```

4. **Initialize Convex:**
   ```bash
   npx convex dev
   ```
   Follow the prompts to log in and configure your Convex project. This will automatically update your `.env.local` with `NEXT_PUBLIC_CONVEX_URL`.

5. **Run the Development Server:**
   In a separate terminal (keeping `npx convex dev` running):
   ```bash
   npm run dev
   ```

6. **Open the App:**
   Navigate to [http://localhost:3000](http://localhost:3000).

## Project Structure

- `app/` - Next.js App Router pages and API routes.
  - `api/generate/` - Endpoint to upload assets and trigger HeyGen generation.
  - `api/status/` - Endpoint to manually check video status from HeyGen.
- `components/` - React components (e.g., `VideoGenerator.tsx`).
- `convex/` - Backend logic.
  - `schema.ts` - Database schema definition.
  - `videos.ts` - Public and internal mutations/queries.
  - `http.ts` - Webhook handler for HeyGen callbacks.
- `legacy/` - Contains the previous Express/Node.js implementation files.

## Webhooks

The application includes a webhook handler at `/heygen/callback` (configured in `convex/http.ts`) to receive automatic status updates from HeyGen. Ensure your HeyGen payload includes this callback URL (handled automatically by `app/api/generate/route.ts`).

__