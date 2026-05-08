function encodeSearchQuery(value = "") {
  return encodeURIComponent(String(value || "").trim()).replace(/%20/g, "+");
}

function relatedSlug(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "topic";
}

function relatedHref(value = "") {
  return `/related/${relatedSlug(value)}`;
}

function pager({ basePath = "", q = "", page = 1, pageCount = 1 }) {
  if (pageCount <= 1) return "";
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const p = clamp(page, 1, pageCount);
  const path = basePath || relatedHref(q);
  const mk = (n) => `${path}?page=${n}`;
  const prev = p > 1 ? `<a class="badge" href="${mk(p - 1)}">Prev</a>` : `<span class="badge" style="opacity:.5">Prev</span>`;
  const next = p < pageCount ? `<a class="badge" href="${mk(p + 1)}">Next</a>` : `<span class="badge" style="opacity:.5">Next</span>`;
  const start = Math.max(1, p - 2);
  const end = Math.min(pageCount, p + 2);
  const nums = [];
  for (let i = start; i <= end; i += 1) {
    if (i === p) nums.push(`<span class="badge" style="font-weight:700">${i}</span>`);
    else nums.push(`<a class="badge" href="${mk(i)}">${i}</a>`);
  }
  return `<div class="meta-tags" style="margin-top:12px">${prev}${nums.join("")}${next}</div>`;
}

export function createSearchPage({
  BASE_URL,
  absUrl,
  articleIndex,
  breadcrumbs,
  cleanSearchTitle,
  esc,
  gameCard,
  getArticleSearchText,
  getGames,
  hydrateGameThumbs,
  layout,
  partialShuffle,
  config
}) {
  const gameOnly = config?.features?.gameOnly === true;

  return async function searchPage(q = "", pageRaw = "1", host = "") {
    const games = getGames();
    const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const stopTerms = new Set(["how", "to", "play", "what", "is", "the", "a", "an", "of", "for", "on", "in", "and"]);
    const focusTerms = terms.filter((t) => t.length > 2 && !stopTerms.has(t));
    const activeTerms = focusTerms.length ? focusTerms : terms;
    const phrase = activeTerms.join(" ");
    const page = Math.max(1, Number.parseInt(String(pageRaw || "1"), 10) || 1);
    const GAMES_PER_PAGE = 24;
    const ARTICLES_PER_PAGE = 24;

    const scoredGames = [];
    if (activeTerms.length) {
      for (const g of games) {
        const hay = `${g.title || ""} ${(g.cat || []).join(" ")}`.toLowerCase();
        let score = 0;
        if (phrase && hay.includes(phrase)) score += 100;
        let matched = 0;
        for (const t of activeTerms) {
          if (hay.includes(t)) {
            score += 10;
            matched += 1;
          }
        }
        if (activeTerms.length >= 3 && matched < 2) continue;
        if (score > 0) scoredGames.push({ item: g, score });
      }
      scoredGames.sort((a, b) => b.score - a.score || String(a.item.title || "").localeCompare(String(b.item.title || "")));
    }

    const scoredArticles = [];
    if (!gameOnly && activeTerms.length) {
      for (const article of articleIndex.records) {
        const hay = await getArticleSearchText(article);
        let score = 0;
        const title = String(article.title || "").toLowerCase();
        if (phrase && hay.includes(phrase)) score += 120;
        if (phrase && title.includes(phrase)) score += 80;
        let matched = 0;
        for (const t of activeTerms) {
          if (title.includes(t)) score += 20;
          else if (hay.includes(t)) score += 8;
          if (hay.includes(t)) matched += 1;
        }
        if (activeTerms.length >= 3 && matched < 2) continue;
        if (score > 0) scoredArticles.push({ item: article, score });
      }
      scoredArticles.sort((a, b) => b.score - a.score || String(a.item.title || "").localeCompare(String(b.item.title || "")));
    }

    const foundGames = scoredGames.map((x) => x.item);
    const foundArticles = scoredArticles.map((x) => x.item);
    const gamePool = activeTerms.length ? (foundGames.length ? foundGames : partialShuffle(games, 48)) : partialShuffle(games, 48);
    const articlePool = gameOnly ? [] : (activeTerms.length ? foundArticles : partialShuffle(articleIndex.records, 96));
    const gamePageCount = Math.max(1, Math.ceil(gamePool.length / GAMES_PER_PAGE));
    const articlePageCount = Math.max(1, Math.ceil(articlePool.length / ARTICLES_PER_PAGE));
    const gameStart = (Math.min(page, gamePageCount) - 1) * GAMES_PER_PAGE;
    const articleStart = (Math.min(page, articlePageCount) - 1) * ARTICLES_PER_PAGE;
    const gameRows = gamePool.slice(gameStart, gameStart + GAMES_PER_PAGE);
    const articleRows = articlePool.slice(articleStart, articleStart + ARTICLES_PER_PAGE);
    const emptyHint = activeTerms.length && !foundGames.length && (!foundArticles.length || gameOnly)
      ? `<p class="muted">No matching results for <strong>${esc(q)}</strong>.</p>`
      : "";
    const displayQuery = q && q.trim() ? q.trim() : (gameOnly ? "online games" : "latest articles and guides");
    const relatedTopics = [...new Set((gameOnly ? gamePool : articlePool)
      .slice(0, 12)
      .map((item) => String(item.title || "").trim())
      .filter(Boolean))]
      .slice(0, 8);
    const topicLinks = relatedTopics.length
      ? `<div class="meta-tags">${relatedTopics.map((topic) => `<a class="badge" href="${esc(relatedHref(topic))}">${esc(cleanSearchTitle(topic))}</a>`).join("")}</div>`
      : "";
    const articleList = !gameOnly && articleRows.length
      ? `<div class="list article-search-list">${articleRows.map((a) => `<a href="${esc(a.path)}"><strong>${esc(cleanSearchTitle(a.title))}</strong></a>`).join("")}</div>`
      : (gameOnly ? "" : `<p class="muted">No article results found yet. Browse related topics below or try a broader keyword.</p>`);
    const gameSection = gameRows.length
      ? `<h2 style="margin-top:18px">${gameOnly ? "Game Results" : "Related Games"}</h2><div class="grid">${gameRows.map(gameCard).join("")}</div>${pager({ q, page, pageCount: gamePageCount })}`
      : "";
    const seoCopy = gameOnly
      ? `<section class="section seo-copy"><h2>Play ${esc(displayQuery)} Online</h2><p>${esc(displayQuery)} results are matched from the game title and category index, then grouped with related browser games for faster discovery.</p><p>Open any game page to play instantly without downloads, or use the topic links to explore similar online games.</p>${topicLinks}</section>`
      : (activeTerms.length
      ? `<section class="section seo-copy"><h2>About ${esc(displayQuery)}</h2><p>${esc(displayQuery)} is covered through related articles, guides, references, and supporting resources. This search page groups the closest matching content so readers and crawlers can discover deeper pages from one focused topic hub.</p><p>Use the article results first for detailed explanations, then explore related topics to continue through connected pages across the site.</p>${topicLinks}</section>`
      : `<section class="section seo-copy"><h2>Explore article topics</h2><p>This search hub highlights current articles, guides, and topic clusters available on the site. Use search terms to narrow the list, or open one of the suggested article topics to reach detailed content pages.</p>${topicLinks}</section>`);
    hydrateGameThumbs(gameRows.slice(0, 120)).catch(() => {});
    return layout({
      title: gameOnly ? `${displayQuery} Games` : `Search ${displayQuery}`,
      description: gameOnly ? `Find and play online games related to ${displayQuery}.` : `Find article results, related guides, and topic references for ${displayQuery}.`,
      canonical: absUrl(`${relatedHref(q)}${page > 1 ? `?page=${page}` : ""}`, host),
      host,
      body: `${breadcrumbs([{ name: "Home", path: "/" }, { name: "Related", path: "/related" }])}<section class="section"><h1>Related: ${esc(displayQuery)}</h1><p class="muted">${gameOnly ? `${gamePool.length} related games` : `${foundArticles.length} articles, ${foundGames.length} related games`} - page ${page}</p>${emptyHint}${gameOnly ? gameSection : `<h2>Article Results</h2>${articleList}${pager({ q, page, pageCount: articlePageCount })}${gameSection}`}</section>${seoCopy}<section class="section faq-panel"><h2>${gameOnly ? "Game search guide" : "Related guide"}</h2><div class="faq-list"><details open><summary>How are results selected?<span>+</span></summary><p>${gameOnly ? "Results are matched by game title, category, and related gameplay topics." : "Results are matched by article title, folder topic, and available keyword text. More exact article matches are shown before supporting game pages."}</p></details><details><summary>${gameOnly ? "Can I play these games in browser?" : "Why open related topics?"}<span>+</span></summary><p>${gameOnly ? "Yes. Open a game result and play from the browser page without downloading files." : "Related topics help readers move from a broad search phrase to deeper pages with more complete explanations and internal references."}</p></details></div></section>`
    });
  };
}
