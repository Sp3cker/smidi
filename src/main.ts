// // Entry point: routes to TUI or CLI based on first arg.
// import { runTui } from "./tui/ink_app.tsx";
// import { runCli } from "./cli/commands.ts";

// if (import.meta.main) {
//   const [mode = "tui", ...rest] = Deno.args;
//   if (mode === "tui") {
//     await runTui(rest);
//   } else {
//     await runCli([mode, ...rest]);
//   }
// }

import * as midiManager from "npm:midi-file";

// Read MIDI file into a buffer
const bytes = await Deno.readFile("mus_b_arena.mid");
// Convert buffer to midi object
const parsed = midiManager.parseMidi(bytes);
const totalDelta = parsed.tracks.reduce((sum, track) => {
  return (
    sum +
    track.reduce((trackSum, event) => {
      return trackSum + event.deltaTime;
    }, 0)
  );
}, 0);
// Convert object to midi buffer
const output = midiManager.writeMidi(parsed);

console.log("Parsed MIDI:", parsed.tracks[0]);
console.log("Total delta time:", totalDelta);
// console.log("Output MIDI bytes:", output);
