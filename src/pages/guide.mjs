export function createGuidePage({
  BASE_URL,
  absUrl,
  breadcrumbs,
  buildBreadcrumbSchema,
  buildFaqSchema,
  clampHtmlPayload,
  esc,
  gameContent,
  gameFaqPanel,
  getBySlug,
  hydrateGameThumbs,
  layout,
  normalizeTag,
  notFound,
  nowPlayingStrip,
  processRichText,
  relatedGames,
  miniGameCard,
  stripTags,
  gameThumb,
  config,
  getAdHtml
}) {
  return async function guidePage(slug, host = "") {
    const g = getBySlug().get(slug);
    if (!g) return notFound(host);
    const content = await gameContent(g);
    const guideRaw = clampHtmlPayload(content.description_alt || content.description || "");

    let articleHtml = processRichText(guideRaw || "<p>Guide not available yet.</p>");
    if (articleHtml.includes("</p>")) {
      const ps = articleHtml.split("</p>").filter(p => p.trim().length > 0);
      const pos = config.ads.articleAdPositions || { ad1: 'top', ad2: 3, ad3: 5 };

      // Ad 1 Injection
      if (pos.ad1 === 'top') {
        ps[0] = `<center style="margin-bottom:20px">${getAdHtml(config.ads.ad1, 600)}</center>` + ps[0];
      } else {
        const idx = Math.min(ps.length - 1, typeof pos.ad1 === 'number' ? pos.ad1 : 0);
        ps[idx] += `<center style="margin:20px 0">${getAdHtml(config.ads.ad1, 600)}</center>`;
      }

      // Ad 2 Injection
      let ad2Idx = pos.ad2 === 'mid' ? Math.floor(ps.length / 2) : (typeof pos.ad2 === 'number' ? pos.ad2 : 3);
      ad2Idx = Math.min(ps.length - 1, ad2Idx);
      ps[ad2Idx] += `<center style="margin:20px 0">${getAdHtml(config.ads.ad2, 1400)}</center>`;

      // Ad 3 Injection
      let ad3Idx = pos.ad3 === 'bottom' ? ps.length - 1 : (typeof pos.ad3 === 'number' ? pos.ad3 : 5);
      ad3Idx = Math.min(ps.length - 1, ad3Idx);
      if (ad3Idx === ad2Idx && ps.length > ad2Idx + 1) ad3Idx++;
      ps[Math.min(ps.length - 1, ad3Idx)] += `<center style="margin:20px 0">${getAdHtml(config.ads.ad3, 2600)}</center>`;

      articleHtml = ps.join("</p>") + "</p>";
    } else {
      articleHtml = `<center style="margin-bottom:20px">${getAdHtml(config.ads.ad1, 600)}</center>` + articleHtml + `<center style="margin-top:20px">${getAdHtml(config.ads.ad3, 2400)}</center>`;
    }

    const related = relatedGames(g, 8);
    hydrateGameThumbs([g, ...related]).catch(() => { });
    const crumbs = [{ name: "Home", path: "/" }, { name: "Guides", path: "/articles" }, { name: `${g.title} Guide`, path: `/guide/${g.slug}` }];
    const body = `${breadcrumbs(crumbs)}
${nowPlayingStrip()}
<div style="padding: 30px 0 10px">
  <h1 style="font-size: clamp(2rem, 5vw, 2.8rem); margin-bottom: 15px; text-transform: uppercase; letter-spacing: -0.5px; font-weight: 900;">${esc(g.title)} Guide</h1>
  <p class="muted" style="font-size: 1.1rem; line-height: 1.6; max-width: 1000px;">${esc(content.meta_description_blog || content.meta_description || "Detailed game guide, tips, controls, and progression.")}</p>
</div>
<style>
.premium-cta {
  display: inline-flex;
  align-items: center;
  gap: 15px;
  padding: 18px 40px;
  background: linear-gradient(135deg, #ff0055, #ff5500);
  background-size: 200% auto;
  color: #fff !important;
  border-radius: 60px;
  text-decoration: none !important;
  font-weight: 900;
  font-size: 18px;
  letter-spacing: 0.5px;
  box-shadow: 0 15px 35px -10px rgba(255, 0, 85, 0.5);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  animation: ozPulse 2s infinite, ozGradient 3s infinite linear;
  margin: 20px 0;
}
.premium-cta:hover { transform: translateY(-5px) scale(1.05); }
.cta-icon { width: 28px; height: 28px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.cta-icon svg { width: 18px; height: 18px; }
.article-card { font-weight: 400 !important; }
.article-card h1, .article-card h2, .article-card h3 { font-weight: 800 !important; }
@keyframes ozPulse { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }
@keyframes ozGradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
</style>

<section class="article-layout">
  <article class="article-card">
    <div style="margin-bottom:30px; text-align:center">
      <a href="/play/${esc(g.slug)}" class="premium-cta">
        <span class="cta-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>
        <span class="cta-text">PLAY ${esc(g.title).toUpperCase()} NOW</span>
      </a>
    </div>
    <div class="guide-content-inner">${articleHtml}</div>
  </article>
  <aside class="side">
    <h2 style="margin-top:0">Related Games</h2>
    <div class="mini-grid">${related.map((x) => miniGameCard(x)).join("")}</div>
  </aside>
</section>
${gameFaqPanel(content)}`;
    const guideText = stripTags(guideRaw || "");
    const isHowTo = /\bhow to\b/i.test(guideText);
    const hostName = host.split(":")[0] || "Ozo-Lite";
    const partsHost = hostName.split(".").filter(p => p && p.toLowerCase() !== "www");
    const rawBrand = partsHost.length > 0 ? partsHost[0] : "Ozo-Lite";
    const brandName = (rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1)).replace(/-/g, " ");

    const guideSchema = {
      "@context": "https://schema.org",
      "@type": isHowTo ? "HowTo" : "Article",
      headline: `${g.title} Guide`,
      name: `${g.title} Guide`,
      description: content.meta_description_blog || content.meta_description || `Guide for ${g.title}`,
      url: absUrl(`/guide/${g.slug}`, host),
      image: absUrl(gameThumb(g), host),
      author: { "@type": "Organization", name: brandName },
      publisher: { "@type": "Organization", name: brandName, logo: { "@type": "ImageObject", url: absUrl("/favicon.svg", host) } },
      datePublished: new Date().toISOString()
    };
    const faqSchema = buildFaqSchema(Array.isArray(content.questions) ? content.questions : [], normalizeTag(content.meta_description || ""), host, `/guide/${g.slug}`);
    return layout({
      title: `${g.title} - Unblocked Games Guide`,
      description: content.meta_description_blog || content.meta_description || `Guide for ${g.title}`,
      canonical: absUrl(`/guide/${g.slug}`, host),
      body,
      bodyClass: "smart-collapse",
      og: { type: "article", url: absUrl(`/guide/${g.slug}`, host) },
      jsonLd: [guideSchema, buildBreadcrumbSchema(crumbs, host), faqSchema],
      host,
      hideTopAd: true,
      hideBottomAd: true
    });
  };
}
