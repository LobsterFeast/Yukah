import { formatApprovedStories } from "../src/lib/scriptFormatter";

async function main() {
  console.log("Formatting approved stories into narration scripts...\n");

  const result = await formatApprovedStories();

  if (result.errors.length > 0) {
    console.error("Errors:");
    for (const err of result.errors) {
      console.error(`  ${err}`);
    }
    console.log();
  }

  if (result.formatted === 0 && result.errors.length === 0) {
    console.log("No approved stories to format. Approve stories in src/data/queue.json first.");
    return;
  }

  console.log(`Formatted : ${result.formatted}`);
  console.log(`Errors    : ${result.errors.length}`);
  console.log("\nScripted stories saved to src/data/queue.json (scripted array)");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
