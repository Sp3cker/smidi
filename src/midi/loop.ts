import type { SongModel, AnyEvent } from "./types.ts";

export type Grid = { ppq: number; snap: number }; // snap in beats

export function snapTick(tick: number, grid: Grid): number {
  const ticksPerBeat = grid.ppq;
  const step = ticksPerBeat * grid.snap;
  return Math.round(tick / step) * step;
}

export function insertLoopMarkers(song: SongModel, nearTick: number, grid: Grid): { start: number; end: number } {
  const start = snapTick(nearTick, grid);
  const end = start + grid.ppq * 4; // single 4-beat loop by default
  // Insert as meta markers in the first track of the song at absolute positions
  if (!song.tracks.length) song.tracks.push({ events: [] });
  const evs = song.tracks[0].events;
  // Convert to abs, insert, sort, and delta-ize
  type TEv = AnyEvent & { _abs?: number };
  const withAbs: TEv[] = [];
  let t = 0;
  for (const e of evs) { t += e.delta; withAbs.push({ ...e, _abs: t }); }
  withAbs.push({ delta: 0, type: "marker", text: "LOOP_START", _abs: start } as unknown as TEv);
  withAbs.push({ delta: 0, type: "marker", text: "LOOP_END", _abs: end } as unknown as TEv);
  withAbs.sort((a, b) => (a._abs! - b._abs!));
  let last = 0;
  const reDelta: AnyEvent[] = withAbs.map((e) => {
    const delta = (e._abs ?? 0) - last; last = e._abs ?? last;
    const { _abs, ...rest } = e as Record<string, unknown>;
    return { ...(rest as AnyEvent), delta };
  });
  song.tracks[0].events = reDelta;
  return { start, end };
}
