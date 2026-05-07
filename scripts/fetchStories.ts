import { fetchAndQueueStories } from "../src/lib/redditFetcher";

async function main() {
  console.log("Fetching horror stories from Reddit...\n");

  const result = await fetchAndQueueStories();

  if (result.errors.length > 0) {
    console.error("Errors encountered:");
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    console.log();
  }

  console.log(`Results:`);
  console.log(`  Added to queue : ${result.added}`);
  console.log(`  Skipped        : ${result.skipped}`);

  if (result.newStories.length > 0) {
    console.log("\nNew stories queued:");
    for (const story of result.newStories) {
      console.log(`  [${story.subreddit}] "${story.title}" — ${story.upvotes} upvotes`);
    }
  }

  console.log("\nQueue saved to src/data/queue.json");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
