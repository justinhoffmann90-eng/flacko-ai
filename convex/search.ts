import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Query to search documents
export const searchDocuments = query({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    let searchResults;
    
    if (args.category) {
      searchResults = await ctx.db
        .query("searchable_documents")
        .withSearchIndex("search_content", (q) =>
          q.search("content", args.query).eq("category", args.category)
        )
        .take(limit);
    } else {
      searchResults = await ctx.db
        .query("searchable_documents")
        .withSearchIndex("search_content", (q) =>
          q.search("content", args.query)
        )
        .take(limit);
    }
    
    return searchResults;
  },
});

// Query to get documents by category
export const getDocumentsByCategory = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    const documents = await ctx.db
      .query("searchable_documents")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .order("desc")
      .take(limit);
    
    return documents;
  },
});

// Mutation to add or update a document
export const upsertDocument = mutation({
  args: {
    path: v.string(),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    last_modified: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if document already exists
    const existing = await ctx.db
      .query("searchable_documents")
      .withIndex("by_path", (q) => q.eq("path", args.path))
      .first();
    
    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        title: args.title,
        content: args.content,
        category: args.category,
        last_modified: args.last_modified,
      });
      return existing._id;
    } else {
      // Create new
      const docId = await ctx.db.insert("searchable_documents", {
        path: args.path,
        title: args.title,
        content: args.content,
        category: args.category,
        last_modified: args.last_modified,
      });
      return docId;
    }
  },
});

// Mutation to delete a document
export const deleteDocument = mutation({
  args: {
    path: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("searchable_documents")
      .withIndex("by_path", (q) => q.eq("path", args.path))
      .first();
    
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

// Query to get all categories
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const documents = await ctx.db.query("searchable_documents").collect();
    const categories = new Set(documents.map((d) => d.category));
    return Array.from(categories);
  },
});

// Query to get recent documents
export const getRecentDocuments = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    const documents = await ctx.db
      .query("searchable_documents")
      .order("desc")
      .take(limit);
    
    return documents;
  },
});
