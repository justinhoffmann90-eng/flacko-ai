import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Query to get activities with pagination
export const getActivities = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
    action_type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    let queryBuilder = ctx.db
      .query("activities")
      .withIndex("by_timestamp", (q) => q);
    
    if (args.action_type) {
      queryBuilder = ctx.db
        .query("activities")
        .withIndex("by_action_type", (q) => 
          q.eq("action_type", args.action_type)
        );
    }
    
    const activities = await queryBuilder
      .order("desc")
      .take(limit);
    
    return activities;
  },
});

// Mutation to log a new activity
export const logActivity = mutation({
  args: {
    action_type: v.string(),
    description: v.string(),
    status: v.string(),
    metadata: v.optional(v.any()),
    session_id: v.optional(v.string()),
    duration_ms: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const activityId = await ctx.db.insert("activities", {
      timestamp: Date.now(),
      action_type: args.action_type,
      description: args.description,
      status: args.status,
      metadata: args.metadata,
      session_id: args.session_id,
      duration_ms: args.duration_ms,
    });
    
    return activityId;
  },
});

// Query to get activity counts by type
export const getActivityStats = query({
  args: {},
  handler: async (ctx) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_timestamp")
      .take(1000);
    
    const stats = {
      total: activities.length,
      by_type: {} as Record<string, number>,
      by_status: {
        success: 0,
        failed: 0,
        pending: 0,
      } as Record<string, number>,
    };
    
    for (const activity of activities) {
      stats.by_type[activity.action_type] = (stats.by_type[activity.action_type] || 0) + 1;
      stats.by_status[activity.status] = (stats.by_status[activity.status] || 0) + 1;
    }
    
    return stats;
  },
});

// Query to get recent activities for dashboard
export const getRecentActivities = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
    
    return activities;
  },
});
