import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    videos: defineTable({
        heygenId: v.string(),
        status: v.string(), // 'processing', 'completed', 'failed'
        url: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        error: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_status", ["status"]),
});
