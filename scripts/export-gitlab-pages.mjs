import { mkdir, rm, cp, writeFile, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "public");
const snapshotDir = path.join(root, ".pages-public");
const port = Number(process.env.PORT || 4177);
const base = `http://127.0.0.1:${port}`;

const slugify = (value = "") => String(value || "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const games = JSON.parse(await readFile(path.join(root, "data", "games.json"), "utf8"));
const categorySlugs = [...new Set(games.flatMap((game) => Array.isArray(game.cat) ? game.cat : []).map(slugify).filter(Boolean))];

const routes = [
  ["/", "index.html"],
  ["/games", "games/index.html"],
  ["/categories", "categories/index.html"],
  ["/related/game", "related/game/index.html"],
  ...categorySlugs.map((slug) => [`/category/${slug}`, `category/${slug}/index.html`]),
  ...games.map((game) => [`/play/${game.slug}`, `play/${game.slug}/index.html`])
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
  if (!response.ok) {
    console.warn(`Skipping ${route}: ${response.status}`);
    return;
  }
  const html = await response.text();
  const target = path.join(snapshotDir, fileName);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html, "utf8");
}

async function exportRoutes(concurrency = 8) {
  let index = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (index < routes.length) {
      const current = routes[index];
      index += 1;
      await writeRoute(current[0], current[1]);
    }
  });
  await Promise.all(workers);
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
  await exportRoutes();
} finally {
  server.kill("SIGTERM");
}

await rm(outDir, { recursive: true, force: true });
await cp(snapshotDir, outDir, { recursive: true });
