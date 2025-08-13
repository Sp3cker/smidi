import { mergeDirectoryToSong } from "../src/midi/merge.ts";

Deno.test({
  name: "merge handles empty directory",
  ignore: true, // requires fixtures
  async fn() {
    const { song } = await mergeDirectoryToSong("./tests/fixtures/empty");
    if (!song) throw new Error("no song");
  }
});
