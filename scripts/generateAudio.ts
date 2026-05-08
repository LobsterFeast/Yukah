import { generateAudioForScripted } from "../src/lib/audioGenerator";

async function main() {
  console.log("Generating audio for scripted stories...\n");

  const result = await generateAudioForScripted();

  if (result.errors.length > 0) {
    console.error("Errors:");
    for (const err of result.errors) {
      console.error(`  ${err}`);
    }
    console.log();
  }

  if (result.generated === 0 && result.errors.length === 0) {
    console.log("No scripted stories ready. Run format-scripts first.");
    return;
  }

  console.log(`Generated : ${result.generated}`);
  console.log(`Errors    : ${result.errors.length}`);
  console.log("\nAudio files saved to src/data/audio/");
  console.log("Stories moved to audioReady in src/data/queue.json");
  console.log("\nNote: multi-part stories are saved as {id}_part1.mp3, {id}_part2.mp3, etc.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
