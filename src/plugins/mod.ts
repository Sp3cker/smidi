import type { SongModel } from "../midi/types.ts";

export interface Plugin {
  id: string;
  detect(filePath: string): Promise<boolean>;
  parse(filePath: string): Promise<SongModel>;
}

export async function loadPlugins(): Promise<Plugin[]> {
  const plugins: Plugin[] = [];
  // Auto import local plugins here if needed. For now, return empty list + samples can be imported manually.
  return plugins;
}
