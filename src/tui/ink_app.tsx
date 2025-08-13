/** Ink-based TUI prototype with channel selector and MIDI grid. */
import { useEffect, useState } from "react";
import "react/jsx-runtime";
import { render, Box, Text, useInput } from "ink";
import process from "node:process";
import { mergeDirectoryToSong } from "../midi/merge.ts";
import type { AnyEvent, SongModel } from "../midi/types.ts";
import { loadDraculaTheme } from "./colors.ts";

type Props = { dir: string; themePath?: string };

function ChannelSelector({
  selected,
  onSelect: _onSelect,
  palette,
}: {
  selected: number;
  onSelect: (ch: number) => void;
  palette: Map<number, string>;
}) {
  const channels = Array.from({ length: 16 }, (_, i) => i + 1);
  return (
    <Box flexDirection="row" flexWrap="wrap">
      {channels.map((ch: number) => {
        const _hex = palette.get(ch) ?? "#ffffff";
        const isSel = ch === selected;
        return (
          <Box key={`ch-${ch}`} marginRight={1}>
            <Text>
              {isSel
                ? `> Ch ${ch.toString().padStart(2, "0")}`
                : `  Ch ${ch.toString().padStart(2, "0")}`}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}

function MidiGrid({
  song,
  channel,
  width,
}: {
  song: SongModel;
  channel: number;
  width: number;
}) {
  // Build note intervals for selected channel, then render binned pitch lanes
  const ppq =
    song.division.type === "tpq"
      ? song.division.ticksPerQuarter
      : song.division.ticksPerFrame;
  const cells = Math.max(16, Math.floor(Math.min(width - 4, 200))); // reserve margin
  const lanes = 8; // pitch bins
  const intervals: Array<{ start: number; end: number; note: number }> = [];
  const onMap = new Map<number, number>(); // note -> start
  for (const trk of song.tracks) {
    let t = 0;
    for (const ev of trk.events) {
      t += ev.delta;
      const type = (ev as AnyEvent).type;
      const ch = (ev as any).channel as number | undefined;
      if (ch !== channel) continue;
      if (type === "noteOn" && (ev as any).velocity > 0) {
        onMap.set((ev as any).note as number, t);
      } else if (
        type === "noteOff" ||
        (type === "noteOn" && (ev as any).velocity === 0)
      ) {
        const n = (ev as any).note as number;
        const st = onMap.get(n);
        if (st !== undefined) {
          intervals.push({ start: st, end: Math.max(st + 1, t), note: n });
          onMap.delete(n);
        }
      }
    }
  }
  // Render lanes across a span of cells beats (wrap modulo span for now)
  const span = cells * ppq;
  const lines: string[] = [];
  for (let lane = 0; lane < lanes; lane++) {
    const row: string[] = [];
    for (let c = 0; c < cells; c++) {
      const cellStart = c * ppq;
      const cellEnd = cellStart + ppq;
      // check any interval overlaps cell and falls into bin
      const has = intervals.some(({ start, end, note }) => {
        const nbin = Math.floor((note / 128) * lanes);
        if (nbin !== lane) return false;
        const st = start % span;
        const en = end % span;
        if (st <= en) return en > cellStart && st < cellEnd;
        // wrapped
        return en > cellStart || st < cellEnd;
      });
      row.push(has ? "█" : "·");
    }
    lines.push(row.join(""));
  }
  return (
    <Box flexDirection="column">
      {lines.map((ln, _i) => (
        <Text key={ln+_i}>{ln}</Text>
      ))}
    </Box>
  );
}

function App({ dir, themePath }: Props) {
  const [song, setSong] = useState<SongModel | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selected, setSelected] = useState(1);
  const [cols, setCols] = useState<number>(process.stdout.columns ?? 120);
  const [palette, setPalette] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    const onResize = () => setCols(process.stdout.columns ?? 120);
    // deno-lint-ignore no-explicit-any
    (process.stdout as any).on("resize", onResize);
    return () => {
      try {
        (process.stdout as any).off("resize", onResize);
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      const pal = await loadDraculaTheme(themePath);
      setPalette(pal.byChannel);
      const res = await mergeDirectoryToSong(dir);
      setSong(res.song);
      setWarnings(res.warnings);
    })();
  }, [dir, themePath]);

  useInput(
    (input: string, key: { leftArrow?: boolean; rightArrow?: boolean }) => {
      if (key.leftArrow) setSelected((s: number) => Math.max(1, s - 1));
      else if (key.rightArrow) setSelected((s: number) => Math.min(16, s + 1));
      else if (/^[0-9]$/.test(input)) {
        const n = Number(input);
        const ch = n === 0 ? 10 : n;
        setSelected(() => Math.max(1, Math.min(16, ch)));
      } else if (input === "q") Deno.exit(0);
    }
  );

  if (!song) return <Text>Loading…</Text>;

  const minWidthOk = cols >= 120;
  return (
    <Box flexDirection="column">
      {!minWidthOk && (
        <Text>
          Warning: terminal width {cols} {"<"} 120. Please widen the terminal.
        </Text>
      )}
      {warnings.length > 0 && (
        <Box flexDirection="column">
          {warnings.map((w: string) => (
            <Text>⚠️ {w}</Text>
          ))}
        </Box>
      )}
      <Box marginTop={1}>
        <ChannelSelector
          selected={selected}
          onSelect={setSelected}
          palette={palette}
        />
      </Box>
      <Box marginTop={1}>
        <MidiGrid song={song} channel={selected} width={cols} />
      </Box>
      <Box marginTop={1}>
        <Text>Controls: ←/→ select channel • q to quit</Text>
      </Box>
    </Box>
  );
}

export async function runTui(args: string[]) {
  const [dir = ".", ...rest] = args;
  const themeFlag = rest.indexOf("--theme");
  const themePath = themeFlag >= 0 ? rest[themeFlag + 1] : undefined;
  render(<App dir={dir} themePath={themePath} />);
}
