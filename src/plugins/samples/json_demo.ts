import type { Plugin } from "../mod.ts";
import type { SongModel } from "../../midi/types.ts";

export const jsonDemoPlugin: Plugin = {
  id: "json-demo",
  detect(filePath: string): Promise<boolean> {
    return Promise.resolve(filePath.toLowerCase().endsWith(".json"));
  },
  async parse(filePath: string): Promise<SongModel> {
    const txt = await Deno.readTextFile(filePath);
    const data = JSON.parse(txt);
    const division = { type: "tpq", ticksPerQuarter: data.ppq ?? 480 } as const;
    const events = Array.isArray(data.events) ? data.events : [];
    const tracks = [ { events: events as unknown as any[] } ];
    return { division, tracks };
  },
};
