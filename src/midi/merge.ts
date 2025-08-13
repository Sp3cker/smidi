import { readMidiFile } from "./reader.ts";
import type { MergeWarning, SongModel, AnyEvent } from "./types.ts";
function joinSimple(a: string, b: string): string { return a.endsWith("/") ? a + b : `${a}/${b}`; }

export async function mergeDirectoryToSong(dir: string): Promise<{ song: SongModel; warnings: MergeWarning[] }> {
  const entries: string[] = [];
  for await (const e of Deno.readDir(dir)) {
    if (!e.isFile) continue;
    if (!e.name.toLowerCase().endsWith(".mid") && !e.name.toLowerCase().endsWith(".midi")) continue;
  entries.push(joinSimple(dir, e.name));
  }
  entries.sort();

  let base: SongModel | null = null;
  const warnings: MergeWarning[] = [];
  const tracks: AnyEvent[][] = [];

  for (const p of entries) {
    const sm = await readMidiFile(p);
    if (!base) base = sm;
    else {
      // Division conflicts: warn if not same; keep first file's division
      const eq = JSON.stringify(base.division) === JSON.stringify(sm.division);
      if (!eq) warnings.push(`Division conflict in ${p}; normalizing to first file's division`);
    }

    const channelHint = extractChannelFromFilename(p);
    tracks.push(remapTrack(sm, channelHint));
  }

  if (!base) {
    // default empty song
    base = { division: { type: "tpq", ticksPerQuarter: 480 }, tracks: [] };
  }

  const merged: SongModel = { division: base.division, tracks: tracks.map((evs) => ({ events: evs })) };
  return { song: merged, warnings };
}

function extractChannelFromFilename(path: string): number | null {
  const m = path.match(/(\d{1,2})(?=\D*$)/);
  if (!m) return null;
  const n = Number(m[1]);
  if (n >= 1 && n <= 16) return n;
  return null;
}

function remapTrack(song: SongModel, channelHint: number | null): AnyEvent[] {
  // Flatten song tracks into one stream keeping deltas, remap channel events to avoid collisions.
  // Basic strategy: if channelHint provided, map all channel events to that channel; else keep original.
  const out: AnyEvent[] = [];
  for (const trk of song.tracks) {
    for (const ev of trk.events) {
      if ((ev as unknown as { channel?: number }).channel !== undefined) {
        const original = (ev as unknown as { channel?: number }).channel ?? 1;
        const ch = channelHint ?? original;
        out.push({ ...(ev as Record<string, unknown>), channel: ch } as unknown as AnyEvent);
      } else {
        out.push(ev);
      }
    }
  }
  return out;
}
