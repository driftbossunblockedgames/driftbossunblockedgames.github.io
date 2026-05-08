import { esc, catSlug } from "../lib/utils.mjs";

export function createRenderers({ gameThumb, byCategory, hashNum, normalizeTag, titleCase, ARTICLE_FALLBACK_IMAGE, articleIndex, config }) {
  const gameEnabled = config?.features?.gameOnly === true || config?.features?.gameEnabled !== false;
  const gameOnly = gameEnabled && config?.features?.gameOnly === true;
  const relatedSlug = (value = "") => String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "topic";
  const relatedHref = (value = "") => `/related/${relatedSlug(value)}`;

  function gameCard(g, isEager = false) {
    if (!gameEnabled) return "";
    const c = (g.cat || []).slice(0, 1).join(" / ") || "Game";
    const loading = isEager ? "eager" : "lazy";
    const priority = isEager ? 'fetchpriority="high"' : "";
    return `<article class="card"><a href="/play/${esc(g.slug)}"><img src="${esc(gameThumb(g))}" alt="${esc(g.title)}" loading="${loading}" decoding="async" width="180" height="113" ${priority}><div class="body"><h3>${esc(g.title)}</h3><p>${esc(c)}</p></div></a></article>`;
  }

  function featureGameCard(g, isEager = false) {
    if (!gameEnabled) return "";
    const c = (g.cat || []).slice(0, 2).join(" • ") || "Game";
    const loading = isEager ? "eager" : "lazy";
    const priority = isEager ? 'fetchpriority="high"' : "";
    return `<article class="feature-card"><a href="/play/${esc(g.slug)}"><img src="${esc(gameThumb(g))}" alt="${esc(g.title)}" loading="${loading}" decoding="async" width="280" height="158" ${priority}><div class="feature-meta"><span>${esc(c)}</span><h3>${esc(g.title)}</h3></div></a></article>`;
  }

  function miniGameCard(g) {
    if (!gameEnabled) return "";
    return `<a class="mini-card" href="/play/${esc(g.slug)}">
      <div class="mini-thumb">
        <img src="${esc(gameThumb(g))}" alt="${esc(g.title)}" loading="lazy" decoding="async" width="120" height="90">
      </div>
      <div class="mini-info">
        <h4>${esc(g.title)}</h4>
        <span class="play-btn">Play Now</span>
      </div>
    </a>`;
  }


  function sidebarHtml() {
    const categoryIcons = {
      new: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
      popular: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
      puzzle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.4 15a2 2 0 1 0-2.4 2.4V21h-5v-3.6a2 2 0 1 0-2.4-2.4H6V9h3.6A2 2 0 1 0 12 6.6V3h5v3.6A2 2 0 1 0 19.4 9H21v6h-1.6z"/></svg>`,
      skill: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
      "3d": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
      "2-player": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2 21v-2a5 5 0 0 1 5-5h2"/><path d="M22 21v-2a5 5 0 0 0-5-5h-2"/></svg>`,
      sports: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20"/><path d="M12 2a14.5 14.5 0 0 1 0 20"/><path d="M2 12h20"/></svg>`,
      sport: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20"/><path d="M12 2a14.5 14.5 0 0 1 0 20"/><path d="M2 12h20"/></svg>`,
      car: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14l-1.4-5.6A2 2 0 0 0 15.7 10H8.3a2 2 0 0 0-1.9 1.4L5 17z"/><path d="M7 17v2"/><path d="M17 17v2"/><circle cx="7.5" cy="15" r=".5"/><circle cx="16.5" cy="15" r=".5"/></svg>`,
      racing: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16h13l3-5H8l-4 5z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M3 10h4"/><path d="M2 13h3"/></svg>`,
      adventure: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/><path d="M9 3v15"/><path d="M15 6v15"/></svg>`,
      platform: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18"/><path d="M5 15h6"/><path d="M13 10h6"/><path d="M8 5h8"/></svg>`,
      platformer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18"/><path d="M5 15h6"/><path d="M13 10h6"/><path d="M8 5h8"/></svg>`,
      multiplayer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 11a4 4 0 0 0 0-8"/><path d="M21 21v-2a4 4 0 0 0-3-3.9"/></svg>`,
      shooting: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M2 12h4"/><path d="M18 12h4"/></svg>`,
      animal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="10.5" r="2.5"/><circle cx="18.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="5.5" r="2.5"/><circle cx="15.5" cy="5.5" r="2.5"/><path d="M7 18.5c0-3 2.2-5.5 5-5.5s5 2.5 5 5.5c0 1.4-1.1 2.5-2.5 2.5-.9 0-1.7-.3-2.5-.8-.8.5-1.6.8-2.5.8A2.5 2.5 0 0 1 7 18.5z"/></svg>`,
      simulation: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8"/><path d="M8 13h3"/><path d="M14 13h2"/><path d="M9 19v3"/><path d="M15 19v3"/></svg>`,
      girls: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/></svg>`,
      running: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2"/><path d="M6 21l3-6"/><path d="M17 21l-4-7"/><path d="M8 9l4-2 3 3 3 1"/><path d="M12 7l-2 6"/></svg>`,
      board: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>`,
      articles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
      folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`
    };

    let menuHtml = "";
    let categoriesTitle = "Game Categories";
    let catHtml = "";

    if (gameEnabled) {
      menuHtml = `
        <a href="/" class="side-cat"><b><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></b><span>Home</span></a>
        <a href="/games" class="side-cat"><b><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg></b><span>All Games</span></a>
        <a href="/categories" class="side-cat"><b><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></b><span>Categories</span></a>
        ${gameOnly ? "" : `<a href="/articles" class="side-cat"><b><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></b><span>Articles</span></a>`}
      `;
      const sideCats = [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 18);
      catHtml = sideCats.map(([name, items]) => {
        const s = catSlug(name);
        const icon = categoryIcons[s] || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
        return `<a class="side-cat" href="/category/${esc(s)}"><b>${icon}</b><span>${esc(name)}</span><em>${items.length}</em></a>`;
      }).join("");
    } else {
      categoriesTitle = "Article Folders";
      menuHtml = `
        <a href="/" class="side-cat"><b><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></b><span>Home</span></a>
        <a href="/articles" class="side-cat"><b>${categoryIcons.articles}</b><span>All Articles</span></a>
      `;
      
      const f1Folders = new Map();
      (articleIndex.records || []).forEach(r => {
        const f1 = String(r.f1 || "other");
        if (!f1Folders.has(f1)) f1Folders.set(f1, 0);
        f1Folders.set(f1, f1Folders.get(f1) + 1);
      });
      
      const sortedFolders = [...f1Folders.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
      catHtml = sortedFolders.map(([f1, count]) => {
        return `<a class="side-cat" href="/articles/${esc(f1)}"><b>${categoryIcons.folder}</b><span>Folder ${esc(f1)}</span><em>${count}</em></a>`;
      }).join("");
    }

    return `<aside class="sidebar">
      <div class="side-block">
        <h3>Main Menu</h3>
        <div class="side-links">
          ${menuHtml}
        </div>
      </div>
      <div class="side-block">
        <h3>${esc(categoriesTitle)}</h3>
        <div class="side-cats">
          ${catHtml}
        </div>
      </div>
    </aside>`;
  }

  function categoriesHtml(limit = 18) {
    const rows = [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, limit);
    return rows.map(([name, items]) => `<a class="badge" href="/category/${esc(catSlug(name))}">${esc(name)} (${items.length})</a>`).join(" ");
  }

  function articleCard(a, thumb) {
    const q = encodeURIComponent(`${a.title || ""} article`);
    const dynamicThumb = `https://tse1.mm.bing.net/th?q=${q}&w=1200&h=675&p=0`;
    return `<article class="article-item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <meta itemprop="position" content="0">
      <div itemscope itemtype="https://schema.org/Article" itemprop="item">
        <a href="${esc(a.path)}" itemprop="url">
          <img src="${esc(thumb || dynamicThumb || ARTICLE_FALLBACK_IMAGE)}" alt="${esc(a.title)}" loading="lazy" decoding="async" itemprop="image">
          <div class="article-item-body">
            <h3 itemprop="headline">${esc(titleCase(a.title))}</h3>
            <p><span itemprop="articleSection">${esc(titleCase(a.f1))}</span> / ${esc(titleCase(a.f2))}</p>
            <span class="read-more">Read More</span>
          </div>
        </a>
      </div>
    </article>`;
  }

  function gameMetaPanel(g, content, metaData = {}) {
    const cats = [...new Map((Array.isArray(g.cat) ? g.cat : [])
      .map((cat) => [String(cat || "").toLowerCase().trim(), normalizeTag(cat)])
      .filter(([key, value]) => key && value)).values()];
    const primaryCat = cats[0] || "Game";
    const published = content.published_at || content.published || "August 2025";
    const updated = content.updated_at || content.updated || "April 2026";
    const tech = content.technology || "HTML5";
    const platform = content.platform || "Browser (desktop, mobile, tablet)";
    const votes = metaData.votes || (hashNum(g.slug) % 9000) + 1000;
    const rating = metaData.rating || (4.6 + (hashNum(`${g.slug}-rating`) % 4) / 10).toFixed(1);
    const intro = normalizeTag(content.meta_description || content.metaDescription || `${g.title} is a browser game you can play online with related guides, topic references, and similar games collected in one page.`);

    const rawKw = Array.isArray(content?.related_keywords) ? content.related_keywords : (Array.isArray(content?.relatedKeywords) ? content.relatedKeywords : (Array.isArray(content?.keywords) ? content.keywords : []));
    const keywords = [...new Set(rawKw.map((x) => normalizeTag(x)).filter(Boolean))].slice(0, 8);

    return `<section class="section game-meta-panel">
      <div class="meta-head">
        <div class="meta-path"><a href="/">Home</a><span>/</span><a href="/games">Games</a><span>/</span><a href="/category/${esc(catSlug(primaryCat))}">${esc(titleCase(primaryCat))}</a></div>
        <h2>${esc(g.title)} Unblocked</h2>
        <p>${esc(intro)}</p>
      </div>
      <div class="meta-grid">
        <div class="meta-left">
          <h3>Game Details</h3>
          <div><label>PUBLISHED:</label><span>${esc(published)}</span></div>
          <div><label>LAST UPDATED:</label><span>${esc(updated)}</span></div>
          <div><label>TECHNOLOGY:</label><span>${esc(tech)}</span></div>
          <div><label>PLATFORM:</label><span>${esc(platform)}</span></div>
          <div><label>CATEGORY:</label><span>${esc(cats.map((cat) => titleCase(cat)).join(", ") || "Game")}</span></div>
        </div>
        <div class="meta-mid">
          <h3>Related Topics</h3>
          <div class="meta-tags">
            ${keywords.map(kw => `<a href="${esc(relatedHref(kw))}">${esc(kw)}</a>`).join("")}
          </div>
        </div>
        <div class="meta-right">
          <h3>Player Rating</h3>
          <div class="play-rating-stars" data-slug="${esc(g.slug)}">
            <div class="stars-row">
              <span class="star" data-value="1">★</span>
              <span class="star" data-value="2">★</span>
              <span class="star" data-value="3">★</span>
              <span class="star" data-value="4">★</span>
              <span class="star" data-value="5">★</span>
            </div>
            <small class="rating-msg">Rate this game!</small>
          </div>
          <div class="meta-rating"><b>${esc(rating)}</b><small>/5 rating</small><em>${esc(votes)} player votes</em></div>
          <a class="meta-play-cta" href="#game-overlay">Play now</a>
        </div>
      </div>
    </section>`;
  }

  function gameFaqPanel(content) {
    const rawFaq = Array.isArray(content.faq) ? content.faq : (Array.isArray(content.faqs) ? content.faqs : (Array.isArray(content.FAQ) ? content.FAQ : []));
    const rawQuestions = Array.isArray(content.questions) ? content.questions : [];
    const raw = [...rawFaq, ...rawQuestions];
    const title = normalizeTag(content.title || content.name || "this game");
    const fallbackAnswer = normalizeTag(content.meta_description || content.metaDescription || "Play instantly in browser with no download required.");
    let list = raw.map((x) => {
      if (typeof x === "string") return { q: normalizeTag(x), a: fallbackAnswer };
      return { q: normalizeTag(x?.question || x?.q || x?.title || ""), a: normalizeTag(x?.answer || x?.a || x?.description || fallbackAnswer) };
    }).filter((x) => x.q).slice(0, 12);
    if (!list.length) {
      list = [
        {
          q: `How do I play ${title}?`,
          a: `${title} can be played directly in your browser. Open the game page, press Play Now, and wait for the game iframe to load.`
        },
        {
          q: `Do I need to download ${title}?`,
          a: `No download is required. ${title} runs as a browser game on desktop, Chromebook, tablet, and mobile browsers.`
        },
        {
          q: `Is ${title} free to play?`,
          a: `Yes. ${title} is available as a free online game through this page.`
        },
        {
          q: `What should I do if ${title} does not load?`,
          a: `Refresh the page, check your connection, disable strict browser blocking for the game frame, or try another modern browser.`
        }
      ];
    }
    return `<section class="section faq-panel"><h2>FAQs</h2><div class="faq-list">${list.map((x, i) => `<details id="faq-${i + 1}"><summary>${esc(x.q)}<span>+</span></summary><p>${esc(x.a)}</p></details>`).join("")}</div></section>`;
  }

  function processRichText(html = "") {
    const formatInlineRich = (t) => t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/__(.+?)__/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/_(.+?)_/g, "<em>$1</em>");
    const isTableSeparator = (line = "") => {
      const cells = String(line || "").trim().split("|").map((cell) => cell.trim()).filter(Boolean);
      return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
    };
    const tableCells = (line = "") => String(line || "").trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => formatInlineRich(cell.trim()));
    const markdownTableHtml = (tableLines = []) => {
      if (tableLines.length < 2 || !isTableSeparator(tableLines[1])) return "";
      const rows = tableLines.map(tableCells);
      const headers = rows[0] || [];
      const bodyRows = rows.slice(2).filter((row) => row.some(Boolean));
      if (!headers.length || !bodyRows.length) return "";
      return `<div class="table-responsive"><table class="content-table"><thead><tr>${headers.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead><tbody>${bodyRows.map((row) => `<tr>${headers.map((_, i) => `<td>${row[i] || ""}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    };
    let content = String(html || "").trim();
    
    // If it's already full HTML with paragraphs, just do inline formatting
    if (/<p[>\s]/i.test(content)) {
      return formatInlineRich(content);
    }

    const lines = content.split(/\r?\n/);
    let out = [];
    let listType = null; // null, 'ul', 'ol'

    const closeList = () => {
      if (listType === "ul") out.push("</ul>");
      if (listType === "ol") out.push("</ol>");
      listType = null;
    };

    for (let i = 0; i < lines.length; i += 1) {
      let l = lines[i];
      let trimmed = l.trim();
      if (!trimmed) {
        closeList();
        continue;
      }
      let nextTableLine = i + 1;
      while (nextTableLine < lines.length && !lines[nextTableLine].trim()) nextTableLine += 1;
      if (trimmed.startsWith("|") && isTableSeparator(lines[nextTableLine] || "")) {
        closeList();
        const tableLines = [trimmed, lines[nextTableLine].trim()];
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
      
      const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
      const isNumber = /^\d+\.\s+/.test(trimmed);
      const isHeader = /^<h[1-6][>\s]/i.test(trimmed);
      const markdownHeaderMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      const isOtherBlock = /^<(ul|ol|li|p|div|blockquote|center|hr|article|section)/i.test(trimmed);

      if (isBullet) {
        if (listType !== "ul") { closeList(); out.push("<ul>"); listType = "ul"; }
        out.push(`<li>${formatInlineRich(trimmed.replace(/^[-*]\s+/, ""))}</li>`);
      } else if (isNumber) {
        if (listType !== "ol") { closeList(); out.push("<ol>"); listType = "ol"; }
        out.push(`<li>${formatInlineRich(trimmed.replace(/^\d+\.\s+/, ""))}</li>`);
      } else if (markdownHeaderMatch) {
        closeList();
        const level = markdownHeaderMatch[1].length;
        out.push(`<h${level}>${formatInlineRich(markdownHeaderMatch[2])}</h${level}>`);
      } else if (isHeader || isOtherBlock) {
        closeList();
        out.push(formatInlineRich(trimmed));
      } else {
        closeList();
        // If it's a tag but not one we recognize as a block, or just text
        if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
          out.push(formatInlineRich(trimmed));
        } else {
          out.push(`<p>${formatInlineRich(trimmed)}</p>`);
        }
      }
    }
    closeList();
    
    let result = out.join("\n");
    // Post-process cleanup for common bad data patterns
    result = result.replace(/<(ul|ol)[^>]*>\s*<p>/gi, "<$1><li>");
    result = result.replace(/<\/p>\s*<\/(ul|ol)>/gi, "</li></$1>");
    
    return result;
  }

  function articleKeywordTags(data) {
    const raw = Array.isArray(data?.relatedKeywords) ? data.relatedKeywords : (Array.isArray(data?.related_keywords) ? data.related_keywords : (Array.isArray(data?.keywords) ? data.keywords : []));
    const tags = [...new Set(raw.map((x) => normalizeTag(x)).filter(Boolean))].slice(0, 12);
    if (!tags.length) return "";
    return `<section class="section article-related-keywords"><h2>Related Searches</h2><div class="meta-tags article-tags">${tags.map((t) => `<a href="${esc(relatedHref(t))}">${esc(t)}</a>`).join("")}</div></section>`;
  }

  return {
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
  };
}
