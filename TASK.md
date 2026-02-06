Content Hub UI/UX overhaul and prompt improvements

## Working directory
/Users/trunks/Flacko_AI/flacko-ai

## Files to modify
1. app/admin/content/page.tsx - Major UI changes
2. app/api/content/hub/route.ts - System prompt improvements
3. app/api/content/weekly-thread/route.ts - System prompt improvements  
4. app/api/content/ai-generate/route.ts - System prompt improvements
5. lib/content/tweetTextGenerator.ts - Improve tweet generation
6. lib/content/formatThread.ts - Improve thread formatting

## UI Changes Required (page.tsx)

### 1. Top Section Cleanup
- DELETE "Copy All Tweets" button (handleCopyAll function and its usage)
- DELETE "Download All PNG" button (handleDownloadAll function and its usage)
- DELETE the dropdown toggle for Reports/Morning Brief etc (selectedDiscordChannel select in sticky header)

### 2. Layout Changes (All Sections)
- Move CTA buttons to the RIGHT side instead of left in all sections
- Remove ALL "Open in X" buttons everywhere (search for createTweetIntent usage)
- Remove "Post & Copy" buttons (Post to Discord buttons can stay, but remove dual-function buttons)

### 3. Weekly Scorecard Specific
- CONSOLIDATE the 6 separate tweet fields into ONE consolidated text area
- Should show the full thread as continuous text, not split into separate fields
- Replace the individual tweet boxes with a single textarea showing threadForCopy
- Keep the Copy button for the consolidated thread

### 4. New Features
- Add a "Refresh" button that regenerates the copy for each section (Daily Mode Card, Morning Levels Card, EOD Accuracy Card, Weekly Scorecard)
- The refresh should call the appropriate API to regenerate content

### 5. Section Reordering
- AI Content Studio -> FIRST (top)
- Tweet Drafts -> SECOND
- Then remaining sections (Daily Mode Card, Morning Levels Card, EOD Accuracy Card, Weekly Scorecard, Quote Image Generator, X Article Builder)

## System Prompt Improvements (CRITICAL)

For ALL prompt files (ai-generate/route.ts, hub/route.ts, weekly-thread/route.ts, and lib/content files):

Reference the persona in /Users/trunks/clawd/x-persona.md:
- Add MORE substance and details to output text
- User prefers having more content to delete/edit rather than too little
- Maintain the Lord Pretty Flacko persona (all lowercase, battlefield briefing tone)
- INCREASE explanation value - make complex concepts easy to understand
- Use terms like: intel update, battlefield update, campaign briefing, war room update, trenches report, soldier reminder
- Tone: chaotic but highly intelligent TSLA war general
- Writing style: all lowercase, punchy, direct, confident sentences
- Content composition: 50-60% structural market analysis, 25-35% trench humor, 10-20% trader psychology

Specific improvements needed:
1. app/api/content/ai-generate/route.ts - Update SYSTEM_PROMPT constant
2. lib/content/tweetTextGenerator.ts - Update all tweet generation functions with more substance
3. lib/content/formatThread.ts - Update weekly thread formatting with battlefield tone

## After changes:
1. npm run build (must pass)
2. Report back summary of all changes made

## Current key functions/components in page.tsx:
- handleCopyAll (DELETE)
- handleDownloadAll (DELETE)
- WeeklyScorecardSection (MODIFY - consolidate tweets)
- AIContentStudio (MOVE to top)
- Tweet Drafts section (MOVE to second)
- Daily Mode Card, Morning Levels, EOD Accuracy sections (move down)
- createTweetIntent usage (REMOVE all "Open in X" buttons)
- selectedDiscordChannel select in sticky header (DELETE)

Be careful to preserve all existing functionality while making these changes. The Refresh button should trigger regeneration of content from the API.
