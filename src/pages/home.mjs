const multiPartPublicSuffixes = new Set([
  "ac.id",
  "biz.id",
  "co.id",
  "go.id",
  "my.id",
  "or.id",
  "sch.id",
  "web.id",
  "co.uk",
  "org.uk",
  "com.au",
  "net.au",
  "org.au",
  "com.br",
  "com.my",
  "com.sg",
  "co.jp",
  "co.nz"
]);

function formatBrandLabel(value = "") {
  return String(value || "Ozo-Lite")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function brandLabelFromHost(host = "") {
  const cleanHost = String(host || "")
    .split(":")[0]
    .toLowerCase()
    .replace(/^www\./, "")
    .trim();
  const parts = cleanHost.split(".").filter(Boolean);
  if (!parts.length || cleanHost === "localhost") return "Ozo-Lite";
  if (parts.length === 1) return formatBrandLabel(parts[0]);

  const suffix = parts.slice(-2).join(".");
  const domainIndex = Math.max(0, parts.length - (multiPartPublicSuffixes.has(suffix) ? 3 : 2));
  const label = domainIndex > 0 ? parts[0] : parts[domainIndex];
  return formatBrandLabel(label);
}

export function createHomePage({
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
  getGames,
  hydrateGameThumbs,
  keywordLinkSeo,
  layout,
  nowPlayingStrip,
  articleStrip,
  partialShuffle,
  homeConfig,
  config,
  ARTICLE_FALLBACK_IMAGE,
  readArticleJson
}) {
  const gameEnabled = config?.features?.gameOnly === true || config?.features?.gameEnabled !== false;
  const gameOnly = gameEnabled && config?.features?.gameOnly === true;
  const plainText = (value = "") => String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
  const limitWords = (value = "", maxWords = 125) => {
    const words = plainText(value).split(/\s+/).filter(Boolean);
    return words.length > maxWords ? `${words.slice(0, maxWords).join(" ")}...` : words.join(" ");
  };
  const uniqueClean = (items = []) => [...new Set(items
    .map((item) => plainText(item).replace(/\s+/g, " ").trim())
    .filter(Boolean))];
  const articleHeroSummary = (data = {}, maxWords = 125) => {
    const title = plainText(data.title || "");
    const keywords = uniqueClean([
      title,
      ...(Array.isArray(data.relatedKeywords) ? data.relatedKeywords : []),
      ...(Array.isArray(data.json?.related_keywords) ? data.json.related_keywords : []),
      ...(Array.isArray(data.keywords) ? data.keywords : []),
      ...(Array.isArray(data.json?.keywords) ? data.json.keywords : [])
    ]).slice(0, 4);
    const source = plainText(data.description || data.descriptionAlt || data.metaDescription || data.json?.description || "");
    const keywordIntro = keywords.length ? `${keywords.join(", ")}. ` : "";
    return limitWords(`${keywordIntro}${source}`, maxWords);
  };

  return async function homePage(host = "", page = 1) {
    const brandName = brandLabelFromHost(host);

    const games = getGames();
    const picks = partialShuffle(games, 18);
    const featured = partialShuffle(games.filter(g => !picks.includes(g)), 6);

    const articleRecords = articleIndex.records || [];
    const pageSize = 100;
    const totalPages = Math.max(1, Math.ceil(articleRecords.length / pageSize));
    const currentPage = Math.max(1, Math.min(totalPages, page));

    const hero = picks[0];
    hydrateGameThumbs([...picks, ...featured, hero].filter(Boolean)).catch(() => { });

    // Dynamic Content from Config
    const metaGames = partialShuffle([...games], 2).map(gx => gx.title).join(" & ");
    const replaceVars = (str = "") => str.replace(/{brand}/g, brandName).replace(/{games}/g, metaGames);

    const art = homeConfig?.article || {};
    const paragraphs = (art.paragraphs || []).map(p => `<p>${keywordLinkSeo(replaceVars(p))}</p>`).join("");
    const sections = (art.sections || []).map(s => {
      let html = `<h3>${keywordLinkSeo(replaceVars(s.title))}</h3>`;
      if (s.content) html += `<p>${keywordLinkSeo(replaceVars(s.content)).replace(/\n/g, "<br>")}</p>`;
      if (s.list) html += `<ul>${s.list.map(li => `<li>${esc(replaceVars(li))}</li>`).join("")}</ul>`;
      return html;
    }).join("");

    const homeFaqs = (homeConfig?.faqs || []).map(f => ({
      q: replaceVars(f.q),
      a: replaceVars(f.a)
    }));

    const paginationHtml = totalPages > 1 ? `<div class="pagination">
      <div class="pager-wrap">
        ${currentPage > 1 ? `<a href="/?page=${currentPage - 1}" class="page-link prev">
          <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" fill="none" stroke-width="2.5"/></svg>
          <span>Prev</span>
        </a>` : `<span class="page-link disabled prev"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" fill="none" stroke-width="2.5"/></svg></span>`}
        
        <div class="page-counter">
          <span class="cur">${currentPage}</span>
          <span class="sep">/</span>
          <span class="total">${totalPages}</span>
        </div>

        ${currentPage < totalPages ? `<a href="/?page=${currentPage + 1}" class="page-link next">
          <span>Next</span>
          <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" fill="none" stroke-width="2.5"/></svg>
        </a>` : `<span class="page-link disabled next"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" fill="none" stroke-width="2.5"/></svg></span>`}
      </div>
    </div>` : "";

    const featuredArticle = gameOnly ? null : partialShuffle(articleRecords, 1)[0];
    const featuredArticleData = featuredArticle && readArticleJson
      ? await readArticleJson(featuredArticle).catch(() => featuredArticle)
      : featuredArticle;
    const featuredArticleTitle = featuredArticleData?.title || featuredArticle?.title || brandName;
    const featuredArticleSummary = featuredArticleData
      ? articleHeroSummary(featuredArticleData, 125)
      : "Explore our latest articles, guides, and walkthroughs on various topics.";
    const effectiveHomeFaqs = gameEnabled ? homeFaqs : [
      {
        q: `What is ${featuredArticleTitle} about?`,
        a: featuredArticleSummary
      },
      {
        q: "How do I find more articles?",
        a: "Use the article search box, open the Article Hub, or follow the featured and related article links on the homepage."
      }
    ];
    const randomizedList = gameOnly ? [] : partialShuffle(articleRecords, Math.min(pageSize, articleRecords.length));
    const gameOnlyFaqs = [
      {
        q: `Where can I play unblocked games on ${brandName}?`,
        a: `Open ${brandName}, search for a game title, or browse the featured games and categories on the homepage.`
      },
      {
        q: `Are ${brandName} games playable on Chromebook?`,
        a: "Most games run directly in the browser, so they are suitable for desktop, laptop, Chromebook, tablet, and mobile browsers."
      },
      {
        q: "Do these online games need downloads?",
        a: "No. The game pages are built for instant browser play with no download or installation required."
      }
    ];
    const homepageFaqs = gameOnly ? gameOnlyFaqs : effectiveHomeFaqs;

    // Featured Drift Boss Game
    const driftBossGame = games.find(g => g.slug === "drift-boss");
    const driftBossSection = gameEnabled && driftBossGame ? `
<section class="section drift-boss-featured">
  <div class="featured-game-header">
    <h2>🏎️ Play Drift Boss Unblocked</h2>
    <p>Master the art of drifting and earn points in our featured game</p>
  </div>
  <div class="drift-boss-container">
    <div class="drift-boss-player">
      <div class="player-wrapper" style="position:relative;width:100%;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:15px;">
        <iframe src="/play/${esc(driftBossGame.slug)}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:15px;" title="${esc(driftBossGame.title)}" allowfullscreen="true" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"></iframe>
      </div>
    </div>
    <div class="drift-boss-info">
      <h3>${esc(driftBossGame.title)}</h3>
      <p style="color:var(--muted);margin:1rem 0;font-size:0.95rem;">Perform perfect drifts to earn points and master the wheel. Play instantly, no downloads needed.</p>
      <a href="/play/${esc(driftBossGame.slug)}" class="cta-btn" style="display:inline-block;padding:0.75rem 1.5rem;background:var(--lime);color:var(--heading);border-radius:8px;text-decoration:none;font-weight:600;margin-top:1rem;">Play Full Game</a>
      <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--line);">
        <p style="font-size:0.9rem;color:var(--muted);"><strong>✨ Why Drift Boss?</strong><br>
        ✓ Instant browser play<br>
        ✓ Works on Chromebook & mobile<br>
        ✓ Completely free<br>
        ✓ No installation needed
        </p>
      </div>
    </div>
  </div>
</section>
` : "";

    const body = `${breadcrumbs([{ name: "Home", path: "/" }])}
${gameEnabled ? nowPlayingStrip() : articleStrip({ label: "New Articles" })}
<section class="hero">
  <div>
    <h1>${esc(gameEnabled ? replaceVars(art.headline || brandName + " Unblocked Games Hub") : featuredArticleTitle)}</h1>
    <p>${gameEnabled ? "Fast loading game portal with featured picks, category discovery, and zero-install gameplay." : esc(featuredArticleSummary)}</p>
    <form class="search" action="/search" method="get">
      <input type="search" name="q" placeholder="${gameEnabled ? "Search games by title or category" : "Search articles..."}">
      <button type="submit">Search</button>
    </form>
    ${!gameEnabled && featuredArticle?.path ? `<a class="hero-read-more" href="${esc(featuredArticle.path)}">Read Full Article</a>` : ""}
  </div>
  ${gameEnabled ? (hero ? `<a class="hero-card" href="/play/${esc(hero.slug)}"><img src="${esc(gameThumb(hero))}" alt="${esc(hero.title)}" fetchpriority="high" loading="eager"><div class="meta"><h2 style="margin:0;font-size:18px">${esc(hero.title)}</h2></div></a>` : "") 
    : (() => {
        if (!featuredArticle) return "";
        const qImage = encodeURIComponent(`${featuredArticleTitle || ""} article`);
        const dynamicThumb = `https://tse1.mm.bing.net/th?q=${qImage}&w=1200&h=675&p=0`;
        const finalHeroImage = featuredArticleData?.json?.image || featuredArticle.thumb || dynamicThumb;
        return `<a class="hero-card" href="${esc(featuredArticle.path)}"><img src="${esc(finalHeroImage)}" alt="${esc(featuredArticleTitle)}" fetchpriority="high" loading="eager"><div class="meta"><span class="badge">Featured Article</span><h2 style="margin:0;font-size:18px">${esc(featuredArticleTitle)}</h2></div></a>`;
      })()}
</section>

${driftBossSection}

${gameEnabled ? `
<section class="section"><h2>Featured Games</h2><div class="feature-grid">${featured.map(g => featureGameCard(g, true)).join("")}</div></section>
<section class="section"><h2>Top Picks</h2><div class="grid">${picks.map((g, i) => gameCard(g, i < 6)).join("")}</div></section>
` : ""}

${gameOnly ? "" : `<section class="section"><h2>${gameEnabled ? "Latest Articles" : "Featured Content"}</h2><div class="article-grid" itemscope itemtype="https://schema.org/ItemList">${await articleGridHtml(randomizedList, pageSize)}</div>${paginationHtml}</section>`}
${gameEnabled ? `<section class="section seo-copy">
  <h2>${esc(replaceVars(art.headline || ""))}</h2>
  ${paragraphs}
  ${sections}
</section>` : `<section class="section seo-copy">
  <h2>${esc(featuredArticleTitle)}</h2>
  <p>${esc(featuredArticleSummary)}</p>
</section>`}
<section class="section faq-panel home-faq">
  <h2>Frequently asked questions</h2>
  <div class="faq-list">
    ${homepageFaqs.map((f, i) => `
    <details id="faq-${i + 1}">
      <summary>${esc(f.q)}<span>+</span></summary>
      <p>${esc(f.a)}</p>
    </details>`).join("")}
  </div>
</section>`;

    let seoTitle = !gameEnabled
      ? featuredArticleTitle
      : replaceVars(homeConfig?.seoTitle || `UNBLOCKED GAMES G+ | ${brandName} FOR SCHOOL: PLAY ${metaGames}`);
    let seoDesc = replaceVars(homeConfig?.seoDescription || (gameEnabled 
      ? `Play thousands of free unblocked games online at ${brandName}.` 
      : `Read latest articles, guides and walkthroughs on ${brandName}.`));
    if (!gameEnabled && featuredArticleSummary) seoDesc = featuredArticleSummary;
    const faqSchema = buildFaqSchema(homepageFaqs, "Game information about " + brandName, host, "/");

    const jsonLd = [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        url: absUrl("/", host),
        name: brandName,
        description: seoDesc,
        potentialAction: {
          "@type": "SearchAction",
          target: `${absUrl("/search", host)}?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        url: absUrl("/", host),
        logo: absUrl("/favicon.svg", host)
      },
      gameOnly ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${brandName} Unblocked Games`,
        url: absUrl("/", host),
        description: seoDesc,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: [...featured, ...picks].slice(0, 24).map((g, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: g.title,
            url: absUrl(`/play/${g.slug}`, host)
          }))
        }
      } : null,
      buildBreadcrumbSchema([{ name: "Home", path: "/" }], host),
      faqSchema
    ].filter(Boolean);

    return layout({
      title: seoTitle + (currentPage > 1 ? ` - Page ${currentPage}` : ""),
      description: seoDesc,
      canonical: absUrl("/", host) + (currentPage > 1 ? `?page=${currentPage}` : ""),
      body,
      jsonLd,
      host
    });
  };
}
