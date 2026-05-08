import Anthropic from "@anthropic-ai/sdk";
import type { QueuedStory } from "@/types/reddit";
import { loadQueue, saveQueue } from "@/lib/queue";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a horror narration script editor. Format Reddit horror stories into clean, spoken-word narration scripts.

Rules:
- Remove Reddit-specific text: [Edit], [Update], TL;DR sections, award mentions ("thanks for the awards", "edit: wow this blew up"), and all meta-commentary
- Remove or rephrase usernames and subreddit references that would sound unnatural aloud (e.g. "u/username" → omit, "r/nosleep" → omit)
- Fix formatting issues: normalize paragraph breaks, remove excessive asterisks, markdown symbols, or emoji
- Preserve the author's voice, pacing, and writing style entirely — do not rewrite sentences
- Do not summarize, shorten, or alter narrative content
- Return ONLY the formatted script text with no preamble, title, or commentary`;

export interface FormatResult {
  formatted: number;
  errors: string[];
}

export async function formatApprovedStories(): Promise<FormatResult> {
  const queue = loadQueue();
  const result: FormatResult = { formatted: 0, errors: [] };

  if (queue.approved.length === 0) {
    return result;
  }

  for (const story of queue.approved) {
    try {
      const message = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 16000,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          {
            role: "user",
            content: `Title: ${story.title}\n\n${story.selftext}`,
          },
        ],
      });

      const scriptText = message.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      const wordCount = scriptText.split(/\s+/).filter(Boolean).length;

      story.script = {
        scriptText,
        wordCount,
        estimatedDurationSeconds: Math.round((wordCount / 150) * 60),
        formattedAt: new Date().toISOString(),
      };
      story.status = "scripted";
      result.formatted++;
    } catch (err) {
      result.errors.push(
        `[${story.id}] ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // Move successfully scripted stories out of approved
  const failed = new Set(
    result.errors.map((e) => e.match(/^\[(\w+)\]/)?.[1]).filter(Boolean)
  );
  queue.scripted.push(...queue.approved.filter((s) => s.status === "scripted"));
  queue.approved = queue.approved.filter(
    (s) => s.status !== "scripted" || failed.has(s.id)
  );

  saveQueue(queue);
  return result;
}
