import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Query to get all scheduled jobs
export const getScheduledJobs = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let queryBuilder = ctx.db.query("scheduled_jobs");
    
    if (args.category) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("category"), args.category));
    }
    
    const jobs = await queryBuilder.collect();
    return jobs;
  },
});

// Query to get jobs for a specific week
export const getJobsForWeek = query({
  args: {
    week_start: v.number(), // Unix timestamp for start of week
  },
  handler: async (ctx, args) => {
    const weekEnd = args.week_start + 7 * 24 * 60 * 60 * 1000;
    
    const jobs = await ctx.db
      .query("scheduled_jobs")
      .withIndex("by_next_run")
      .filter((q) =>
        q.and(
          q.gte(q.field("next_run"), args.week_start),
          q.lt(q.field("next_run"), weekEnd)
        )
      )
      .collect();
    
    return jobs;
  },
});

// Mutation to add or update a scheduled job
export const upsertScheduledJob = mutation({
  args: {
    name: v.string(),
    schedule: v.string(),
    agent: v.string(),
    status: v.string(),
    days: v.optional(v.array(v.string())),
    time: v.optional(v.string()),
    category: v.optional(v.string()),
    enabled: v.boolean(),
    last_run: v.optional(v.number()),
    next_run: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if job already exists
    const existing = await ctx.db
      .query("scheduled_jobs")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    
    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        schedule: args.schedule,
        agent: args.agent,
        status: args.status,
        days: args.days,
        time: args.time,
        category: args.category,
        enabled: args.enabled,
        last_run: args.last_run,
        next_run: args.next_run,
      });
      return existing._id;
    } else {
      // Create new
      const jobId = await ctx.db.insert("scheduled_jobs", {
        name: args.name,
        schedule: args.schedule,
        agent: args.agent,
        status: args.status,
        days: args.days,
        time: args.time,
        category: args.category,
        enabled: args.enabled,
        last_run: args.last_run,
        next_run: args.next_run,
      });
      return jobId;
    }
  },
});

// Mutation to update job run status
export const updateJobRun = mutation({
  args: {
    job_id: v.id("scheduled_jobs"),
    status: v.string(),
    last_run: v.number(),
    next_run: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.job_id, {
      status: args.status,
      last_run: args.last_run,
      next_run: args.next_run,
    });
  },
});

// Query to get jobs grouped by agent
export const getJobsByAgent = query({
  args: {},
  handler: async (ctx) => {
    const jobs = await ctx.db.query("scheduled_jobs").collect();
    
    const grouped: Record<string, typeof jobs> = {};
    for (const job of jobs) {
      if (!grouped[job.agent]) {
        grouped[job.agent] = [];
      }
      grouped[job.agent].push(job);
    }
    
    return grouped;
  },
});
