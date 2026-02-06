# AI Template Editor Feature

## Overview
Implement an AI Template Editor in the Content Hub (admin page) that allows editing of message templates used throughout the application.

## Scope
- **Location**: Content Hub (/admin page)
- **Purpose**: Edit Discord and Email templates dynamically
- **Templates Managed**:
  1. Discord Alert Messages (`lib/discord/templates.ts`)
  2. Discord New Report Messages (`lib/discord/templates.ts`)
  3. Email Templates (`lib/resend/templates.ts`)

## Implementation Plan

### Step 1: Create API Endpoint
Create `/app/api/templates/route.ts` with:
- `GET /api/templates` - List all available templates with metadata
- `POST /api/templates` - Update a specific template

### Step 2: Create React Component
Create `TemplateEditor` component with:
- Template selector dropdown
- Monaco-like editor or textarea for template content
- Variable injection hints (e.g., {{mode}}, {{price}}, {{level_name}})
- Preview functionality
- Save/Cancel buttons

### Step 3: Integrate into Admin Page
Add to `/app/admin/page.tsx`:
- Import TemplateEditor component
- Add new card section for Template Editor in Quick Actions area
- Mount the component

### Step 4: Verify and Deploy
- Run build verification
- Commit with message: "feat: Add AI Template Editor to Content Hub"
- Push to deploy

## Template Structure
Templates use variables like:
- `{{mode}}` - Traffic light mode (green/yellow/orange/red)
- `{{price}}` - Price value
- `{{level_name}}` - Level name (e.g., "Call Wall")
- `{{action}}` - Action text (e.g., "Trim 25%")
- `{{reason}}` - Contextual reason
- `{{reportDate}}` - Report date string
- `{{positioning}}` - Positioning text

## Security Note
This is an admin-only feature. The API route should verify admin authentication.
