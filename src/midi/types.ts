// Core MIDI/Song types centralized for preservation/editing policy.

export type Division = { type: "tpq"; ticksPerQuarter: number } | { type: "smpte"; smpte: number; ticksPerFrame: number };

export type MetaEvent =
  | { type: "sequenceNumber"; number: number }
  | { type: "text"; text: string }
  | { type: "copyright"; text: string }
  | { type: "trackName"; text: string }
  | { type: "instrumentName"; text: string }
  | { type: "lyrics"; text: string }
  | { type: "marker"; text: string }
  | { type: "cuePoint"; text: string }
  | { type: "channelPrefix"; channel: number }
  | { type: "portPrefix"; port: number }
  | { type: "endOfTrack" }
  | { type: "setTempo"; microsecondsPerQuarter: number }
  | { type: "smpteOffset"; hours: number; minutes: number; seconds: number; frames: number; subframes: number }
  | { type: "timeSignature"; numerator: number; denominator: number; metronome: number; thirtyseconds: number }
  | { type: "keySignature"; key: number; scale: number }
  | { type: "sequencerSpecific"; data: Uint8Array }
  | { type: "unknown"; metaTypeByte: number; data: Uint8Array };

export type ChannelEvent =
  | { type: "noteOn"; channel: number; note: number; velocity: number }
  | { type: "noteOff"; channel: number; note: number; velocity: number }
  | { type: "aftertouch"; channel: number; note: number; amount: number }
  | { type: "controller"; channel: number; controller: number; value: number }
  | { type: "programChange"; channel: number; program: number }
  | { type: "channelAftertouch"; channel: number; amount: number }
  | { type: "pitchBend"; channel: number; value: number };

export type SysExEvent =
  | { type: "sysEx"; data: Uint8Array }
  | { type: "endSysEx"; data: Uint8Array };

export type AnyEvent = { delta: number } & (MetaEvent | ChannelEvent | SysExEvent);

export type Track = { events: AnyEvent[] };

export type SongModel = {
  division: Division;
  tracks: Track[]; // when writing Format 0, merged into one track
};

export type MergeWarning = string;
