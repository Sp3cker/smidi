// MIDI Reader using npm:midi-file (ToneJS) via Deno's npm compatibility.
// Central toggle points for preservation policy live here.
import type { AnyEvent, SongModel, Division } from "./types.ts";

export type ReaderOptions = {
  includeSysEx: boolean;
  includeMeta: boolean;
  includeChannel: boolean;
};

export const DefaultReaderOptions: ReaderOptions = {
  includeSysEx: true,
  includeMeta: true,
  includeChannel: true,
};

// deno-lint-ignore no-explicit-any
type ParsedHeader = { ticksPerBeat?: number; framesPerSecond?: number; ticksPerFrame?: number } & Record<string, any>;
// deno-lint-ignore no-explicit-any
type ParsedEvent = { deltaTime?: number; delta?: number; type: string } & Record<string, any>;
type ParsedTrack = ParsedEvent[];
type ParsedMidi = { header: ParsedHeader; tracks: ParsedTrack[] };

export async function readMidiFile(path: string, opts: ReaderOptions = DefaultReaderOptions): Promise<SongModel> {
  const data = await Deno.readFile(path);
  // Lazy import npm midi-file module (types are not provided)
  // deno-lint-ignore no-explicit-any
  const midiFile = await import("npm:midi-file");
  const parsed = midiFile.parseMidi(new Uint8Array(data)) as ParsedMidi;

  const division: Division = typeof parsed.header.ticksPerBeat === "number"
    ? { type: "tpq", ticksPerQuarter: parsed.header.ticksPerBeat }
    : { type: "smpte", smpte: parsed.header.framesPerSecond ?? 24, ticksPerFrame: parsed.header.ticksPerFrame ?? 80 };

  const tracks = parsed.tracks.map((trk) => ({
    events: trk.map((ev) => convertEvent(ev, opts)),
  }));

  return { division, tracks };
}

function convertEvent(ev: ParsedEvent, opts: ReaderOptions): AnyEvent {
  // Pass-through preserving delta; filter by opts
  const delta = ev.deltaTime ?? ev.delta ?? 0;
  // Meta
  if (ev.type === "meta") {
    if (!opts.includeMeta) return { delta, type: "endOfTrack" } as AnyEvent; // harmless stub
    switch (ev.subtype) {
      case "marker": return { delta, type: "marker", text: ev.text } as AnyEvent;
      case "setTempo": return { delta, type: "setTempo", microsecondsPerQuarter: ev.microsecondsPerBeat } as AnyEvent;
      case "timeSignature": return { delta, type: "timeSignature", numerator: ev.numerator, denominator: ev.denominator, metronome: ev.metronome, thirtyseconds: ev.thirtyseconds } as AnyEvent;
      case "keySignature": return { delta, type: "keySignature", key: ev.key, scale: ev.scale } as AnyEvent;
      case "endOfTrack": return { delta, type: "endOfTrack" } as AnyEvent;
      case "text": return { delta, type: "text", text: ev.text } as AnyEvent;
      case "trackName": return { delta, type: "trackName", text: ev.text } as AnyEvent;
      case "instrumentName": return { delta, type: "instrumentName", text: ev.text } as AnyEvent;
      case "cuePoint": return { delta, type: "cuePoint", text: ev.text } as AnyEvent;
      case "channelPrefix": return { delta, type: "channelPrefix", channel: ev.channel } as AnyEvent;
      default: {
        const d: number[] = Array.isArray((ev as Record<string, unknown>).data)
          ? ((ev as Record<string, unknown>).data as number[])
          : [];
        const mtb = (ev as Record<string, unknown>).metaTypeByte;
        return { delta, type: "unknown", metaTypeByte: (typeof mtb === "number" ? mtb : 0), data: new Uint8Array(d) } as AnyEvent;
      }
    }
  }
  // SysEx
  if (ev.type === "sysEx" || ev.type === "endSysEx") {
    if (!opts.includeSysEx) return { delta, type: "endOfTrack" } as AnyEvent;
    const d: number[] = Array.isArray((ev as Record<string, unknown>).data)
      ? ((ev as Record<string, unknown>).data as number[])
      : [];
    return { delta, type: ev.type as "sysEx" | "endSysEx", data: new Uint8Array(d) } as AnyEvent;
  }
  // Channel events
  if (!opts.includeChannel) return { delta, type: "endOfTrack" } as AnyEvent;
  switch (ev.type) {
    case "noteOn": return { delta, type: "noteOn", channel: ((ev as any).channel ?? 0) + 1, note: (ev as any).noteNumber ?? 0, velocity: (ev as any).velocity ?? 0 } as AnyEvent;
    case "noteOff": return { delta, type: "noteOff", channel: ((ev as any).channel ?? 0) + 1, note: (ev as any).noteNumber ?? 0, velocity: (ev as any).velocity ?? 0 } as AnyEvent;
    case "programChange": return { delta, type: "programChange", channel: ((ev as any).channel ?? 0) + 1, program: (ev as any).programNumber ?? 0 } as AnyEvent;
    case "controller": return { delta, type: "controller", channel: ((ev as any).channel ?? 0) + 1, controller: (ev as any).controllerType ?? 0, value: (ev as any).value ?? 0 } as AnyEvent;
    case "channelAftertouch": return { delta, type: "channelAftertouch", channel: ((ev as any).channel ?? 0) + 1, amount: (ev as any).amount ?? 0 } as AnyEvent;
    case "pitchBend": return { delta, type: "pitchBend", channel: ((ev as any).channel ?? 0) + 1, value: (ev as any).value ?? 0 } as AnyEvent;
    case "aftertouch": return { delta, type: "aftertouch", channel: ((ev as any).channel ?? 0) + 1, note: (ev as any).noteNumber ?? 0, amount: (ev as any).amount ?? 0 } as AnyEvent;
    default:
      return { delta, type: "unknown", metaTypeByte: 0xff, data: new Uint8Array() } as AnyEvent;
  }
}
