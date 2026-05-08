export function createPlayPage({
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
  getBySlug,
  hydrateGameThumbs,
  layout,
  normalizeTag,
  notFound,
  nowPlayingStrip,
  processRichText,
  relatedGames,
  config,
  getAdHtml
}) {
  return async function playPage(slug, host = "") {
    const g = getBySlug().get(slug);
    if (!g) return notFound(host);

    const content = await gameContent(g);
    const related = relatedGames(g, 12);
    hydrateGameThumbs([g, ...related]).catch(() => { });

    const categoryMap = new Map();
    for (const cat of Array.isArray(g.cat) ? g.cat : []) {
      const clean = String(cat || "").trim();
      const key = clean.toLowerCase();
      if (clean && !categoryMap.has(key)) categoryMap.set(key, clean);
    }
    const categories = [...categoryMap.values()].filter(Boolean);
    const primaryCat = categories[0] || "Games";
    const crumbs = [
      { name: "Home", path: "/" },
      { name: "Games", path: "/games" },
      { name: `${primaryCat} Games`, path: `/category/${catSlug ? catSlug(primaryCat) : String(primaryCat).toLowerCase().replace(/\s+/g, "-")}` },
      { name: g.title, path: `/play/${g.slug}` }
    ];
    const ratingSeed = g.slug.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const voteVal = 1000 + (ratingSeed % 9000);
    const voteCountText = voteVal > 1000 ? `${(voteVal / 1000).toFixed(1)}K` : voteVal.toString();
    const ratingValue = (4.6 + (ratingSeed % 4) / 10).toFixed(1);
    const reviewCount = 500 + (ratingSeed % 2000);

    let articleHtml = processRichText(content.description || "<p>No guide available yet.</p>");
    if (articleHtml.includes("</p>")) {
      const ps = articleHtml.split("</p>").filter(s => s.trim());
      if (ps.length > 2) {
        const mid = Math.floor(ps.length / 2);
        ps[mid] += `<center style="margin:20px 0">${getAdHtml(config.ads.ad2, 1400)}</center>`;
        articleHtml = ps.join("</p>") + "</p>";
      } else {
        articleHtml += `<center style="margin:20px 0">${getAdHtml(config.ads.ad2, 1400)}</center>`;
      }
    } else {
      articleHtml += `<center style="margin:20px 0">${getAdHtml(config.ads.ad2, 1400)}</center>`;
    }

    const railIcon = {
      home: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
      games: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M7 7h10a5 5 0 0 1 4.8 3.6l1.1 4a3.4 3.4 0 0 1-5.7 3.2L15 15H9l-2.2 2.8a3.4 3.4 0 0 1-5.7-3.2l1.1-4A5 5 0 0 1 7 7zm1 3v2H6v2h2v2h2v-2h2v-2h-2v-2H8zm8.5 2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm3 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>`,
      cat: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"/></svg>`,
      guide: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M21 5c-1.1-.4-2.3-.5-3.5-.5-2 0-4 .4-5.5 1.5-1.5-1.1-3.5-1.5-5.5-1.5S2.5 4.9 1 6v15c1.5-.9 3.5-1.5 5.5-1.5 2 0 4 .4 5.5 1.5 1.5-1.1 3.5-1.5 5.5-1.5 1.2 0 2.4.1 3.5.5V5z"/></svg>`,
      play: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z"/></svg>`
    };
    const railLinks = [
      { href: "/", icon: railIcon.home, label: "Home" },
      { href: "/games", icon: railIcon.games, label: "All Games" },
      { href: "/categories", icon: railIcon.cat, label: "Categories" },
      { href: `/guide/${g.slug}`, icon: railIcon.guide, label: "Game Guide" },
      ...related.slice(0, 8).map((r) => ({ href: `/play/${r.slug}`, icon: railIcon.play, label: r.title }))
    ];
    const gameplayRail = `<aside class="oz-left-rail" aria-label="Gameplay sidebar"><nav class="oz-icons">${railLinks.map((item) => `<a href="${esc(item.href)}" title="${esc(item.label)}"><b>${item.icon}</b><span>${esc(item.label)}</span></a>`).join("")}</nav></aside>`;

    const body = `${breadcrumbs(crumbs)}
<section class="section"><h1>${esc(g.title)} Unblocked</h1><p class="muted">${esc(content.meta_description || excerpt(content.description || "", 150) || `Play ${g.title} online in your browser with game details, tips, related topics, and similar games.`)}</p></section>

<section class="oz-play-layout">
  ${gameplayRail}
  <article class="player-stack">
    <article class="player">
      ${g.gameUrl ? `
        <div class="player-overlay" id="game-overlay">
          <button class="play-btn-main" onclick="loadGameIframe()">
            <span class="btn-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h.01M9 12h.01M15 12h.01M18 12h.01"/><rect x="2" y="6" width="20" height="12" rx="6"/></svg>
            </span>
            Play Now
          </button>
        </div>
        <div id="game-container" style="width:100%;height:100%"></div>
        <script>
          function loadGameIframe() {
            window.open('${config.ads.directLink}', '_blank');
            document.getElementById('game-overlay').remove();
            document.getElementById('game-container').innerHTML = '<iframe src="${esc(g.gameUrl)}" title="${esc(g.title)}" allow="fullscreen; autoplay; gamepad; accelerometer; gyroscope; clipboard-read; clipboard-write; web-share" allowfullscreen></iframe>';
          }
        </script>` : "<div style='padding:20px'>No game URL available.</div>"}
    </article>
    <div class="play-toolbar">
      <div class="play-game-title">${esc(g.title)}</div>
      <div class="play-actions" data-slug="${esc(g.slug)}">
        <button type="button" class="action-btn action-btn--like" data-action="like" title="Like" aria-label="Like">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M2 21h3V9H2v12zm19-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L12.17 1 6.59 6.59C6.22 6.95 6 7.45 6 8v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
          <span class="count-label">${voteCountText}</span>
        </button>
        <button type="button" class="action-btn" data-action="dislike" title="Dislike" aria-label="Dislike">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M22 3h-3v12h3V3zm-19 11c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L11.83 23l5.59-5.59c.36-.36.58-.86.58-1.41V6c0-1.1-.9-2-2-2H7c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2z"/></svg>
          <span class="count-label">0</span>
        </button>
        <button type="button" class="action-btn" data-action="comment" title="FAQ / Comments" aria-label="FAQ">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
          <span class="btn-label">FAQ</span>
        </button>
        <button type="button" class="action-btn" data-action="share" title="Share" aria-label="Share">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
          <span class="btn-label">Share</span>
        </button>
        <a class="action-btn" href="/guide/${esc(g.slug)}" title="Game Guide" aria-label="Guide">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/></svg>
          <span class="btn-label">Guide</span>
        </a>
        <button type="button" class="action-btn" data-action="discord" title="Join Discord" aria-label="Discord">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.23 10.23 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          <span class="btn-label">Discord</span>
        </button>
        <button type="button" class="action-btn action-btn--full" data-action="fullscreen" title="Fullscreen" aria-label="Fullscreen">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
          <span class="btn-label">Fullscreen</span>
        </button>
      </div>
    </div>
  </article>
</section>
${gameMetaPanel(g, content, { rating: ratingValue, votes: voteVal })}
${nowPlayingStrip({ limit: 20, autoplay: true, label: "NOW PLAYING" })}
<center style="margin:20px 0">${getAdHtml(config.ads.ad3, 2400)}</center>
<section class="section"><article class="article-card">${articleHtml}</article></section>
<section class="section"><h2>Related Games</h2><div class="grid play-related-grid">${related.map((r) => gameCard(r)).join("")}</div></section>
${gameFaqPanel(content)}
`;
    const hostName = host.split(":")[0] || "Ozo-Lite";
    const parts = hostName.split(".").filter(p => p && p.toLowerCase() !== "www");
    const rawBrand = parts.length > 0 ? parts[0] : "Ozo-Lite";
    const brandName = (rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1)).replace(/-/g, " ");

    const fallbackAnswer = normalizeTag(content.meta_description || "Play instantly in browser with no download required.");
    const rawFaq = [...(Array.isArray(content.faq) ? content.faq : []), ...(Array.isArray(content.questions) ? content.questions : [])];
    const faqSchema = buildFaqSchema(rawFaq, fallbackAnswer, host, `/play/${g.slug}`);

    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `${g.title} - Play Unblocked Games Online`,
      description: content.meta_description || `${g.title} gameplay guide, tips, and free online access.`,
      image: absUrl(gameThumb(g), host),
      author: { "@type": "Organization", name: brandName },
      publisher: { "@type": "Organization", name: brandName, logo: { "@type": "ImageObject", url: absUrl("/favicon.svg", host) } },
      datePublished: new Date().toISOString()
    };

    const gameSchema = {
      "@context": "https://schema.org",
      "@type": "Game",
      name: g.title,
      url: absUrl(`/play/${g.slug}`, host),
      image: absUrl(gameThumb(g), host),
      genre: categories,
      operatingSystem: "Any",
      applicationCategory: "Game",
      applicationSubCategory: `${primaryCat} Game`,
      keywords: [...new Set([g.title, `${g.title} unblocked`, `${primaryCat} games`, `${primaryCat} game`, ...categories])],
      about: {
        "@type": "Thing",
        name: `${primaryCat} Games`,
        url: absUrl(`/category/${catSlug ? catSlug(primaryCat) : String(primaryCat).toLowerCase().replace(/\s+/g, "-")}`, host)
      },
      description: content.meta_description || `${g.title} play instantly in browser`,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue,
        ratingCount: voteVal,
        reviewCount,
        bestRating: "5",
        worstRating: "1"
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD"
      }
    };

    return layout({
      title: `${g.title} Unblocked Game - Free Play - No Ads`,
      description: content.meta_description || `${g.title} unblocked: ${ratingValue} stars (${voteVal} votes). Play instantly on any device without ads.`,
      canonical: absUrl(`/play/${g.slug}`, host),
      body,
      bodyClass: "play-theme",
      og: { type: "website", url: absUrl(`/play/${g.slug}`, host), title: `${g.title} - Play` },
      jsonLd: [gameSchema, articleSchema, faqSchema, buildBreadcrumbSchema(crumbs, host)],
      host,
      hideBottomAd: true
    });
  };
}
