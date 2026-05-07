# Yukah — Horror Narration Automation Pipeline

## Project Overview

Automated pipeline that sources horror stories from Reddit, converts them to narration-ready scripts, generates AI audio, and uploads to YouTube/Spotify.

**Stack:** Next.js, TypeScript, Claude API, ElevenLabs API, YouTube Data API

## Pipeline Steps

1. **Reddit Story Fetcher** — Fetch top posts from horror subreddits, filter, queue for review
2. **Script Formatter** — Claude API cleans/formats stories into narration scripts
3. **Audio Generation** — ElevenLabs API converts scripts to audio
4. **Upload** — YouTube Data API publishes finished content

## Step 1: Reddit Story Fetcher

- **Subreddits:** r/nosleep, r/LetsNotMeet, r/Paranormal, r/Glitch_in_the_Matrix
- **Endpoint:** `https://www.reddit.com/r/{subreddit}/top.json?limit=25&t=week`
- **Filter:** minimum 500 upvotes, exclude previously queued/processed posts
- **Output:** `src/data/queue.json` — stories staged for human approval before processing

## Queue File Structure

```json
{
  "pending": [],
  "approved": [],
  "processed": [],
  "rejected": [],
  "lastFetched": "ISO date string"
}
```

## Running the Fetcher

```bash
npm run fetch-stories
```

## Project Structure

```
src/
  lib/
    redditFetcher.ts   # Core fetch + filter logic
  data/
    queue.json         # Local story queue
  types/
    reddit.ts          # Shared TypeScript types
scripts/
  fetchStories.ts      # CLI entry point
```

## Environment Variables

None required for Step 1. Reddit JSON feeds are public.

## Development Notes

- Use `tsx` to run TypeScript scripts directly: `npx tsx scripts/fetchStories.ts`
- Reddit JSON API requires a descriptive `User-Agent` header to avoid rate limiting
- Posts are deduplicated by Reddit post ID across all queue states
