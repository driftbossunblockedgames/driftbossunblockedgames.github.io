import { mkdir, rm, cp, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "public");
const snapshotDir = path.join(root, ".pages-public");
const port = Number(process.env.PORT || 4177);
const base = `http://127.0.0.1:${port}`;

const routes = [
  ["/", "index.html"],
  ["/games", "games/index.html"],
  ["/categories", "categories/index.html"],
  ["/related/game", "related/game/index.html"]
];

async function waitForServer(timeoutMs = 30000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${base}/`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server did not start at ${base}`);
}

async function writeRoute(route, fileName) {
  const response = await fetch(`${base}${route}`);
  if (!response.ok) throw new Error(`Failed to export ${route}: ${response.status}`);
  const html = await response.text();
  const target = path.join(snapshotDir, fileName);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html, "utf8");
}

await rm(snapshotDir, { recursive: true, force: true });
await mkdir(snapshotDir, { recursive: true });
await cp(outDir, snapshotDir, { recursive: true });

const server = spawn(process.execPath, ["src/server.mjs"], {
  cwd: root,
  env: {
    ...process.env,
    HOST: "127.0.0.1",
    PORT: String(port),
    BASE_URL: process.env.BASE_URL || base
  },
  stdio: "inherit"
});

try {
  await waitForServer();
  for (const [route, fileName] of routes) {
    await writeRoute(route, fileName);
  }
} finally {
  server.kill("SIGTERM");
}

await rm(outDir, { recursive: true, force: true });
await cp(snapshotDir, outDir, { recursive: true });
