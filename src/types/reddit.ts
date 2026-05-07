export interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  author: string;
  selftext: string;
  url: string;
  permalink: string;
  upvotes: number;
  upvoteRatio: number;
  numComments: number;
  createdUtc: number;
  fetchedAt: string;
}

export type QueueStatus = "pending" | "approved" | "processed" | "rejected";

export interface QueuedStory extends RedditPost {
  status: QueueStatus;
  queuedAt: string;
}

export interface StoryQueue {
  pending: QueuedStory[];
  approved: QueuedStory[];
  processed: QueuedStory[];
  rejected: QueuedStory[];
  lastFetched: string | null;
}

// Shape of a Reddit listing API response
export interface RedditListingResponse {
  data: {
    children: Array<{
      kind: string;
      data: {
        id: string;
        subreddit: string;
        title: string;
        author: string;
        selftext: string;
        url: string;
        permalink: string;
        score: number;
        upvote_ratio: number;
        num_comments: number;
        created_utc: number;
        is_self: boolean;
        stickied: boolean;
        over_18: boolean;
      };
    }>;
  };
}
