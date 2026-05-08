import { esc } from "../lib/utils.mjs";

export function createWidgets({ games, partialShuffle, articleIndex }) {
  function nowPlayingStrip(options = {}) {
    const label = options.label || "Now Playing";
    const limit = options.limit || 12;
    const autoplay = options.autoplay === false ? "0" : "1";
    const extraClass = options.compact ? " compact" : "";
    const customClass = options.className ? ` ${String(options.className).trim()}` : "";
    const trending = partialShuffle(games.slice(4), limit);
    return `<section class="now-playing${extraClass}${customClass}"><strong>${esc(label)}</strong><div class="chips" data-autoplay="${autoplay}">${trending.map((g) => `<a href="/play/${esc(g.slug)}">${esc(g.title)}</a>`).join("")}</div></section>`;
  }

  function articleStrip(options = {}) {
    const label = options.label || "New Articles";
    const limit = options.limit || 12;
    const items = (articleIndex.records || []).slice(0, limit);
    return `<section class="now-playing"><strong>${esc(label)}</strong><div class="chips">${items.map((a) => `<a href="${esc(a.path)}">${esc(a.title)}</a>`).join("")}</div></section>`;
  }

  return {
    nowPlayingStrip,
    articleStrip
  };
}
