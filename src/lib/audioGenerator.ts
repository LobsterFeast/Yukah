import fs from "fs";
import path from "path";
import type { QueuedStory } from "@/types/reddit";
import { loadQueue, saveQueue } from "@/lib/queue";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";
const AUDIO_OUTPUT_DIR = path.join(process.cwd(), "src/data/audio");
// Max chars ElevenLabs accepts per request; split at paragraph boundaries below this
const CHUNK_MAX_CHARS = 4500;

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`${key} environment variable is not set`);
  return val;
}

function chunkText(text: string): string[] {
  if (text.length <= CHUNK_MAX_CHARS) return [text];

  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let current = "";

  for (const para of paragraphs) {
    if (current && current.length + para.length + 2 > CHUNK_MAX_CHARS) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

async function synthesizeChunk(
  text: string,
  apiKey: string,
  voiceId: string,
  modelId: string
): Promise<Buffer> {
  const res = await fetch(`${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs API error ${res.status}: ${body}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

export interface AudioResult {
  generated: number;
  errors: string[];
}

export async function generateAudioForScripted(): Promise<AudioResult> {
  const apiKey = requireEnv("ELEVENLABS_API_KEY");
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "pNInz6obpgDQGcFmaJgB"; // Adam
  const modelId = process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2";

  const queue = loadQueue();
  const result: AudioResult = { generated: 0, errors: [] };

  if (queue.scripted.length === 0) {
    return result;
  }

  fs.mkdirSync(AUDIO_OUTPUT_DIR, { recursive: true });

  for (const story of queue.scripted) {
    if (!story.script) {
      result.errors.push(`[${story.id}] Missing script — run format-scripts first`);
      continue;
    }

    try {
      const chunks = chunkText(story.script.scriptText);
      const audioParts: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const audio = await synthesizeChunk(chunks[i], apiKey, voiceId, modelId);
        const suffix = chunks.length > 1 ? `_part${i + 1}` : "";
        const filename = `${story.id}${suffix}.mp3`;
        const filepath = path.join(AUDIO_OUTPUT_DIR, filename);
        fs.writeFileSync(filepath, audio);
        audioParts.push(`src/data/audio/${filename}`);
      }

      story.audioParts = audioParts;
      story.audioGeneratedAt = new Date().toISOString();
      story.status = "audio_ready";
      result.generated++;
    } catch (err) {
      result.errors.push(
        `[${story.id}] ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  queue.audioReady.push(...queue.scripted.filter((s) => s.status === "audio_ready"));
  queue.scripted = queue.scripted.filter((s) => s.status !== "audio_ready");

  saveQueue(queue);
  return result;
}
