import type { RedditListingResponse, RedditPost, QueuedStory } from "@/types/reddit";
import { loadQueue, saveQueue, getAllKnownIds } from "@/lib/queue";

const SUBREDDITS = ["nosleep", "LetsNotMeet", "Paranormal", "Glitch_in_the_Matrix"];
const MIN_UPVOTES = 500;
const USER_AGENT = "yukah-horror-pipeline/0.1 (automated content fetcher)";

async function fetchSubreddit(subreddit: string): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/top.json?limit=25&t=week`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Reddit API error for r/${subreddit}: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as RedditListingResponse;
  const now = new Date().toISOString();

  return json.data.children
    .filter((child) => {
      const d = child.data;
      // Only self-posts (text stories), not stickied mod posts
      return d.is_self && !d.stickied && d.selftext.trim().length > 0;
    })
    .map((child) => {
      const d = child.data;
      return {
        id: d.id,
        subreddit: d.subreddit,
        title: d.title,
        author: d.author,
        selftext: d.selftext,
        url: `https://www.reddit.com${d.permalink}`,
        permalink: d.permalink,
        upvotes: d.score,
        upvoteRatio: d.upvote_ratio,
        numComments: d.num_comments,
        createdUtc: d.created_utc,
        fetchedAt: now,
      };
    });
}

export interface FetchResult {
  added: number;
  skipped: number;
  errors: string[];
  newStories: QueuedStory[];
}

export async function fetchAndQueueStories(): Promise<FetchResult> {
  const queue = loadQueue();
  const knownIds = getAllKnownIds(queue);
  const result: FetchResult = { added: 0, skipped: 0, errors: [], newStories: [] };

  for (const subreddit of SUBREDDITS) {
    let posts: RedditPost[];
    try {
      posts = await fetchSubreddit(subreddit);
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err));
      continue;
    }

    for (const post of posts) {
      if (post.upvotes < MIN_UPVOTES) {
        result.skipped++;
        continue;
      }
      if (knownIds.has(post.id)) {
        result.skipped++;
        continue;
      }

      const story: QueuedStory = {
        ...post,
        status: "pending",
        queuedAt: new Date().toISOString(),
      };

      queue.pending.push(story);
      knownIds.add(post.id);
      result.added++;
      result.newStories.push(story);
    }
  }

  queue.lastFetched = new Date().toISOString();
  saveQueue(queue);

  return result;
}
