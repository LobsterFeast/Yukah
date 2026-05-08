import fs from "fs";
import path from "path";
import type { StoryQueue } from "@/types/reddit";

export const QUEUE_PATH = path.join(process.cwd(), "src/data/queue.json");

export function loadQueue(): StoryQueue {
  if (!fs.existsSync(QUEUE_PATH)) {
    return emptyQueue();
  }
  const raw = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf-8"));
  return {
    pending: raw.pending ?? [],
    approved: raw.approved ?? [],
    scripted: raw.scripted ?? [],
    audioReady: raw.audioReady ?? [],
    processed: raw.processed ?? [],
    rejected: raw.rejected ?? [],
    lastFetched: raw.lastFetched ?? null,
  };
}

export function saveQueue(queue: StoryQueue): void {
  fs.mkdirSync(path.dirname(QUEUE_PATH), { recursive: true });
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

export function getAllKnownIds(queue: StoryQueue): Set<string> {
  return new Set(
    [
      ...queue.pending,
      ...queue.approved,
      ...queue.scripted,
      ...queue.audioReady,
      ...queue.processed,
      ...queue.rejected,
    ].map((s) => s.id)
  );
}

function emptyQueue(): StoryQueue {
  return {
    pending: [],
    approved: [],
    scripted: [],
    audioReady: [],
    processed: [],
    rejected: [],
    lastFetched: null,
  };
}
