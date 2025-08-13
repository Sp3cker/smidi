import { mergeDirectoryToSong } from "../midi/merge.ts";
import { writeMidiFormat0 } from "../midi/writer.ts";

export async function runCli(argv: string[]) {
  const [cmd = "help", ...rest] = argv;
  if (cmd === "convert") {
    const inputDir = rest[0] ?? ".";
    const outFlag = rest.indexOf("--out");
    const outPath = outFlag >= 0 ? (rest[outFlag + 1] ?? "out/combined.mid") : "out/combined.mid";
    try { await Deno.mkdir("out", { recursive: true }); } catch { /* ignore */ }
    const { song, warnings } = await mergeDirectoryToSong(inputDir);
    for (const w of warnings) console.error("WARN:", w);
    const bytes = writeMidiFormat0(song);
    await Deno.writeFile(outPath, bytes);
    console.log("Wrote", outPath);
    return;
  }
  console.log("Usage:\n  deno task cli -- convert <dir> [--out out/combined.mid]\n  deno task dev -- <dir> [--theme path]");
}
