import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { URL, fileURLToPath } from "node:url";
import { AsyncLocalStorage } from "node:async_hooks";
import {
  esc,
  slugify,
  catSlug,
  stripTags,
  excerpt,
  hashNum,
  pickRandom,
  shuffle,
  partialShuffle,
  pick,
  articleSlug,
  articleSlugMixed,
  normalizeTag,
  cleanSearchTitle,
  relatedGames,
  clampHtmlPayload,
  titleCase
} from "./lib/utils.mjs";
import { buildArticleIndex, matchArticlePath, readArticleJson } from "./content/article-index.mjs";
import { createArticlePages } from "./pages/articles.mjs";
import { createGameListPages } from "./pages/games.mjs";
import { createHomePage } from "./pages/home.mjs";
import { createSearchPage } from "./pages/search.mjs";
import { createMasterSitemapPage } from "./pages/master-sitemap.mjs";
import { createGuidePage } from "./pages/guide.mjs";
import { createPlayPage } from "./pages/play.mjs";
import { config, getAdHtml, getGoogleAnalyticsHtml, getAdSenseHtml, getHistatsHtml } from "./config.mjs";

// Import Components
import { createLayout } from "./components/layout.mjs";
import { createRenderers } from "./components/renderers.mjs";
import { createWidgets } from "./components/widgets.mjs";


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const CONTENT_GAME_DIR = path.join(ROOT, "content", "game");
const GAMES_JSON = path.join(ROOT, "data", "games.json");
const KEYW_DIR = path.join(ROOT, "keyw");
const APALAH_DIR = path.join(ROOT, "apalah");
const GLOBAL_PUBLIC = PUBLIC_DIR;

const PORT = Number(process.env.PORT || 4100);
const HOST = process.env.HOST || "0.0.0.0";
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const ASSET_VERSION = "20260505-theme-player-v2";
const requestContext = new AsyncLocalStorage();

let games = [];
let bySlug = new Map();
let byCategory = new Map();
let contentBySlug = new Map();
let articleIndex = { records: [], byKey: new Map(), byCode: new Map() };
let articleSitemapTree = new Map();
let gameSitemapTree = new Map();
const articleSearchTextCache = new Map();
const articleThumbCache = new Map();
const gameThumbCache = new Map();
let searchPage;
let masterSitemapPage;
const ARTICLE_FALLBACK_IMAGE = "/favicon.svg";
const ARTICLE_PREFIX_POOL = ["read", "story", "insight", "update", "daily", "learn", "topic"];
const ARTICLE_ACTION_POOL = ["view", "open", "read", "go", "see", "get", "page", "post"];
const categoryIcons = {
  action: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
  puzzle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>`,
  driving: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>`,
  "2-player": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  sport: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>`,
  running: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4v16"></path><path d="M17 4v16"></path><path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path></svg>`,
  platformer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="20" x2="22" y2="20"></line><line x1="7" y1="15" x2="22" y2="15"></line><line x1="12" y1="10" x2="22" y2="10"></line></svg>`,
  battle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"></path><path d="M13 19l6-6"></path><path d="M16 16l4 4"></path><path d="M19 13l3 3"></path></svg>`,
  war: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"></path><path d="M13 19l6-6"></path><path d="M16 16l4 4"></path><path d="M19 13l3 3"></path></svg>`,
  girls: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
  "3d": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
  physics: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><line x1="3" y1="12" x2="9" y2="12"></line><line x1="15" y1="12" x2="21" y2="12"></line><line x1="12" y1="3" x2="12" y2="9"></line><line x1="12" y1="15" x2="12" y2="21"></line></svg>`,
  brain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-5.04z"></path><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-5.04z"></path></svg>`,
  word: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  math: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="9" x2="19" y2="9"></line><line x1="5" y1="15" x2="19" y2="15"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>`,
  educational: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
  building: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="2"></line><line x1="15" y1="22" x2="15" y2="2"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="10" x2="20" y2="10"></line><line x1="4" y1="14" x2="20" y2="14"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>`,
  io: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`,
  arcade: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="11" x2="10" y2="11"></line><line x1="8" y1="9" x2="8" y2="13"></line><rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M15 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path><path d="M18 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path></svg>`,
  shooting: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>`,
  new: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  popular: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>`,
  car: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>`,
  skill: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
  multiplayer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  adventure: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>`,
  sports: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20"></path><path d="M12 2a14.5 14.5 0 0 1 0 20"></path><path d="M2 12h20"></path></svg>`,
  platform: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18"></path><path d="M5 15h6"></path><path d="M13 10h6"></path><path d="M8 5h8"></path></svg>`,
  racing: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16h13l3-5H8l-4 5z"></path><circle cx="7" cy="18" r="2"></circle><circle cx="17" cy="18" r="2"></circle><path d="M3 10h4"></path><path d="M2 13h3"></path></svg>`,
  animal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="10.5" r="2.5"></circle><circle cx="18.5" cy="10.5" r="2.5"></circle><circle cx="8.5" cy="5.5" r="2.5"></circle><circle cx="15.5" cy="5.5" r="2.5"></circle><path d="M7 18.5c0-3 2.2-5.5 5-5.5s5 2.5 5 5.5c0 1.4-1.1 2.5-2.5 2.5-.9 0-1.7-.3-2.5-.8-.8.5-1.6.8-2.5.8A2.5 2.5 0 0 1 7 18.5z"></path></svg>`,
  simulation: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="2"></rect><path d="M8 9h8"></path><path d="M8 13h3"></path><path d="M14 13h2"></path><path d="M9 19v3"></path><path d="M15 19v3"></path></svg>`,
  board: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18"></path><path d="M3 15h18"></path><path d="M9 3v18"></path><path d="M15 3v18"></path></svg>`,
};

function articlePathPrefix(record, options = {}) {
  return options.dynamic
    ? pickRandom(ARTICLE_PREFIX_POOL)
    : ARTICLE_PREFIX_POOL[hashNum(`${record?.code || ""}:prefix`) % ARTICLE_PREFIX_POOL.length];
}

function articleActionPrefix(record, options = {}) {
  return options.dynamic
    ? pickRandom(ARTICLE_ACTION_POOL)
    : ARTICLE_ACTION_POOL[hashNum(`${record?.code || ""}:action`) % ARTICLE_ACTION_POOL.length];
}

function currentArticlePath(record, options = {}) {
  const prefix = articlePathPrefix(record, options);
  const slug = articleSlugMixed(record?.title || "");
  const folder = `${record?.f1 || ""}${record?.f2 || ""}`;
  return `/${prefix}/${folder}/${record?.code || ""}${slug ? `/${slug}` : ""}`;
}

function splitPageArticlePath(record, options = {}) {
  const prefix = articlePathPrefix(record, options);
  const action = articleActionPrefix(record, options);
  const code = String(record?.code || "").trim();
  const titleSlug = options.dynamic ? articleSlugMixed(record?.title || "") : articleSlug(record?.title || "");
  const actionSlug = `${action}${code}${titleSlug ? `-${titleSlug}` : ""}`;
  return `/${prefix}/${String(record?.f1 || "").toLowerCase()}/${record?.f2 || ""}/${actionSlug}`;
}

function articlePermalinkMode() {
  const raw = String(process.env.ARTICLE_PERMALINK_MODE || config?.features?.articlePermalinkMode || "both").toLowerCase().trim();
  if (["1", "model1", "current", "old"].includes(raw)) return "model1";
  if (["2", "model2", "split", "split-page", "page"].includes(raw)) return "model2";
  return "both";
}

function enabledArticlePathModels() {
  const mode = articlePermalinkMode();
  if (mode === "model1") return ["model1"];
  if (mode === "model2") return ["model2"];
  return ["model1", "model2"];
}

function articlePathByModel(record, model, options = {}) {
  return model === "model2" ? splitPageArticlePath(record, options) : currentArticlePath(record, options);
}

function randomizedArticlePath(record, options = {}) {
  const activeModels = enabledArticlePathModels();
  const selectedModel = options.model || (
    activeModels.length === 1
      ? activeModels[0]
      : (options.dynamic
        ? pickRandom(activeModels)
        : activeModels[hashNum(`${record?.code || ""}:path-mode`) % activeModels.length])
  );
  return articlePathByModel(record, selectedModel, options);
}

function articlePathVariants(record, options = {}) {
  return enabledArticlePathModels().map((model) => articlePathByModel(record, model, options));
}

function sitemapArticlePath(record) {
  return randomizedArticlePath(record, { dynamic: true });
}

function articlePathModelFromParts(parts = []) {
  if (!Array.isArray(parts) || parts.length !== 4) return "";
  const actionSlug = String(parts[3] || "").toLowerCase();
  if (/^(view|open|read|go|see|get|page|post)/.test(actionSlug)) return "model2";
  return "model1";
}

function isArticlePathModelEnabled(model = "") {
  return enabledArticlePathModels().includes(model);
}

function preferredArticlePath(record) {
  return randomizedArticlePath(record, { dynamic: false });
}

function homepageUnavailableMode() {
  const raw = String(process.env.HOMEPAGE_UNAVAILABLE_MODE || config?.features?.homepageUnavailableMode || "off").toLowerCase().trim();
  if (["1", "true", "yes", "on", "enable", "enabled"].includes(raw)) return "on";
  if (["2", "model2"].includes(raw)) return "model2";
  if (["referrer", "search", "search-engine"].includes(raw)) return "referrer";
  return "off";
}

function isHomepageUnavailableFeatureEnabled() {
  const raw = process.env.HOMEPAGE_UNAVAILABLE_ENABLED;
  if (typeof raw === "string") return ["1", "true", "yes", "on", "enable", "enabled"].includes(raw.toLowerCase().trim());
  return config?.features?.homepageUnavailableEnabled !== false;
}

function isHomepageUnavailableEnabled() {
  if (!isHomepageUnavailableFeatureEnabled()) return false;
  const mode = homepageUnavailableMode();
  if (mode === "on") return true;
  return mode === "model2" && articlePermalinkMode() === "model2";
}

function isAllowedHomepageReferrer(req, host = "") {
  const userAgent = String(req?.headers?.["user-agent"] || "").toLowerCase();
  const allowedCrawlerAgents = [
    "googlebot",
    "bingbot",
    "yandexbot"
  ];
  if (allowedCrawlerAgents.some((item) => userAgent.includes(item))) return true;

  const referrer = String(req?.headers?.referer || req?.headers?.referrer || "");
  if (!referrer) return false;

  const allowedReferrers = [
    "google.",
    "bing.com",
    "yandex.",
    "yahoo.",
    "duckduckgo.com"
  ];
  const referrerLower = referrer.toLowerCase();
  if (allowedReferrers.some((item) => referrerLower.includes(item))) return true;

  try {
    const referrerUrl = new URL(referrer);
    return referrerUrl.host === host && referrerUrl.pathname !== "/";
  } catch {
    return false;
  }
}

function shouldShowHomepageUnavailable(req, host = "") {
  if (!isHomepageUnavailableFeatureEnabled()) return false;
  const mode = homepageUnavailableMode();
  if (mode === "referrer") return !isAllowedHomepageReferrer(req, host);
  return isHomepageUnavailableEnabled();
}

function shouldDropHomepageRequest(req, host = "") {
  return isHomepageUnavailableFeatureEnabled() && homepageUnavailableMode() === "referrer" && !isAllowedHomepageReferrer(req, host);
}

function gameThumb(g) {
  const raw = String(g?.thumb || "").trim();
  if (/^https?:\/\//i.test(raw)) {
    const m = raw.match(/\/img\/(class-\d+)\.(png|jpe?g|webp)$/i);
    if (m) return `/img/${m[1]}.webp`;
    return raw;
  }
  if (raw.startsWith("/img/") || raw.startsWith("/")) return raw;

  const q = encodeURIComponent(`${g.title || "game"} unblocked`);
  return `https://tse1.mm.bing.net/th?q=${q}&w=300&h=200&p=0`;
}

function breadcrumbs(items) {
  return `<nav class="crumbs">${items.map((it, i) => i === items.length - 1 ? `<span>${esc(it.name)}</span>` : `<a href="${esc(it.path)}">${esc(it.name)}</a>`).join("<span>/</span>")}</nav>`;
}

function firstHeader(value = "") {
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw || "").split(",")[0].trim();
}

function normalizeProto(value = "") {
  const proto = firstHeader(value).toLowerCase();
  return proto === "https" || proto === "http" ? proto : "";
}

function requestProto(headers = {}) {
  return normalizeProto(headers["x-forwarded-proto"])
    || normalizeProto(headers["x-forwarded-scheme"])
    || normalizeProto(headers["x-url-scheme"])
    || (firstHeader(headers["x-forwarded-ssl"]).toLowerCase() === "on" ? "https" : "")
    || "http";
}

function requestHost(headers = {}) {
  return firstHeader(headers["x-forwarded-host"]) || firstHeader(headers.host);
}

function originFromHost(host = "", proto = "") {
  const rawHost = firstHeader(host);
  if (/^https?:\/\//i.test(rawHost)) {
    try { return new URL(rawHost).origin; } catch { return rawHost.replace(/\/+$/, ""); }
  }
  const ctx = requestContext.getStore() || {};
  const finalHost = rawHost || ctx.host;
  const finalProto = normalizeProto(proto) || ctx.proto || normalizeProto(BASE_URL.split(":")[0]) || "http";
  return finalHost ? `${finalProto}://${finalHost}` : BASE_URL.replace(/\/+$/, "");
}

function absUrl(pathname = "/", host = "", proto = "") {
  const clean = String(pathname || "/");
  if (/^https?:\/\//i.test(clean)) return clean;
  const base = originFromHost(host, proto);
  return `${base}${clean.startsWith("/") ? clean : `/${clean}`}`;
}


function buildBreadcrumbSchema(items = [], host = "") {
  const list = Array.isArray(items) ? items : [];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absUrl(item.path || "/", host)
    }))
  };
}

function normalizeFaqItems(raw = [], fallback = "") {
  return (Array.isArray(raw) ? raw : [])
    .map((x) => {
      if (typeof x === "string") return { q: normalizeTag(x), a: normalizeTag(fallback) };
      return {
        q: normalizeTag(x?.question || x?.q || x?.title || ""),
        a: normalizeTag(x?.answer || x?.a || x?.description || fallback)
      };
    })
    .filter((x) => x.q && x.a);
}

function buildFaqSchema(raw = [], fallback = "", host = "", pagePath = "") {
  const items = normalizeFaqItems(raw, fallback).slice(0, 20);
  if (!items.length) return null;
  const baseUrl = absUrl(pagePath, host);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item, index) => ({
      "@type": "Question",
      name: item.q,
      url: `${baseUrl}#faq-${index + 1}`,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a
      }
    }))
  };
}

async function resolveBingGameImage(g) {
  const key = String(g.slug || g.title || "").toLowerCase().trim();
  if (!key) return "/favicon.svg";
  if (gameThumbCache.has(key)) return gameThumbCache.get(key);
  gameThumbCache.set(key, "/favicon.svg");
  return "/favicon.svg";
}

async function articleGridHtml(records, limit = 16) {
  const rows = records.slice(0, limit);
  return rows.map((a) => articleCard(a, "")).join("");
}

async function hydrateGameThumbs(records) {
  const rows = Array.isArray(records) ? records : [];
  await Promise.all(rows.map(async (g) => {
    if (!g) return;
    const key = String(g.slug || g.title || "").toLowerCase().trim();
    if (!key || gameThumbCache.has(key)) return;
    const img = await resolveBingGameImage(g);
    gameThumbCache.set(key, img);
  }));
}

async function gameContent(g) {
  if (!g || !g.slug) return {};
  if (contentBySlug.has(g.slug)) return contentBySlug.get(g.slug);
  const cats = Array.isArray(g.cat) ? g.cat : [];
  const folders = cats.length > 0 ? cats.map(c => c.toLowerCase()) : ["root"];
  for (const f of folders) {
    const fp = path.join(CONTENT_GAME_DIR, f, `${g.slug}-unblock-game.json`);
    try {
      const data = JSON.parse(await fs.readFile(fp, "utf8"));
      contentBySlug.set(g.slug, data);
      return data;
    } catch { }
  }
  try {
    const fpRoot = path.join(CONTENT_GAME_DIR, `${g.slug}-unblock-game.json`);
    const data = JSON.parse(await fs.readFile(fpRoot, "utf8"));
    contentBySlug.set(g.slug, data);
    return data;
  } catch { }
  return {};
}

// --- Components Initialization ---


// --- Components Initialization ---

async function walkJsonFiles(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let entries = [];
    try { entries = await fs.readdir(cur, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && e.name.toLowerCase().endsWith(".json")) out.push(full);
    }
  }
  return out;
}

async function loadContentRecords() {
  contentBySlug = new Map();
}

function sitemapGuidesXml(host, proto = "http") {
  const base = host ? `${proto}://${host}` : BASE_URL;
  const urls = games.map((g) => ({ loc: `${base}/guide/${esc(g.slug)}`, changefreq: "weekly", priority: "0.55" }));
  return sitemapUrlset(urls);
}

async function loadGames() {
  const raw = JSON.parse(await fs.readFile(GAMES_JSON, "utf8"));
  games = (Array.isArray(raw) ? raw : []).map((g) => ({ ...g, slug: g.slug || slugify(g.title || "") })).filter((g) => g.slug && g.title);

  const contentFiles = await walkJsonFiles(CONTENT_GAME_DIR);
  for (const file of contentFiles) {
    try {
      const data = JSON.parse(await fs.readFile(file, "utf8"));
      if (data.title) {
        const filename = path.basename(file, ".json");
        const slug = data.slug || filename.replace(/-unblock-game$/i, "");

        const parentDir = path.dirname(file);
        const folderName = path.basename(parentDir);
        let folderCat = (folderName !== "game" && folderName !== "content") ? folderName : null;

        const existing = games.find(g => g.slug === slug);
        if (existing) {
          if (folderCat) {
            if (!Array.isArray(existing.cat)) existing.cat = [];
            if (!existing.cat.includes(folderCat)) existing.cat.push(folderCat);
          }
        } else {
          let cat = ["other"];
          if (Array.isArray(data.cat)) cat = data.cat;
          else if (data.category) cat = [data.category];
          else if (folderCat) cat = [folderCat];

          games.push({
            slug,
            title: data.title,
            cat,
            thumb: data.thumb || data.image || ""
          });
        }
      }
    } catch { }
  }

  bySlug = new Map(games.map((g) => [g.slug, g]));
  byCategory = new Map();
  for (const g of games) {
    const cats = Array.isArray(g.cat) ? g.cat : [];
    for (const c of cats) {
      const key = String(c).toLowerCase().replace(/-/g, " ").trim();
      if (!key) continue;
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key).push(g);
    }
  }
}


function mime(file) {
  const ext = path.extname(file).toLowerCase();
  return {
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".json": "application/json; charset=utf-8"
  }[ext] || "application/octet-stream";
}

const responseCache = new Map();
const RESPONSE_CACHE_MAX = Number(process.env.RESPONSE_CACHE_MAX || 1000);
const HTML_CACHE_TTL = Number(process.env.HTML_CACHE_TTL || 5 * 60 * 1000);
const XML_CACHE_TTL = Number(process.env.XML_CACHE_TTL || 15 * 60 * 1000);
const RSS_CACHE_TTL = Number(process.env.RSS_CACHE_TTL || 15 * 60 * 1000);

function cacheGet(key) {
  const hit = responseCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    responseCache.delete(key);
    return null;
  }
  responseCache.delete(key);
  responseCache.set(key, hit);
  return hit.value;
}

function cacheSet(key, value, ttl) {
  if (!key || ttl <= 0) return value;
  if (responseCache.has(key)) responseCache.delete(key);
  responseCache.set(key, { value, expires: Date.now() + ttl });
  while (responseCache.size > RESPONSE_CACHE_MAX) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
  return value;
}

function cachedValue(key, ttl, producer) {
  const hit = cacheGet(key);
  if (hit !== null) return hit;
  return cacheSet(key, producer(), ttl);
}

function shouldCompress(headers = {}, contentType = "", size = 0) {
  if (size < 1024) return false;
  return /^(text\/|application\/(javascript|json|xml|rss\+xml))/i.test(contentType);
}

function compressPayload(req, headers, payload) {
  const type = String(headers["Content-Type"] || headers["content-type"] || "");
  const input = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload || ""), "utf8");
  if (!shouldCompress(headers, type, input.length)) return { headers, body: input };

  const accept = String(req.headers["accept-encoding"] || "").toLowerCase();
  const outHeaders = { ...headers, Vary: headers.Vary ? `${headers.Vary}, Accept-Encoding` : "Accept-Encoding" };
  const prefersFastGzip = /application\/(xml|rss\+xml)/i.test(type);
  if (prefersFastGzip && accept.includes("gzip")) {
    outHeaders["Content-Encoding"] = "gzip";
    return { headers: outHeaders, body: zlib.gzipSync(input) };
  }
  if (accept.includes("br")) {
    outHeaders["Content-Encoding"] = "br";
    return {
      headers: outHeaders,
      body: zlib.brotliCompressSync(input, {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 4
        }
      })
    };
  }
  if (accept.includes("gzip")) {
    outHeaders["Content-Encoding"] = "gzip";
    return { headers: outHeaders, body: zlib.gzipSync(input) };
  }
  return { headers, body: input };
}

function sendPayload(req, res, status, headers, payload) {
  const compressed = compressPayload(req, headers, payload);
  res.writeHead(status, compressed.headers);
  res.end(compressed.body);
}

function dynamicCacheKey(req, proto, host) {
  if (req.method !== "GET") return "";
  const rawUrl = req.url || "/";
  return `${proto}://${host || "localhost"}${rawUrl}`;
}

function isHtmlCacheablePath(pathname = "") {
  if (pathname === "/games" || pathname === "/categories" || pathname === "/articles" || pathname === "/related" || pathname === "/master-sitemap") return true;
  return pathname.startsWith("/related/")
    || pathname.startsWith("/articles/")
    || pathname.startsWith("/category/")
    || pathname.startsWith("/play/")
    || pathname.startsWith("/guide/")
    || pathname.split("/").filter(Boolean).length === 4;
}

async function serveLocalStatic(urlPath, res, req = null) {
  const safe = path.normalize(decodeURIComponent(urlPath)).replace(/^([.][.][/\\])+/, "");
  const filePath = path.resolve(PUBLIC_DIR, `.${safe}`);
  if (!filePath.startsWith(PUBLIC_DIR)) return false;
  try {
    const data = await fs.readFile(filePath);
    const headers = { "Content-Type": mime(filePath), "Cache-Control": "public, max-age=2592000, stale-while-revalidate=86400" };
    if (req) sendPayload(req, res, 200, headers, data);
    else {
      res.writeHead(200, headers);
      res.end(data);
    }
    return true;
  } catch { return false; }
}

async function serveGlobalAsset(urlPath, res, req = null) {
  const filePath = path.resolve(GLOBAL_PUBLIC, `.${urlPath}`);
  if (!filePath.startsWith(GLOBAL_PUBLIC)) return false;
  try {
    const data = await fs.readFile(filePath);
    const headers = { "Content-Type": mime(filePath), "Cache-Control": "public, max-age=2592000, stale-while-revalidate=86400" };
    if (req) sendPayload(req, res, 200, headers, data);
    else {
      res.writeHead(200, headers);
      res.end(data);
    }
    return true;
  } catch { return false; }
}

function rssXml(host, proto = "http") {
  const now = Date.now();
  const base = host ? `${proto}://${host}` : BASE_URL;
  const pubDate = new Date(now).toUTCString();
  const gameItems = gameEnabled ? partialShuffle(games, 80).map((g) => `    <item>\n      <title>${esc(g.title)}</title>\n      <link>${esc(`${base}/play/${g.slug}`)}</link>\n      <guid>${esc(`${base}/play/${g.slug}`)}</guid>\n      <pubDate>${pubDate}</pubDate>\n      <description>${esc((g.cat || []).join(", ") || "Game")}</description>\n    </item>`) : [];
  const articleItems = partialShuffle(articleIndex.records, 420).map((a) => {
    const url = `${base}${randomizedArticlePath(a, { dynamic: true })}`;
    return `    <item>\n      <title>${esc(a.title)}</title>\n      <link>${esc(url)}</link>\n      <guid>${esc(url)}</guid>\n      <pubDate>${pubDate}</pubDate>\n      <description>${esc(`${a.title} article in ${a.f1}/${a.f2}.`)}</description>\n    </item>`;
  });
  const allItems = shuffle([...gameItems, ...articleItems]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Ozo-Lite Rebuild Feed</title>
    <link>${esc(base)}</link>
    <description>Latest games and articles</description>
    <lastBuildDate>${pubDate}</lastBuildDate>
${allItems.join("\n")}
  </channel>
</rss>`;
}

function sitemapNewsXml(host, proto = "http") {
  const base = host ? `${proto}://${host}` : BASE_URL;
  const today = new Date().toISOString();
  const rows = partialShuffle(articleIndex.records, 500).map((record) => {
    const url = `${base}${randomizedArticlePath(record, { dynamic: true })}`;
    return `  <url>
    <loc>${esc(url)}</loc>
    <news:news>
      <news:publication>
        <news:name>${esc(host ? host.split(":")[0].replace(/^www\./, "") : "Ozo-Lite")}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${today}</news:publication_date>
      <news:title>${esc(record.title)}</news:title>
    </news:news>
  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${rows.join("\n")}
</urlset>`;
}

function normalizeSitemapEntry(entry, fallback = {}) {
  if (typeof entry === "string") {
    return {
      loc: entry,
      changefreq: fallback.changefreq || "weekly",
      priority: fallback.priority || "0.60"
    };
  }
  return {
    loc: entry?.loc || "",
    changefreq: entry?.changefreq || fallback.changefreq || "weekly",
    priority: entry?.priority || fallback.priority || "0.60"
  };
}

function sitemapUrlItem(entry, fallback = {}) {
  const item = normalizeSitemapEntry(entry, fallback);
  const priority = Number.parseFloat(item.priority);
  const safePriority = Number.isFinite(priority) ? Math.max(0, Math.min(1, priority)).toFixed(2) : "0.60";
  return `<url><loc>${esc(item.loc)}</loc><changefreq>${esc(item.changefreq)}</changefreq><priority>${safePriority}</priority></url>`;
}
function resolveSitemapThumb(game) {
  const raw = String(game?.thumb || "").trim();
  if (/^https?:\/\//i.test(raw)) {
    const m = raw.match(/\/img\/(class-\d+)\.(png|jpe?g|webp)$/i);
    if (m) return absUrl(`/img/${m[1]}.webp`);
    return raw;
  }
  if (raw.startsWith("/")) return absUrl(raw);
  return absUrl("/favicon.svg");
}
function sitemapUrlItemGame(url, game) {
  const title = String(game?.title || "Game Play");
  const description = String(game?.meta_description || `${title} playable in browser with no download.`);
  const playerLoc = String(game?.gameUrl || url);
  const thumb = resolveSitemapThumb(game);
  return `<url><loc>${esc(url)}</loc><changefreq>monthly</changefreq><priority>0.45</priority><video:video><video:thumbnail_loc>${esc(thumb)}</video:thumbnail_loc><video:title>${esc(title)}</video:title><video:description>${esc(description)}</video:description><video:player_loc>${esc(playerLoc)}</video:player_loc></video:video></url>`;
}
function sitemapUrlset(urls, fallback = {}) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n${urls.map((url) => sitemapUrlItem(url, fallback)).join("\n")}\n</urlset>`;
}
function sitemapUrlsetGamePlay(urls, host, proto = "http") {
  const base = host ? `${proto}://${host}` : BASE_URL;
  const rows = (Array.isArray(urls) ? urls : []).map((url) => {
    let finalUrl = url;
    if (url.startsWith("http")) {
      const parts = url.split("/play/");
      if (parts.length === 2) finalUrl = `${base}/play/${parts[1]}`;
    }
    const slug = String(finalUrl || "").split("/").pop() || "";
    const game = bySlug.get(slug) || bySlug.get(slug.replace(/-unblock-game$/i, ""));
    return sitemapUrlItemGame(finalUrl, game);
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n${rows.join("\n")}\n</urlset>`;
}
function sitemapIndexXml(files, host, proto = "http") {
  const base = host ? `${proto}://${host}` : BASE_URL;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files.map((f) => `  <sitemap><loc>${esc(`${base}${f}`)}</loc></sitemap>`).join("\n")}\n</sitemapindex>`;
}
function sitemapStaticXml(host, proto = "http") {
  const base = host ? `${proto}://${host}` : BASE_URL;
  const urls = [
    { loc: `${base}/`, changefreq: "daily", priority: "1.00" },
    { loc: `${base}/articles`, changefreq: "daily", priority: "0.90" },
    { loc: `${base}/rss.xml`, changefreq: "hourly", priority: "0.40" }
  ];
  if (gameEnabled) {
    urls.push({ loc: `${base}/games`, changefreq: "weekly", priority: "0.55" });
    urls.push({ loc: `${base}/categories`, changefreq: "weekly", priority: "0.50" });
  }
  return sitemapUrlset(urls);
}
function sitemapGamesXml(host, proto = "http") {
  const base = host ? `${proto}://${host}` : BASE_URL;
  const urls = [];
  for (const g of games.slice(0, 5000)) urls.push({ loc: `${base}/play/${g.slug}`, changefreq: "monthly", priority: "0.45" });
  for (const [c] of byCategory) urls.push({ loc: `${base}/category/${catSlug(c)}`, changefreq: "weekly", priority: "0.40" });
  return sitemapUrlset(urls);
}
function sitemapArticlesXml(host, proto = "http") {
  const base = host ? `${proto}://${host}` : BASE_URL;
  const urls = partialShuffle(articleIndex.records, Math.min(5000, articleIndex.records.length))
    .map((a) => ({ loc: `${base}${sitemapArticlePath(a)}`, changefreq: "daily", priority: "0.90" }));
  return sitemapUrlset(urls);
}

function buildArticleSitemapTree() {
  const tree = new Map();
  for (const record of articleIndex.records) {
    const f1 = String(record.f1 || "").trim();
    const f2 = String(record.f2 || "").trim();
    if (!f1 || !f2) continue;
    if (!tree.has(f1)) tree.set(f1, new Map());
    const child = tree.get(f1);
    if (!child.has(f2)) child.set(f2, []);
    child.get(f2).push(record);
  }
  return tree;
}

async function buildGameSitemapTree() {
  const tree = new Map();
  for (const g of games) {
    const slug = g.slug;
    const cats = Array.isArray(g.cat) && g.cat.length > 0 ? g.cat : ["other"];
    for (const c of cats) {
      const cat = String(c).toLowerCase();
      if (!tree.has(cat)) tree.set(cat, []);
      tree.get(cat).push(`${BASE_URL}/play/${slug}`);
    }
  }
  return tree;
}

await loadGames();
await loadContentRecords();
articleIndex = await buildArticleIndex({ keywDir: KEYW_DIR, contentDir: APALAH_DIR });
articleIndex.records = articleIndex.records.map((record) => ({ ...record, path: randomizedArticlePath(record) }));
articleIndex.byKey = new Map(articleIndex.records.map((r) => [`${r.f1}:${r.f2}:${r.code}`.toLowerCase(), r]));
articleIndex.byFolderCode = new Map(articleIndex.records.map((r) => [`${r.f1}${r.f2}:${r.code}`.toLowerCase(), r]));
articleIndex.byFolderPairCode = new Map(articleIndex.records.map((r) => [`${r.f1}:${r.f2}:${r.code}`.toLowerCase(), r]));
articleIndex.byCode = new Map();
for (const r of articleIndex.records) {
  const code = String(r.code || "").toLowerCase();
  if (code && !articleIndex.byCode.has(code)) articleIndex.byCode.set(code, r);
}
articleSitemapTree = buildArticleSitemapTree();
gameSitemapTree = await buildGameSitemapTree();

// --- Components Initialization (AFTER DATA LOAD) ---
const gameEnabled = config?.features?.gameOnly === true || config?.features?.gameEnabled !== false;

const { 
  gameCard, 
  featureGameCard, 
  miniGameCard, 
  sidebarHtml, 
  categoriesHtml,
  articleCard,
  gameMetaPanel,
  gameFaqPanel,
  processRichText,
  articleKeywordTags
} = createRenderers({ 
  gameThumb, 
  byCategory, 
  esc, 
  hashNum, 
  normalizeTag, 
  titleCase,
  ARTICLE_FALLBACK_IMAGE,
  articleIndex,
  config
});

const { nowPlayingStrip, articleStrip } = createWidgets({ games, partialShuffle, esc, articleIndex });

const layout = createLayout({ 
  BASE_URL, 
  config, 
  ASSET_VERSION, 
  getAdHtml,
  getGoogleAnalyticsHtml, 
  getAdSenseHtml, 
  getHistatsHtml,
  sidebarHtml 
});

function notFound(host = "") { return layout({ title: "Not Found", canonical: absUrl("/404", host), host, body: `${breadcrumbs([{ name: "Home", path: "/" }, { name: "404", path: "/404" }])}<section class="section"><h1>404</h1><p>Page not found.</p></section>` }); }

function homepageUnavailable(host = "") {
  return layout({
    title: "Domain Not Available",
    canonical: absUrl("/", host),
    host,
    bodyClass: "smart-collapse",
    hideTopAd: true,
    hideBottomAd: true,
    body: `<section class="section"><h1>Domain Not Available</h1><p class="muted">This domain cannot be accessed yet. The website script may not be installed, the domain may not be connected, or the setup is still pending.</p><div class="meta-tags"><span>Installation pending</span><span>Configuration required</span></div></section>`
  });
}



// --- Page Factories Initialization (AFTER COMPONENTS) ---
const keywordLinkSeo = (text = "") => {
  if (!gameEnabled) return String(text);
  const linkGameTitle = (html = "", title = "", slug = "") => {
    if (!bySlug.has(slug)) return html;
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return String(html).replace(new RegExp(`\\b${escaped}\\b`, "gi"), `<a href="/play/${slug}">$&</a>`);
  };
  const gameTitleLinks = [
    ["Drift Boss", "drift-boss"],
    ["Master Chess", "master-chess"],
    ["Cookie Clicker", "cookie-clicker"],
    ["Run 3", "run-3-editor"],
    ["Slope", "slope"],
    ["Moto X3M", "moto-x3m"],
    ["Basketball Stars", "basketball-stars"],
    ["Paper.io 2", "paper-io-2"],
    ["Tunnel Rush", "tunnel-rush"],
    ["Shell Shockers", "shell-shockers"],
    ["1v1.LOL", "1v1lol"]
  ];
  let html = String(text)
    .replace(/\bunblocked games g plus\b/gi, `<a href="/">$&</a>`)
    .replace(/\bg\+ unblocked games\b/gi, `<a href="/">$&</a>`)
    .replace(/\bunblocked games\b/gi, `<a href="/">$&</a>`);
  for (const [title, slug] of gameTitleLinks) {
    html = linkGameTitle(html, title, slug);
  }
  return html;
};

const homePage = createHomePage({
  BASE_URL,
  absUrl,
  articleGridHtml,
  articleIndex,
  breadcrumbs,
  buildBreadcrumbSchema,
  buildFaqSchema,

  esc,
  featureGameCard,
  gameCard,
  gameThumb,
  getGames: () => games,
  hydrateGameThumbs,
  keywordLinkSeo,
  layout,
  nowPlayingStrip,
  articleStrip,
  partialShuffle,
  homeConfig: config.homepage,
  config,
  ARTICLE_FALLBACK_IMAGE,
  readArticleJson
});



const { gamesPage, categoriesPage, categoryPage } = createGameListPages({
  absUrl,
  breadcrumbs,
  buildBreadcrumbSchema,
  catSlug,
  categoryIcons,
  esc,
  featureGameCard,
  gameCard,
  getByCategory: () => byCategory,
  getGames: () => games,
  hydrateGameThumbs,
  layout,
  notFound,
  nowPlayingStrip
});

const guidePage = createGuidePage({
  BASE_URL,
  absUrl,
  breadcrumbs,
  buildBreadcrumbSchema,
  buildFaqSchema,
  clampHtmlPayload,
  esc,
  gameContent,
  gameFaqPanel,
  getBySlug: () => bySlug,
  hydrateGameThumbs,
  layout,
  miniGameCard,
  normalizeTag,
  notFound,
  nowPlayingStrip,
  processRichText,
  relatedGames: (g, n) => relatedGames(g, games, n),
  stripTags,
  gameThumb,
  config,
  getAdHtml: getAdHtml
});

const playPage = createPlayPage({
  BASE_URL,
  absUrl,
  breadcrumbs,
  buildBreadcrumbSchema,
  buildFaqSchema,
  catSlug,
  esc,
  excerpt,
  gameCard,
  gameContent,
  gameFaqPanel,
  gameMetaPanel,
  gameThumb,
  getBySlug: () => bySlug,
  hydrateGameThumbs,
  layout,
  normalizeTag,
  notFound,
  nowPlayingStrip,
  processRichText,
  relatedGames: (g, n) => relatedGames(g, games, n),
  config,
  getAdHtml: getAdHtml
});

searchPage = createSearchPage({
  BASE_URL,
  absUrl,
  articleIndex,
  breadcrumbs,
  cleanSearchTitle,
  esc,
  gameCard,
  getArticleSearchText: async (record) => {
    const key = String(record?.path || "");
    if (!key) return "";
    if (articleSearchTextCache.has(key)) return articleSearchTextCache.get(key);
    let text = `${record.title || ""} ${record.f1 || ""} ${record.f2 || ""}`;
    const normalized = String(text || "").toLowerCase();
    articleSearchTextCache.set(key, normalized);
    return normalized;
  },
  getGames: () => games,
  hydrateGameThumbs,
  layout,
  partialShuffle,
  config
});

masterSitemapPage = createMasterSitemapPage({
  esc,
  absUrl,
  layout,
  games,
  articles: articleIndex.records,
  nowPlayingStrip,
  breadcrumbs,
  getSitemaps: () => {
    const links = ["sitemap.xml", "sitemap-news.xml", "rss.xml", "sitemap/articles.xml", "sitemap/static.xml"];
    if (gameEnabled) {
      links.push("sitemap/guides.xml", "sitemap/games.xml");
      // Game sub-indexes
      for (const f1 of gameSitemapTree.keys()) {
        links.push(`sitemap/games/${encodeURIComponent(f1)}.xml`);
      }
    }
    // Article folder indexes (f1 level only)
    for (const f1 of articleSitemapTree.keys()) {
      links.push(`sitemap/articles/${encodeURIComponent(f1)}.xml`);
    }
    return [...new Set(links)].sort();
  }
});




const { articlesRootPage, articlesFolderPage, articlePageFromDynamic } = createArticlePages({
  BASE_URL,
  absUrl,
  articleGridHtml,
  articleIndex,
  articleKeywordTags,
  breadcrumbs,
  buildBreadcrumbSchema,
  buildFaqSchema,
  clampHtmlPayload,
  esc,
  excerpt,
  gameFaqPanel,
  getGames: () => games,
  hydrateGameThumbs,
  keywordLinkSeo,
  layout,
  matchArticlePath,
  normalizeTag,
  notFound,
  nowPlayingStrip,
  articleStrip,
  partialShuffle,
  processRichText,
  readArticleJson,
  config,
  getAdHtml: getAdHtml
});


function gameUrl(g) {
  if (!g) return "/";
  return `/play/${g.slug}`;
}

const server = http.createServer(async (req, res) => {
  const start = Date.now();
  try {
    const host = requestHost(req.headers);
    const proto = requestProto(req.headers);
    requestContext.enterWith({ host, proto });

    const url = new URL(req.url || "/", `${proto}://${host || "localhost"}`);
    const p = url.pathname;
    const pathname = p;
    const query = Object.fromEntries(url.searchParams.entries());

    if (p === "/" && shouldDropHomepageRequest(req, host)) {
      req.socket.destroy();
      return;
    }

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (duration > 200) {
        console.warn(`[SLOW] ${req.method} ${p} - ${duration}ms (Host: ${host})`);
      }
    });

    const htmlCacheKey = dynamicCacheKey(req, proto, host);
    if (htmlCacheKey && isHtmlCacheablePath(p)) {
      const cachedHtml = cacheGet(`html:${htmlCacheKey}`);
      if (cachedHtml) {
        const status = cachedHtml.includes("<h1>404</h1>") ? 404 : 200;
        return sendPayload(req, res, status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=120, stale-while-revalidate=60" }, cachedHtml);
      }
    }

    if (p === "/style.css") {
      const ok = await serveLocalStatic("/style.css", res, req);
      if (ok) return;
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return void res.end("Not found");
    }
    if (p.startsWith("/img/") || p === "/favicon.svg") {
      const ok = (await serveLocalStatic(p, res, req)) || (await serveGlobalAsset(p, res, req));
      if (ok) return;
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return void res.end("Not found");
    }

    if (p === "/api/games.json") {
      return sendPayload(req, res, 200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" }, JSON.stringify(games));
    }

    if (p === "/robots.txt") {
      const base = host ? `${proto}://${host}` : BASE_URL;
      const content = `User-agent: Googlebot
User-agent: Bingbot
User-agent: Yandex
Allow: /

User-agent: FacebookBot
User-agent: MetaBot
User-agent: ClaudeBot
User-agent: CCBot
User-agent: Omgilibot
Disallow: /

User-agent: *
Allow: /
Allow: /search
Allow: /search/*
Disallow: /master-sitemap

Sitemap: ${base}/sitemap.xml
Sitemap: ${base}/sitemap-news.xml
Sitemap: ${base}/rss.xml`;
      return sendPayload(req, res, 200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" }, content);
    }
    if (p.startsWith("/google") && p.endsWith(".html")) {
      const ok = await serveLocalStatic(p, res, req);
      if (ok) return;
    }
    if (p === "/sitemap.xml") {
      const xml = cachedValue(`xml:${proto}:${host}:${p}`, XML_CACHE_TTL, () => {
        const links = ["/sitemap/articles.xml", "/sitemap-news.xml", "/sitemap/static.xml"];
        if (gameEnabled) {
          links.push("/sitemap/guides.xml");
          links.push("/sitemap/games.xml");
        }
        return sitemapIndexXml(links, host, proto);
      });
      return sendPayload(req, res, 200, { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=1800" }, xml);
    }
    if (p === "/sitemap-news.xml") {
      const xml = sitemapNewsXml(host, proto);
      return sendPayload(req, res, 200, { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=900" }, xml);
    }
    if (p === "/sitemap/guides.xml" && gameEnabled) {
      const xml = cachedValue(`xml:${proto}:${host}:${p}`, XML_CACHE_TTL, () => sitemapGuidesXml(host, proto));
      return sendPayload(req, res, 200, { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=1800" }, xml);
    }
    if (p === "/sitemap/static.xml") {
      const xml = cachedValue(`xml:${proto}:${host}:${p}`, XML_CACHE_TTL, () => sitemapStaticXml(host, proto));
      return sendPayload(req, res, 200, { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=1800" }, xml);
    }
    if (p === "/sitemap/games.xml" && gameEnabled) {
      const xml = cachedValue(`xml:${proto}:${host}:${p}`, XML_CACHE_TTL, () => {
        const indexes = [...gameSitemapTree.keys()].sort((a, b) => a.localeCompare(b)).map((f1) => `/sitemap/games/${encodeURIComponent(f1)}.xml`);
        return sitemapIndexXml(indexes, host, proto);
      });
      return sendPayload(req, res, 200, { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=1800" }, xml);
    }
    if (p === "/sitemap/articles.xml") {
      const xml = cachedValue(`xml:${proto}:${host}:${p}`, XML_CACHE_TTL, () => {
        const indexes = [...articleSitemapTree.keys()].sort((a, b) => a.localeCompare(b)).map((f1) => `/sitemap/articles/${encodeURIComponent(f1)}.xml`);
        return sitemapIndexXml(indexes, host, proto);
      });
      return sendPayload(req, res, 200, { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=1800" }, xml);
    }
    if (p.startsWith("/sitemap/articles/")) {
      const filename = decodeURIComponent(p.split("/")[3] || "").replace(".xml", "");

      if (filename.length === 3) {
        // Folder level (f1) index - lists subfolders (f2)
        const f1 = filename;
        const child = articleSitemapTree.get(f1);
        if (child) {
          const xml = cachedValue(`xml:${proto}:${host}:${p}`, XML_CACHE_TTL, () => {
            const subSitemaps = [...child.keys()].map(f2 => `/sitemap/articles/${f1}${f2}.xml`);
            return sitemapIndexXml(subSitemaps, host, proto);
          });
          return sendPayload(req, res, 200, { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=1800" }, xml);
        }
      } else if (filename.length === 6) {
        // Subfolder level (f2) - lists actual article URLs
        const f1 = filename.substring(0, 3);
        const f2 = filename.substring(3);
        const child = articleSitemapTree.get(f1);
        if (child) {
          const records = child.get(f2) || null;
          if (records) {
            const base = host ? `${proto}://${host}` : BASE_URL;
            const shuffledRecords = partialShuffle(records, records.length);
            const urls = shuffledRecords
              .map((record) => `${base}${sitemapArticlePath(record)}`)
              .map((loc) => ({ loc, changefreq: "daily", priority: "0.90" }));
            const xml = sitemapUrlset(urls);
            return sendPayload(req, res, 200, { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=1800" }, xml);
          }
        }
      }
    }
    if (p.startsWith("/sitemap/games/") && gameEnabled) {
      const key = decodeURIComponent(p.split("/")[3] || "").replace(".xml", "");
      const urls = gameSitemapTree.get(key) || null;
      if (urls) {
        const xml = cachedValue(`xml:${proto}:${host}:${p}`, XML_CACHE_TTL, () => sitemapUrlsetGamePlay([...new Set(urls)], host, proto));
        return sendPayload(req, res, 200, { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=1800" }, xml);
      }
    }
    if (p === "/rss.xml") {
      const xml = cachedValue(`rss:${proto}:${host}:${p}`, RSS_CACHE_TTL, () => rssXml(host, proto));
      return sendPayload(req, res, 200, { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=1800" }, xml);
    }

    // FAST 404 for Malicious Scanners (Prevent CPU Spike)
    if (p.endsWith(".php") || p.includes("/wp-") || p.includes("/owa") || p.includes("/cgi-bin") || p.endsWith(".jsp")) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return void res.end("Not Found");
    }

    const parts = p.split("/").filter(Boolean);

    // 301 Redirect for old URLs (arcade, game, view, or play with ID) to new clean /play/SLUG format
    const oldPrefixes = ["arcade", "game", "view", "play"];
    if (gameEnabled && parts.length >= 2 && oldPrefixes.includes(parts[0])) {
      const rawSlug = parts[parts.length - 1];
      // Try exact match, then try removing common AGC suffixes
      const cleanSlug = rawSlug.replace(/-unblock-game$/i, "").replace(/-game$/i, "");
      const game = bySlug.get(rawSlug) || bySlug.get(cleanSlug);

      if (game) {
        const targetUrl = gameUrl(game);
        if (p !== targetUrl) {
          res.writeHead(301, { "Location": targetUrl + (url.search ? url.search : "") });
          return res.end();
        }
      }
    }

    // Redirect articles indexed with /guide/ prefix to /read/ prefix
    if (p.startsWith("/guide/") && parts.length === 4) {
      const newPath = `/read/${parts[1]}/${parts[2]}/${parts[3]}`;
      res.writeHead(301, { "Location": newPath + (url.search ? url.search : "") });
      return res.end();
    }

    let html = "";
    if (p === "/") html = shouldShowHomepageUnavailable(req, host) ? homepageUnavailable(host) : await homePage(host, parseInt(query.page || "1", 10));
    else if (p === "/games" && gameEnabled) html = gamesPage(host);
    else if (p === "/categories" && gameEnabled) html = categoriesPage(host);
    else if (p.startsWith("/category/") && gameEnabled) html = categoryPage(p.split("/")[2] || "", host);
    else if (p.startsWith("/play/") && gameEnabled) html = await playPage(p.split("/")[2] || "", host);
    else if (pathname === "/search" && query.q) {
      const relatedTarget = `/related/${slugify(query.q)}${query.page ? `?page=${encodeURIComponent(query.page)}` : ""}`;
      res.writeHead(301, { "Location": relatedTarget });
      return res.end();
    }
    else if (pathname === "/search") html = await searchPage(query.q, query.page || "1", host);
    else if (p === "/related") html = await searchPage("", query.page || "1", host);
    else if (p.startsWith("/related/")) {
      const relatedQuery = decodeURIComponent(parts.slice(1).join(" ")).replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
      html = await searchPage(relatedQuery, query.page || "1", host);
    }
    else if (pathname === "/master-sitemap") html = await masterSitemapPage(host);
    else if (p === "/articles") html = await articlesRootPage(host);
    else if (p.startsWith("/articles/")) {
      const page = parseInt(url.searchParams.get("page") || "1", 10);
      if (parts.length === 2) html = await articlesFolderPage(decodeURIComponent(parts[1]), "", host, page);
      else html = await articlesFolderPage(decodeURIComponent(parts[1]), decodeURIComponent(parts[2] || ""), host, page);
    } else if (p.startsWith("/guide/") && gameEnabled) {
      html = await guidePage(parts[1] || "", host);
    } else if (parts.length === 4) {
      const articlePathModel = articlePathModelFromParts(parts);
      if (articlePathModel && !isArticlePathModelEnabled(articlePathModel)) {
        const record = matchArticlePath(parts, articleIndex);
        if (record) {
          res.writeHead(301, { "Location": preferredArticlePath(record) + (url.search ? url.search : "") });
          return res.end();
        }
      }
      const articleHtml = await articlePageFromDynamic(parts, p, host);
      html = articleHtml || notFound(host);
    } else {
      html = notFound(host);
    }

    const status = html.includes("<h1>404</h1>") ? 404 : 200;
    if (status === 200 && htmlCacheKey && isHtmlCacheablePath(p)) {
      cacheSet(`html:${htmlCacheKey}`, html, HTML_CACHE_TTL);
    }
    sendPayload(req, res, status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=120, stale-while-revalidate=60" }, html);
  } catch (err) {
    console.error("Server Error:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Internal server error");
    } else {
      res.end();
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`rebuild-ozo-lite running at http://${HOST}:${PORT}`);
});
