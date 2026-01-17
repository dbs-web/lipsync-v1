import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const createVideo = mutation({
    args: { heygenId: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.insert("videos", {
            heygenId: args.heygenId,
            status: "processing",
            createdAt: Date.now(),
        });
    },
});

export const getVideos = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("videos").order("desc").take(10);
    },
});

export const updateStatus = mutation({
    args: {
        heygenId: v.string(),
        status: v.string(),
        url: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        error: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const video = await ctx.db
            .query("videos")
            .filter((q) => q.eq(q.field("heygenId"), args.heygenId))
            .first();

        if (video) {
            await ctx.db.patch(video._id, {
                status: args.status,
                url: args.url,
                thumbnailUrl: args.thumbnailUrl,
                error: args.error,
            });
        }
    },
});
