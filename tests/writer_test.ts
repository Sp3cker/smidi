import { writeMidiFormat0 } from "../src/midi/writer.ts";
import type { SongModel, AnyEvent } from "../src/midi/types.ts";

function assert(cond: unknown, msg = "assertion failed"): asserts cond {
  if (!cond) throw new Error(msg);
}

Deno.test("writes minimal format 0 midi", () => {
  const song: SongModel = {
    division: { type: "tpq", ticksPerQuarter: 480 },
    tracks: [
      {
        events: [
          { delta: 0, type: "setTempo", microsecondsPerQuarter: 500000 } as AnyEvent,
          { delta: 0, type: "noteOn", channel: 1, note: 60, velocity: 100 } as AnyEvent,
          { delta: 480, type: "noteOff", channel: 1, note: 60, velocity: 0 } as AnyEvent,
        ],
      },
    ],
  };
  const bytes = writeMidiFormat0(song);
  assert(bytes.length > 0);
});
