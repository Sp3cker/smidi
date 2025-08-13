// Entry point: routes to TUI or CLI based on first arg.
import { runTui } from "./tui/ink_app.tsx";
import { runCli } from "./cli/commands.ts";

if (import.meta.main) {
  const [mode = "tui", ...rest] = Deno.args;
  if (mode === "tui") {
    await runTui(rest);
  } else {
    await runCli([mode, ...rest]);
  }
}
