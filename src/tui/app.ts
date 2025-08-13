// Minimal ANSI TUI skeleton with channels view and loop marker actions.
import { loadDraculaTheme, colorize } from "./colors.ts";
import { mergeDirectoryToSong } from "../midi/merge.ts";
import { insertLoopMarkers, Grid } from "../midi/loop.ts";

export async function runTui(args: string[]) {
  const [inputDir = ".", ...rest] = args;
  const themeFlagIdx = rest.indexOf("--theme");
  const themePath = themeFlagIdx >= 0 ? rest[themeFlagIdx + 1] : undefined;
  const palette = await loadDraculaTheme(themePath);

  // Load data (lazy, until first render)
  const { song, warnings } = await mergeDirectoryToSong(inputDir);

  // State
  const visible = new Set<number>(Array.from({ length: 16 }, (_, i) => i + 1));
  let cursorTick = 0;
  let loop: { start: number | null; end: number | null } = { start: null, end: null };
  const ppq = song.division.type === "tpq" ? song.division.ticksPerQuarter : song.division.ticksPerFrame;
  const grid: Grid = { ppq, snap: 1 }; // snap=1 beat

  // Terminal setup
  const encoder = new TextEncoder();
  const write = (s: string) => Deno.stdout.write(encoder.encode(s));
  const hideCursor = "\x1b[?25l";
  const showCursor = "\x1b[?25h";
  const clear = "\x1b[2J\x1b[H";
  const bold = (s: string) => `\x1b[1m${s}\x1b[22m`;

  const render = async () => {
    let out = clear;
    out += bold("smidi — MIDI Dir -> Format 0 (TUI)\n");
  if (warnings.length) out += warnings.map((w: string) => `⚠️  ${w}\n`).join("");
    out += "\nChannels (v=toggle visibility, c=recolor N/A here, arrows=navigate, m=mark loop, q=quit)\n";

    for (let ch = 1; ch <= 16; ch++) {
      const color = palette.byChannel.get(ch)!;
      const name = `Ch ${ch.toString().padStart(2, "0")}`;
      const tag = visible.has(ch) ? "[on ]" : "[off]";
      out += `${colorize(name, color)} ${tag}  `;
      if (ch % 4 === 0) out += "\n";
    }

    out += "\n\nTimeline (tick cursor shown):\n";
    out += `Tick: ${cursorTick}`;
    if (loop.start != null) out += `  LoopStart: ${loop.start}`;
    if (loop.end != null) out += `  LoopEnd: ${loop.end}`;
    out += "\n";

    await write(out);
  };

  // Key handling
  await write(hideCursor);
  await render();

  const shouldRaw = Deno.stdin.isTerminal?.() ?? false;
  if (shouldRaw) Deno.stdin.setRaw(true);
  const reader = Deno.stdin.readable.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      const s = new TextDecoder().decode(value);
      const bytes = new Uint8Array(value);
      // Arrow keys
      if (s === "q") break;
      if (s === "m") {
        const { start, end } = insertLoopMarkers(song, cursorTick, grid);
        loop = { start, end };
      } else if (s === "v") {
        // Toggle current channel by cursorTick -> derive channel roughly (simple demo: map cursor%16)
        const ch = (Math.floor(cursorTick / grid.ppq) % 16) + 1;
        if (visible.has(ch)) visible.delete(ch); else visible.add(ch);
      } else if (bytes[0] === 0x1b && bytes[1] === 0x5b) {
        // ESC [ A/B/C/D
        const code = bytes[2];
        if (code === 0x43) cursorTick += grid.ppq; // Right
        else if (code === 0x44) cursorTick = Math.max(0, cursorTick - grid.ppq); // Left
        else if (code === 0x41) cursorTick += grid.ppq * 4; // Up faster
        else if (code === 0x42) cursorTick = Math.max(0, cursorTick - grid.ppq * 4); // Down faster
      }
      await render();
  }
  } finally {
  await write(showCursor + "\n");
  try { reader.releaseLock(); } catch { /* ignore */ }
  if (shouldRaw) Deno.stdin.setRaw(false);
  }
}
