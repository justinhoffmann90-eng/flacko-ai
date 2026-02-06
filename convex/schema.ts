import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Activity feed table - stores all agent actions
  activities: defineTable({
    timestamp: v.number(),      // Unix timestamp
    action_type: v.string(),    // "report_generated", "discord_posted", "alert_sent", etc.
    description: v.string(),    // Human-readable description
    metadata: v.optional(v.any()), // Additional data (file paths, URLs, etc.)
    status: v.string(),         // "success", "failed", "pending"
    session_id: v.optional(v.string()), // OpenClaw session ID
    duration_ms: v.optional(v.number()), // How long the action took
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_action_type", ["action_type", "timestamp"]),

  // Scheduled jobs for calendar view
  scheduled_jobs: defineTable({
    name: v.string(),           // Job name
    schedule: v.string(),       // Cron expression or time description
    agent: v.string(),          // Agent responsible
    status: v.string(),         // "active", "paused", "error"
    last_run: v.optional(v.number()), // Unix timestamp
    next_run: v.optional(v.number()), // Unix timestamp
    days: v.optional(v.array(v.string())), // Days of week ["Mon", "Tue", ...]
    time: v.optional(v.string()), // Time of day "HH:MM"
    category: v.optional(v.string()), // "content", "alerts", "maintenance"
    enabled: v.boolean(),
  })
    .index("by_next_run", ["next_run"])
    .index("by_agent", ["agent"]),

  // Searchable documents table
  searchable_documents: defineTable({
    path: v.string(),           // File path
    title: v.string(),          // Extracted title or filename
    content: v.string(),        // Full text content
    category: v.string(),       // "memory", "template", "checklist", "document"
    last_modified: v.number(),  // Unix timestamp
  })
    .index("by_category", ["category"])
    .index("by_path", ["path"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["category"],
    }),
});
