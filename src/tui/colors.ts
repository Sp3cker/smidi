// Theme loader for terminal colors from Dracula Pro JSON file.
// Expects keys like colors.terminal, colors.terminalBright, etc.
// Falls back to a safe palette if not provided.

export type TerminalPalette = {
  byChannel: Map<number, string>;
  // Named colors for UI accents
  accent: string;
  dim: string;
  text: string;
  bg: string;
};

export async function loadDraculaTheme(path?: string): Promise<TerminalPalette> {
  const defaults = defaultPalette();
  if (!path) return defaults;
  try {
    const raw = await Deno.readTextFile(path);
    const json = JSON.parse(raw);
    // Try pulling terminal colors
    const term = json?.colors?.terminal ?? {};
    const termBright = json?.colors?.terminalBright ?? {};
    const text = json?.colors?.editor?.foreground ?? "#f8f8f2";
    const bg = json?.colors?.editor?.background ?? "#1e1f29";

    // Build a 1..16 color palette from terminal + bright
    const ordered: string[] = [];
    for (let i = 0; i < 8; i++) ordered.push(term[i] ?? defaults.text);
    for (let i = 0; i < 8; i++) ordered.push(termBright[i] ?? defaults.text);

    const byChannel = new Map<number, string>();
    for (let ch = 1; ch <= 16; ch++) {
      byChannel.set(ch, ordered[(ch - 1) % ordered.length] ?? defaults.text);
    }

    return {
      byChannel,
      accent: ordered[5] ?? defaults.accent,
      dim: ordered[8] ?? defaults.dim,
      text,
      bg,
    };
  } catch (_) {
    return defaults;
  }
}

export function defaultPalette(): TerminalPalette {
  const byChannel = new Map<number, string>();
  const colors = [
    "#8be9fd", // cyan
    "#50fa7b", // green
    "#ffb86c", // orange
    "#bd93f9", // purple
    "#ff79c6", // pink
    "#f1fa8c", // yellow
    "#ff5555", // red
    "#6272a4", // comment
  ];
  for (let ch = 1; ch <= 16; ch++) byChannel.set(ch, colors[(ch - 1) % colors.length]);
  return { byChannel, accent: "#bd93f9", dim: "#6272a4", text: "#f8f8f2", bg: "#1e1f29" };
}

export function hexToAnsi256(hex: string): number {
  // Simple hex to ANSI 256 approximation
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!m) return 15; // white
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
  // Map to 6x6x6 cube
  const to6 = (v: number) => Math.round((v / 255) * 5);
  const ansi = 16 + 36 * to6(r) + 6 * to6(g) + to6(b);
  return Math.max(16, Math.min(231, ansi));
}

export function colorize(text: string, hex: string): string {
  const c = hexToAnsi256(hex);
  return `\x1b[38;5;${c}m${text}\x1b[0m`;
}
