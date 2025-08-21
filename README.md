What to know about this Neutralino + React (Vite) app
How your React build is embedded
Build output location: Vite writes to www/dist per www/vite.config.ts (outDir ../dist). Neutralino serves that as the app via documentRoot: "/www/dist/" in neutralino.config.json.
Packaging: When you package the app, Neutralino includes resourcesPath: "/www/dist/", so the built assets are bundled with the binary.
Dev workflow options
Recommended (real Neutralino + HMR):
Install deps: cd /Users/spencer/dev/denoProjects/smidi=gui/www && npm install
Run Neutralino: cd /Users/spencer/dev/denoProjects/smidi=gui && neu run
The CLI is configured to use your Vite dev server via:
.
This will start npm run dev inside www/, then load http://localhost:3000 inside the Neutralino window. You get Vite HMR + access to native APIs.
Frontend-only (browser)
cd /Users/spencer/dev/denoProjects/smidi=gui/www && npm run dev and open http://localhost:3000 in your browser.
This uses the mock window.Neutralino provided by www/public/neutralino.js so UI work is fast, but native calls are simulated.
Should Neutralino serve your app in dev or use mocks?
If you need native APIs (filesystem, window controls, OS dialogs), run via Neutralino (neu run) so the app loads inside the Neutralino runtime and talks to the native backend.
If you’re focused on UI, browser-only with mocks is fine. Just be careful: mocks may “work” in dev but real calls can be blocked by the nativeAllowList.
Neutralino client script and mocks
Your HTML loads the client before your app:
>
Vite copies www/public/neutralino.js to the root in dev and build, so in browser dev you get a mock window.Neutralino with safe no-ops.
In real Neutralino, you typically rely on the official client injected/served by the runtime. Since your config sets:
,
the runtime will serve the file at that path. If you want real APIs, replace this with the official Neutralino client library (or remove/let the CLI manage it) instead of the mock.
Dev server wiring (Vite)
Vite is rooted at www/src, outputs to www/dist, and serves www/public at the web root. It’s configured to run on port 3000:
}
Native API permissions
Your current allowlist is restrictive:
,
Calls like filesystem.* or os.* will be denied by the real runtime unless you add them (e.g., "filesystem.*", "os.*", etc.). The mock won’t enforce this, so test native features via neu run.
Production build and run
Build frontend: cd /Users/spencer/dev/denoProjects/smidi=gui/www && npm run build
Run packaged app: cd /Users/spencer/dev/denoProjects/smidi=gui && neu run --release or build binaries with neu build.
Practical tips
Keep <script src="/neutralino.js"> first so window.Neutralino is defined before your React entry.
Add a runtime guard in code for browser dev:
;
Update nativeAllowList as you introduce native features to avoid surprises when switching from mocks to the runtime.
What happens under the hood
In dev via Neutralino: Neutralino opens a desktop window pointing to http://localhost:3000 and exposes its native bridge. Vite handles HMR; Neutralino handles window/native APIs.
In prod: Neutralino serves static files from www/dist and the app talks to the native bridge via the official client library.
Potential cleanup
Replace the mock www/public/neutralino.js with the official client for runtime builds, or ensure it’s only used in browser dev. Otherwise native calls won’t reach the Neutralino backend.
Fixed gotcha: your mock claims many APIs exist, but the allowlist blocks them in real runs. Add the needed patterns before relying on those calls in Neutralino.
I reviewed your config, Vite setup, and HTML to map the exact integration points and commands.
