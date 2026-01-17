import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
    path: "/heygen/callback",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const body = await request.json();
        const { event_type, event_data } = body;

        console.log("Received Webhook:", event_type, event_data);

        if (event_type === "avatar_video.success") {
            await ctx.runMutation(api.videos.updateStatus, {
                heygenId: event_data.video_id,
                status: "completed",
                url: event_data.url,
            });
        } else if (event_type === "avatar_video.fail") {
            await ctx.runMutation(api.videos.updateStatus, {
                heygenId: event_data.video_id,
                status: "failed",
                error: event_data.msg || "Unknown error",
            });
        }

        return new Response("OK", { status: 200 });
    }),
});

export default http;
