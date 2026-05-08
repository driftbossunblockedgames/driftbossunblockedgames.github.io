import fs from "node:fs/promises";
import path from "node:path";

export const ARTICLE_PREFIXES = [
  "read",
  "story",
  "insight",
  "update",
  "daily",
  "learn",
  "topic"
];

export const ARTICLE_ACTIONS = [
  "view",
  "open",
  "read",
  "go",
  "see",
  "get",
  "page",
  "post"
];

function hashFNV1a(value) {
  let h = 0x811c9dc5;
  const input = String(value || "");
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pick(seed, list) {
  return list[hashFNV1a(seed) % list.length];
}

function pickRandom(list) {
  const items = Array.isArray(list) ? list : [];
  return items.length ? items[Math.floor(Math.random() * items.length)] : "";
}

function escapeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripHtml(value = "") {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatInlineRich(value = "") {
  return String(value || "")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*\*/g, "");
}

function closeList(out, state) {
  if (state.list === "ul") out.push("</ul>");
  if (state.list === "ol") out.push("</ol>");
  state.list = "";
}

function isBlockHtml(line = "") {
  return /^<\/?(h[1-6]|p|div|section|article|blockquote|table|thead|tbody|tr|th|td|ul|ol|li|details|summary|center|br|hr)\b/i.test(line);
}

function isMarkdownTableSeparator(line = "") {
  const cells = String(line || "").trim().split("|").map((cell) => cell.trim()).filter(Boolean);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function markdownTableRows(lines = []) {
  return lines.map((line) => String(line || "").trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => formatInlineRich(cell.trim())));
}

function markdownTableHtml(lines = []) {
  if (lines.length < 2 || !isMarkdownTableSeparator(lines[1])) return "";
  const rows = markdownTableRows(lines);
  const headers = rows[0] || [];
  const bodyRows = rows.slice(2).filter((row) => row.some(Boolean));
  if (!headers.length || !bodyRows.length) return "";
  return `<div class="table-responsive"><table class="content-table"><thead><tr>${headers.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead><tbody>${bodyRows.map((row) => `<tr>${headers.map((_, i) => `<td>${row[i] || ""}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function normalizeArticleContent(value = "") {
  const raw = String(value || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!raw) return "";

  const out = [];
  const state = { list: "" };
  const lines = raw.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const original = lines[i];
    const line = original.trim();
    if (!line) {
      closeList(out, state);
      continue;
    }
    if (/^-{3,}$/.test(line)) {
      closeList(out, state);
      continue;
    }

    let nextTableLine = i + 1;
    while (nextTableLine < lines.length && !lines[nextTableLine].trim()) nextTableLine += 1;
    if (line.startsWith("|") && isMarkdownTableSeparator(lines[nextTableLine] || "")) {
      closeList(out, state);
      const tableLines = [line, lines[nextTableLine].trim()];
      i = nextTableLine + 1;
      while (i < lines.length) {
        const tableLine = lines[i].trim();
        if (!tableLine) {
          i += 1;
          continue;
        }
        if (!tableLine.startsWith("|")) break;
        tableLines.push(tableLine);
        i += 1;
      }
      i -= 1;
      const table = markdownTableHtml(tableLines);
      if (table) {
        out.push(table);
        continue;
      }
    }

    const markdownHeading = line.match(/^(#{1,6})\s+(.+)$/);
    if (markdownHeading) {
      closeList(out, state);
      const level = Math.min(6, markdownHeading[1].length);
      out.push(`<h${level}>${formatInlineRich(markdownHeading[2]).trim()}</h${level}>`);
      continue;
    }

    const boldHeading = line.match(/^\*\*(.+?)\*\*$/);
    if (boldHeading) {
      closeList(out, state);
      out.push(`<h2>${boldHeading[1].trim()}</h2>`);
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet && !line.startsWith("</")) {
      if (state.list !== "ul") {
        closeList(out, state);
        out.push("<ul>");
        state.list = "ul";
      }
      out.push(`<li>${formatInlineRich(bullet[1]).trim()}</li>`);
      continue;
    }

    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    if (numbered) {
      if (state.list !== "ol") {
        closeList(out, state);
        out.push("<ol>");
        state.list = "ol";
      }
      out.push(`<li>${formatInlineRich(numbered[1]).trim()}</li>`);
      continue;
    }

    closeList(out, state);

    if (isBlockHtml(line)) {
      const brokenHeading = line.match(/^<h([1-6])>(.+)$/i);
      if (brokenHeading && !new RegExp(`</h${brokenHeading[1]}>`, "i").test(line)) {
        out.push(`<h${brokenHeading[1]}>${formatInlineRich(brokenHeading[2]).trim()}</h${brokenHeading[1]}>`);
      } else {
        out.push(formatInlineRich(line));
      }
      continue;
    }

    out.push(`<p>${formatInlineRich(line).trim()}</p>`);
  }

  closeList(out, state);
  let result = out.join("\n").replace(/<p>\s*<\/p>/g, "").replace(/\*\*/g, "").trim();
  result = result.replace(/^<p>([^<]{12,120})<\/p>\n(?=<p>|<h2>|<h3>)/, (match, heading) => {
    const text = stripHtml(heading);
    if (!text || /[.!?]$/.test(text)) return match;
    return `<h2>${heading.trim()}</h2>\n`;
  });
  return result;
}

function deriveArticleMeta(json = {}, fallbackTitle = "") {
  const existing = String(json.meta_description || json.metaDescription || json.meta_description_blog || "").replace(/\s+/g, " ").trim();
  if (existing && !existing.includes("**")) return existing.slice(0, 180);

  const source = stripHtml(json.description || json.description_alt || fallbackTitle);
  if (!source) return "";
  if (source.length <= 165) return source;
  const cut = source.slice(0, 165);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 120)).trim()}.`;
}

function slugToken(title, code, options = {}) {
  const words = escapeText(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);

  if (!words.length) return "";
  const separator = options.random ? pickRandom(["-", "_"]) : (hashFNV1a(`${code}:separator`) % 2 === 0 ? "-" : "_");
  return words.map((word, index) => {
    if (index > 0 && ((options.random ? Math.random() : hashFNV1a(`${code}:${index}`)) % 3 === 0)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join(separator);
}

function parseKeywLine(line) {
  const clean = escapeText(line);
  if (!clean) return null;
  const firstSpace = clean.indexOf(" ");
  if (firstSpace <= 0) return null;
  const code = clean.slice(0, firstSpace);
  const title = clean.slice(firstSpace + 1).trim();
  if (!code || !title) return null;
  return { code, title };
}

export function buildArticlePath(record, options = {}) {
  const isRandom = Boolean(options.random);
  const dynamic = isRandom ? pickRandom(ARTICLE_PREFIXES) : pick(`${record.code}:dynamic`, ARTICLE_PREFIXES);
  const slug = slugToken(record.title, record.code, { random: isRandom });
  const folder = `${record.f1 || ""}${record.f2 || ""}`;
  return `/${dynamic}/${folder}/${record.code}${slug ? `/${slug}` : ""}`;
}

export async function buildArticleIndex({ keywDir, contentDir }) {
  const records = [];
  const byKey = new Map();
  const byCode = new Map();
  const byFolderCode = new Map();
  const byFolderPairCode = new Map();
  const roots = await fs.readdir(keywDir, { withFileTypes: true }).catch(() => []);

  for (const root of roots) {
    if (!root.isDirectory()) continue;
    const f1 = root.name;
    const f1Dir = path.join(keywDir, f1);
    const leaves = await fs.readdir(f1Dir, { withFileTypes: true }).catch(() => []);
    for (const leaf of leaves) {
      if (!leaf.isFile()) continue;
      const f2 = leaf.name;
      const lines = (await fs.readFile(path.join(f1Dir, f2), "utf8").catch(() => "")).split(/\r?\n/);
      for (const line of lines) {
        const parsed = parseKeywLine(line);
        if (!parsed) continue;
        const fileName = `${parsed.code} ${parsed.title}`;
        const record = {
          ...parsed,
          f1,
          f2,
          filePath: path.join(contentDir, f1, f2, fileName)
        };
        record.path = buildArticlePath(record);
        records.push(record);
        byKey.set(`${f1}:${f2}:${parsed.code}`.toLowerCase(), record);
        byFolderCode.set(`${f1}${f2}:${parsed.code}`.toLowerCase(), record);
        byFolderPairCode.set(`${f1}:${f2}:${parsed.code}`.toLowerCase(), record);
        if (!byCode.has(parsed.code.toLowerCase())) byCode.set(parsed.code.toLowerCase(), record);
      }
    }
  }

  return { records, byKey, byCode, byFolderCode, byFolderPairCode };
}

export function matchArticlePath(parts, articleIndex) {
  if (!Array.isArray(parts) || parts.length !== 4) return null;
  const [dynamic, folderOrF1, codeOrF2, slugOrActionCodeSlug] = parts;
  if (!ARTICLE_PREFIXES.includes(String(dynamic || "").toLowerCase())) return null;

  const folder = String(folderOrF1 || "");
  const code = String(codeOrF2 || "");
  if (folder && code) {
    const direct = articleIndex.byFolderCode?.get(`${folder}:${code}`.toLowerCase());
    if (direct) return direct;
  }

  const f1 = folderOrF1;
  const f2 = codeOrF2;
  const actionCodeSlug = slugOrActionCodeSlug;
  const action = ARTICLE_ACTIONS.find((item) => actionCodeSlug.toLowerCase().startsWith(item));
  if (!action) return null;
  const rest = actionCodeSlug.slice(action.length);
  const codeToken = rest.split(/[-_]/)[0] || rest;
  const codeCandidates = [
    codeToken,
    codeToken.slice(0, 12),
    codeToken.slice(0, 6),
    rest.slice(0, 12),
    rest.slice(0, 6)
  ].filter(Boolean);

  for (const candidate of codeCandidates) {
    const record = articleIndex.byFolderPairCode?.get(`${f1}:${f2}:${candidate}`.toLowerCase());
    if (record) return record;
  }

  const oldCode = codeCandidates[0] || "";
  if (!oldCode) return null;
  return articleIndex.byKey.get(`${f1}:${f2}:${oldCode}`.toLowerCase()) || articleIndex.byCode.get(oldCode.toLowerCase()) || null;
}

const articleContentCache = new Map();
export async function readArticleJson(record) {
  if (articleContentCache.has(record.filePath)) return articleContentCache.get(record.filePath);

  // Limit cache size to 500 articles to save RAM
  if (articleContentCache.size > 500) {
    const firstKey = articleContentCache.keys().next().value;
    articleContentCache.delete(firstKey);
  }

  const raw = await fs.readFile(record.filePath, "utf8");
  const json = JSON.parse(raw);
  const description = normalizeArticleContent(json.description || json.description_alt || "");
  const descriptionAlt = normalizeArticleContent(json.description_alt || json.description || "");
  const result = {
    ...record,
    json,
    title: json.title || record.title,
    description,
    descriptionAlt,
    metaDescription: deriveArticleMeta(json, json.title || record.title),
    questions: Array.isArray(json.questions) ? json.questions : [],
    relatedKeywords: Array.isArray(json.related_keywords) ? json.related_keywords : []
  };
  articleContentCache.set(record.filePath, result);
  return result;
}
