// MIDI writer for Format 0 (single track), no running status by default.
import type { AnyEvent, SongModel } from "./types.ts";

export type WriterOptions = {
  runningStatus: boolean; // if false, always write status bytes
};

export const DefaultWriterOptions: WriterOptions = {
  runningStatus: false,
};

export function encodeVarInt(value: number): number[] {
  const bytes = [value & 0x7f];
  while ((value >>= 7)) bytes.unshift(0x80 | (value & 0x7f));
  return bytes;
}

export function writeMidiFormat0(song: SongModel, opts: WriterOptions = DefaultWriterOptions): Uint8Array {
  const events = mergeTracks(song);
  const chunks: number[] = [];

  // Header chunk MThd
  chunks.push(...strBytes("MThd"));
  chunks.push(...u32(6));
  chunks.push(...u16(0)); // format 0
  chunks.push(...u16(1)); // 1 track
  chunks.push(...divisionBytes(song));

  // Track chunk MTrk
  const trackData: number[] = [];
  let lastStatus = -1;
  for (const ev of events) {
    trackData.push(...encodeVarInt(ev.delta));
    const { bytes, status } = encodeEvent(ev, opts, lastStatus);
    if (!opts.runningStatus || status !== lastStatus) {
      trackData.push(status);
      lastStatus = status;
    }
    trackData.push(...bytes);
  }
  // Ensure endOfTrack
  trackData.push(0x00, 0xff, 0x2f, 0x00);

  chunks.push(...strBytes("MTrk"));
  chunks.push(...u32(trackData.length));
  chunks.push(...trackData);

  return new Uint8Array(chunks);
}

function mergeTracks(song: SongModel): AnyEvent[] {
  // Already expect deltas in each track; merge by converting to absolute time, concat, sort, then delta-ize
  type TEv = AnyEvent & { _abs?: number };
  const all: TEv[] = [];
  for (const trk of song.tracks) {
    let t = 0;
    for (const ev of trk.events) {
      t += ev.delta;
      all.push({ ...ev, _abs: t });
    }
  }
  all.sort((a, b) => (a._abs! - b._abs!));
  // Recompute deltas
  let last = 0;
  return all.map((e) => {
    const delta = (e._abs ?? 0) - last; last = e._abs ?? last;
    const { _abs, ...rest } = e;
    return { ...rest, delta } as AnyEvent;
  });
}

function encodeEvent(ev: AnyEvent, _opts: WriterOptions, _lastStatus: number): { bytes: number[]; status: number } {
  // Meta
  // Meta events use status 0xFF, then type byte and data length
  // Channel events set status per channel
  switch (ev.type) {
    case "noteOn": return { status: 0x90 | ((ev.channel - 1) & 0x0f), bytes: [ev.note & 0x7f, ev.velocity & 0x7f] };
    case "noteOff": return { status: 0x80 | ((ev.channel - 1) & 0x0f), bytes: [ev.note & 0x7f, ev.velocity & 0x7f] };
    case "aftertouch": return { status: 0xA0 | ((ev.channel - 1) & 0x0f), bytes: [ev.note & 0x7f, ev.amount & 0x7f] };
    case "controller": return { status: 0xB0 | ((ev.channel - 1) & 0x0f), bytes: [ev.controller & 0x7f, ev.value & 0x7f] };
    case "programChange": return { status: 0xC0 | ((ev.channel - 1) & 0x0f), bytes: [ev.program & 0x7f] };
    case "channelAftertouch": return { status: 0xD0 | ((ev.channel - 1) & 0x0f), bytes: [ev.amount & 0x7f] };
    case "pitchBend": {
      const v = ev.value + 8192; const lsb = v & 0x7f; const msb = (v >> 7) & 0x7f;
      return { status: 0xE0 | ((ev.channel - 1) & 0x0f), bytes: [lsb, msb] };
    }
    case "sysEx": return { status: 0xF0, bytes: [...encodeVarInt(ev.data.length), ...ev.data, 0xF7] };
    case "endSysEx": return { status: 0xF7, bytes: [...encodeVarInt(ev.data.length), ...ev.data] };
    default: {
      // Meta and unknown fall here
      const metaBytes = encodeMeta(ev as unknown as AnyEvent);
      return { status: 0xFF, bytes: metaBytes };
    }
  }
}

function encodeMeta(ev: AnyEvent): number[] {
  // deno-lint-ignore no-explicit-any
  const e: any = ev;
  switch (e.type) {
    case "endOfTrack": return [0x2F, 0x00];
    case "marker": return [0x06, ...encodeVarInt(byteLength(e.text)), ...textBytes(e.text)];
    case "text": return [0x01, ...encodeVarInt(byteLength(e.text)), ...textBytes(e.text)];
    case "trackName": return [0x03, ...encodeVarInt(byteLength(e.text)), ...textBytes(e.text)];
    case "instrumentName": return [0x04, ...encodeVarInt(byteLength(e.text)), ...textBytes(e.text)];
    case "cuePoint": return [0x07, ...encodeVarInt(byteLength(e.text)), ...textBytes(e.text)];
    case "setTempo": {
      const us = e.microsecondsPerQuarter >>> 0;
      return [0x51, 0x03, (us >> 16) & 0xff, (us >> 8) & 0xff, us & 0xff];
    }
    case "timeSignature": return [0x58, 0x04, e.numerator & 0xff, Math.log2(e.denominator) & 0xff, e.metronome & 0xff, e.thirtyseconds & 0xff];
    case "keySignature": return [0x59, 0x02, e.key & 0xff, e.scale & 0xff];
    case "channelPrefix": return [0x20, 0x01, (e.channel - 1) & 0x0f];
    case "sequencerSpecific": return [0x7F, ...encodeVarInt(e.data.length), ...e.data];
    case "unknown": return [e.metaTypeByte & 0xff, ...encodeVarInt(e.data.length), ...e.data];
    default: return [0x2F, 0x00];
  }
}

function divisionBytes(song: SongModel): number[] {
  if (song.division.type === "tpq") return u16(song.division.ticksPerQuarter);
  // SMPTE negative frames per second in high byte, ticks per frame in low byte
  const fps = song.division.smpte; // e.g., 24, 25, 29, 30 -> stored as two's complement
  const high = (256 - fps) & 0xff;
  const low = song.division.ticksPerFrame & 0xff;
  return [high, low];
}

function u16(v: number): number[] { return [(v >> 8) & 0xff, v & 0xff]; }
function u32(v: number): number[] { return [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff]; }
function strBytes(s: string): number[] { return [...new TextEncoder().encode(s)]; }
function textBytes(s: string): number[] { return [...new TextEncoder().encode(s)]; }
function byteLength(s: string): number { return new TextEncoder().encode(s).length; }
