# smidic
speckers midi combiner
Deno-based TUI and CLI tool to merge MIDI files into a single-track Format 0 file, with per-channel visualization and loop marker insertion.

## Features
- TUI (native ANSI) with channel list, color-coding, per-channel visibility, and loop marker insert.
- Merge a directory of MIDI files into one MIDI Format 0 track, preserving all events and automation.
- Channel remapping to avoid collisions; filename numbers map to preferred target channels.
- Loop markers via standard MIDI meta Markers ("LOOP_START" / "LOOP_END").
- Plugin system for parsing DAW project files into MIDI.

## Requirements
- Latest Deno stable.

## Quick start
- TUI:
  deno task dev -- <inputDir> [--theme /path/to/dracula-pro.json]
- CLI (batch convert):
  deno task cli -- convert <inputDir> [--out out/combined.mid]

## License
MIT
