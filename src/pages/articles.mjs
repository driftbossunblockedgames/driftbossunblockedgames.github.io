export function createArticlePages({
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
  getGames,
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
  getAdHtml
}) {
  const gameEnabled = config?.features?.gameOnly === true || config?.features?.gameEnabled !== false;
  const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const searchQuery = (value = "") => encodeURIComponent(String(value).trim()).replace(/%20/g, "+");
  const relatedSlug = (value = "") => String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "topic";
  const relatedHref = (value = "") => `/related/${relatedSlug(value)}`;
  const bingImageUrl = (query = "", index = 0, width = 360, height = 240) => {
    const hostIndex = (index % 4) + 1;
    const cleanQuery = String(query || "").replace(/\s+/g, " ").trim();
    return `https://tse${hostIndex}.mm.bing.net/th?q=${searchQuery(cleanQuery)}&w=${width}&h=${height}&c=7&rs=1&p=0`;
  };
  const humanList = (items = []) => {
    const list = items.filter(Boolean).slice(0, 4);
    if (list.length <= 1) return list[0] || "";
    return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
  };
  const extractKeywords = (data = {}) => {
    const raw = [
      data.title,
      ...(Array.isArray(data.relatedKeywords) ? data.relatedKeywords : []),
      ...(Array.isArray(data.keywords) ? data.keywords : []),
      ...(Array.isArray(data.tags) ? data.tags : [])
    ];
    return [...new Set(raw.map(normalizeTag).filter(Boolean))].slice(0, 12);
  };
  const extractGalleryKeywords = (data = {}) => {
    const raw = [
      ...(Array.isArray(data.relatedKeywords) ? data.relatedKeywords : []),
      ...(Array.isArray(data.related_keywords) ? data.related_keywords : []),
      ...(Array.isArray(data.json?.related_keywords) ? data.json.related_keywords : []),
      ...(Array.isArray(data.keywords) ? data.keywords : []),
      data.title
    ];
    return [...new Set(raw.map(normalizeTag).filter(Boolean))];
  };
  const articleImageGallery = (data = {}) => {
    const keywords = extractGalleryKeywords(data);
    if (!keywords.length) return "";
    const items = Array.from({ length: 20 }, (_, index) => {
      const keyword = keywords[index % keywords.length];
      const query = index < keywords.length ? keyword : `${keyword} ${data.title || ""}`;
      const src = bingImageUrl(query, index);
      return `<a class="article-gallery-item" href="${esc(relatedHref(keyword))}" title="${esc(keyword)}">
        <img src="${esc(src)}" alt="${esc(keyword)} image" loading="lazy" decoding="async" width="360" height="240" referrerpolicy="no-referrer">
        <span>${esc(keyword)}</span>
      </a>`;
    }).join("");
    return `<section class="section article-image-gallery" aria-labelledby="article-gallery-title">
      <div class="article-gallery-head">
        <h2 id="article-gallery-title">Image Gallery</h2>
        <p class="muted">Images related to ${esc(data.title || keywords[0])}.</p>
      </div>
      <div class="article-gallery-grid">${items}</div>
    </section>`;
  };
  const dateValue = (data = {}, names = []) => {
    for (const name of names) {
      const value = data?.[name] || data?.json?.[name];
      if (!value) continue;
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
    return new Date().toISOString();
  };
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
  const descriptionWords = (value = "", maxWords = 300) => {
    const text = plainText(value);
    if (!text) return "";
    const words = text.split(/\s+/).filter(Boolean);
    return words.length > maxWords ? `${words.slice(0, maxWords).join(" ")}...` : words.join(" ");
  };
  const keywordOptimizedDescription = (description = "", primary = "", related = [], maxWords = 300) => {
    const cleanDescription = plainText(description);
    const primaryKeyword = normalizeTag(primary);
    const haystack = cleanDescription.toLowerCase();
    const prefixParts = [];
    if (primaryKeyword && !haystack.includes(primaryKeyword.toLowerCase())) prefixParts.push(primaryKeyword);
    const combined = prefixParts.length ? `${prefixParts.join(". ")}. ${cleanDescription}` : cleanDescription;
    return descriptionWords(combined, maxWords);
  };

  function linkKeywordOnce(html = "", keyword = "", href = "") {
    const cleanKeyword = normalizeTag(keyword);
    if (!html || !cleanKeyword || !href) return html;
    const rx = new RegExp(`\\b(${escapeRegExp(cleanKeyword)})\\b`, "i");
    let linked = false;
    return String(html).split(/(<a\b[\s\S]*?<\/a>|<h[1-6]\b[\s\S]*?<\/h[1-6]>|<[^>]+>)/gi).map((chunk) => {
      if (linked || !chunk || chunk.startsWith("<")) return chunk;
      if (!rx.test(chunk)) return chunk;
      linked = true;
      return chunk.replace(rx, `<a href="${esc(href)}">$1</a>`);
    }).join("");
  }

  async function articlesRootPage(host = "") {
    const rootCounts = new Map();
    for (const record of articleIndex.records) {
      if (!record?.f1) continue;
      rootCounts.set(record.f1, (rootCounts.get(record.f1) || 0) + 1);
    }
    const roots = [...rootCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const latest = articleIndex.records.slice(0, 24);
    const total = articleIndex.records.length;
    const topRoots = [...rootCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name]) => name);
    return layout({ 
      title: "Articles", 
      canonical: absUrl("/articles", host), 
      host, 
      body: `${breadcrumbs([{ name: "Home", path: "/" }, { name: "Articles", path: "/articles" }])}${gameEnabled ? nowPlayingStrip() : articleStrip()}<section class="section"><h1>Article Hub</h1><p class="muted">Browse ${total.toLocaleString("en-US")} articles through organized folders, latest entries, and searchable topic pages. Major article folders include ${esc(humanList(topRoots))}, giving readers a clear path from broad topics to individual keyword pages.</p><div class="meta-tags"><a href="${esc(relatedHref("games"))}">Search Articles</a><a href="/rss.xml">RSS Feed</a><a href="/sitemap-news.xml">News Sitemap</a></div></section><section class="section seo-copy"><h2>Browse Guides by Folder</h2><p>This article index works as the main content hub. Folder pages help group related titles, latest articles keep fresh content visible, and each article page keeps a stable canonical URL so Google can understand the preferred version even when sitemap discovery uses rotating URL variants.</p></section><section class="section"><h2>Article Categories</h2><div class="cat-grid">${roots.map(([r, count]) => `<a class="cat-tile" href="/articles/${encodeURIComponent(r)}"><b>◉</b><span>${esc(r)}</span><em>${count.toLocaleString("en-US")} articles</em></a>`).join("")}</div></section><section class="section"><h2>Latest Guides & Articles</h2><div class="article-grid">${await articleGridHtml(latest, 24)}</div></section>` 
    });
  }

  async function articlesFolderPage(f1, f2 = "", host = "", page = 1) {
    const list = articleIndex.records.filter((r) => String(r.f1).toLowerCase() === String(f1).toLowerCase() && (!f2 || String(r.f2).toLowerCase() === String(f2).toLowerCase()));
    if (!list.length) return notFound(host);

    const pageSize = 48;
    const totalPages = Math.ceil(list.length / pageSize);
    const currentPage = Math.max(1, Math.min(totalPages, page));
    const paginated = list.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const baseNavPath = `/articles/${encodeURIComponent(f1)}${f2 ? `/${encodeURIComponent(f2)}` : ""}`;
    const paginationHtml = totalPages > 1 ? `<div class="pagination">
      <div class="pager-wrap">
        ${currentPage > 1 ? `<a href="${baseNavPath}?page=${currentPage - 1}" class="page-link prev">
          <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" fill="none" stroke-width="2.5"/></svg>
          <span>Prev</span>
        </a>` : `<span class="page-link disabled prev"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" fill="none" stroke-width="2.5"/></svg></span>`}
        
        <div class="page-counter">
          <span class="cur">${currentPage}</span>
          <span class="sep">/</span>
          <span class="total">${totalPages}</span>
        </div>

        ${currentPage < totalPages ? `<a href="${baseNavPath}?page=${currentPage + 1}" class="page-link next">
          <span>Next</span>
          <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" fill="none" stroke-width="2.5"/></svg>
        </a>` : `<span class="page-link disabled next"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" fill="none" stroke-width="2.5"/></svg></span>`}
      </div>
    </div>` : "";

    const crumbs = [{ name: "Home", path: "/" }, { name: "Articles", path: "/articles" }, { name: f1, path: `/articles/${encodeURIComponent(f1)}` }];
    if (f2) crumbs.push({ name: f2, path: `/articles/${encodeURIComponent(f1)}/${encodeURIComponent(f2)}` });
    const child = !f2 ? [...new Set(list.map((i) => i.f2))].sort((a, b) => a.localeCompare(b)) : [];
    const label = f2 ? `${f1} / ${f2}` : f1;
    const sampleTitles = humanList(list.map((i) => i.title));
    return layout({
      title: f2 ? `${f1}/${f2} Articles` : `${f1} Articles`,
      canonical: absUrl(`${baseNavPath}${currentPage > 1 ? `?page=${currentPage}` : ""}`, host),
      host,
      body: `${breadcrumbs(crumbs)}${gameEnabled ? nowPlayingStrip() : articleStrip({ label: "New Articles" })}<section class="section"><h1>${esc(label)} Articles</h1><p class="muted">Browse ${list.length.toLocaleString("en-US")} articles in the ${esc(label)} folder. This hub connects related keyword pages such as ${esc(sampleTitles)} and keeps the article list easy to crawl across paginated entries.</p><div class="meta-tags"><a href="/articles">Article Hub</a><a href="${esc(relatedHref(label))}">Search ${esc(label)}</a></div></section>${child.length ? `<section class="section"><h2>Sub Categories</h2><div class="cat-grid">${child.map((c) => `<a class="cat-tile" href="/articles/${encodeURIComponent(f1)}/${encodeURIComponent(c)}"><b>◍</b><span>${esc(c)}</span><em>Open ${esc(c)}</em></a>`).join("")}</div></section>` : ""}<section class="section seo-copy"><h2>${esc(label)} Guide Index</h2><p>Use this page to move from a folder-level topic to a specific article. The entries below are grouped by the same source folder, which helps strengthen topical relevance and keeps internal linking predictable for search engines.</p></section><section class="section"><h2>Entries</h2><div class="article-grid">${await articleGridHtml(paginated, pageSize)}</div>${paginationHtml}</section>`
    });
  }

  async function articlePageFromDynamic(parts, pathname, host = "") {
    const record = matchArticlePath(parts, articleIndex);
    if (!record) return null;
    const data = await readArticleJson(record);
    const relatedArticles = [];
    const sameFolder = [];
    const sameRoot = [];
    const fallback = [];
    const f1Lower = String(record.f1 || "").toLowerCase();
    const f2Lower = String(record.f2 || "").toLowerCase();
    for (const r of articleIndex.records) {
      if (!r || r.path === record.path) continue;
      const rf1 = String(r.f1 || "").toLowerCase();
      const rf2 = String(r.f2 || "").toLowerCase();
      if (rf1 === f1Lower && rf2 === f2Lower) {
        if (sameFolder.length < 12) sameFolder.push(r);
        continue;
      }
      if (rf1 === f1Lower) {
        if (sameRoot.length < 12) sameRoot.push(r);
        continue;
      }
      if (fallback.length < 20) fallback.push(r);
      if (sameFolder.length >= 12 && sameRoot.length >= 12 && fallback.length >= 20) break;
    }
    relatedArticles.push(...sameFolder, ...sameRoot, ...fallback);
    const relatedTop = partialShuffle(relatedArticles, 10);
    const relatedHtml = await articleGridHtml(relatedTop, 10);
    hydrateGameThumbs(getGames().slice(0, 10)).catch(() => {});
    const crumbs = [{ name: "Home", path: "/" }, { name: "Articles", path: "/articles" }, { name: data.title, path: pathname }];
    const canonicalPath = data.path || record.path || pathname;
    const canonicalUrl = absUrl(canonicalPath, host);
    const primaryKeyword = normalizeTag(data.title);
    const keywordList = extractKeywords(data);
    const secondaryKeywords = keywordList.filter((kw) => kw !== primaryKeyword).slice(0, 5);
    const descriptionSource = data.description || data.json?.description || data.descriptionAlt || data.metaDescription || data.title;
    const description300 = keywordOptimizedDescription(descriptionSource, data.title, keywordList, 300);
    const metaDescription = description300 || data.metaDescription || excerpt(data.description || "", 170);

    let mainDesc = processRichText(clampHtmlPayload(data.description || ""));
    let altDesc = (data.descriptionAlt && data.descriptionAlt !== data.description) ? processRichText(clampHtmlPayload(data.descriptionAlt)) : "";
    let articleHtml = mainDesc + (altDesc ? `<div class="article-description-alt" style="margin-top:20px">${altDesc}</div>` : "");
    articleHtml = linkKeywordOnce(articleHtml, data.title, canonicalPath);

    // Internal Keyword Linking (Same Folder)
    const folderArticles = articleIndex.records.filter(r => 
      r.path !== pathname && 
      String(r.f1).toLowerCase() === f1Lower && 
      String(r.f2).toLowerCase() === f2Lower
    );
    
    let linkCount = 0;
    if (folderArticles.length > 0) {
      const sortedArticles = [...folderArticles].sort((a, b) => b.title.length - a.title.length);
      for (const target of sortedArticles) {
        if (linkCount >= 3) break;
        const title = target.title;
        if (!title || title.length < 5) continue;
        
        const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?<!<[^>]*)(${escapedTitle})(?![^<]*>)`, 'gi');
        
        if (regex.test(articleHtml)) {
          articleHtml = articleHtml.replace(regex, `<a href="${esc(target.path)}">$1</a>`);
          linkCount++;
        }
      }
    }
    
    // Fallback/Supplemental Internal Linking & Ad Injection
    const pos = config.ads.articleAdPositions || { ad1: 'top', ad2: 3, ad3: 5 };
    const separator = articleHtml.includes("</p>") ? "</p>" : (articleHtml.includes("<br>") ? "<br>" : "\n\n");
    let segments = articleHtml.split(separator).filter(s => s.trim().length > 0);

    // Inject "Read also" blocks if we don't have 3 links yet
    if (linkCount < 3 && folderArticles.length > 0) {
      const needed = 3 - linkCount;
      const others = partialShuffle([...folderArticles], 10);
      const positions = [Math.floor(segments.length / 4), Math.floor(2 * segments.length / 4), Math.floor(3 * segments.length / 4)].slice(0, needed);
      
      for (let i = 0; i < positions.length; i++) {
        const pIdx = Math.min(segments.length - 1, positions[i]);
        const target = others[i % others.length];
        if (target && segments[pIdx]) {
           segments[pIdx] += `<p class="internal-link" style="margin: 15px 0; padding: 10px; border-left: 3px solid #b7ff2d; background: rgba(183, 255, 45, 0.05);"><strong>Read also:</strong> <a href="${esc(target.path)}">${esc(target.title)}</a></p>`;
           linkCount++;
        }
      }
    }

    // Apply Global Keyword SEO
    if (keywordLinkSeo) {
      segments = segments.map(s => keywordLinkSeo(s));
    }

    // Inject Ads into segments
    if (segments.length > 0) {
      // Ad 1
      if (pos.ad1 === 'top') {
        segments[0] = `<center style="margin-bottom:20px">${getAdHtml(config.ads.ad1, 600)}</center>` + segments[0];
      } else {
        const idx = Math.min(segments.length - 1, typeof pos.ad1 === 'number' ? pos.ad1 : 0);
        segments[idx] += `<center style="margin:20px 0">${getAdHtml(config.ads.ad1, 600)}</center>`;
      }
      // Ad 2
      let ad2Idx = pos.ad2 === 'mid' ? Math.floor(segments.length / 2) : (typeof pos.ad2 === 'number' ? pos.ad2 : 3);
      ad2Idx = Math.min(segments.length - 1, ad2Idx);
      segments[ad2Idx] += `<center style="margin:20px 0">${getAdHtml(config.ads.ad2, 1400)}</center>`;
      // Ad 3
      let ad3Idx = pos.ad3 === 'bottom' ? segments.length - 1 : (typeof pos.ad3 === 'number' ? pos.ad3 : 5);
      ad3Idx = Math.min(segments.length - 1, ad3Idx);
      if (ad3Idx === ad2Idx && segments.length > ad2Idx + 1) ad3Idx++;
      segments[Math.min(segments.length - 1, ad3Idx)] += `<center style="margin:20px 0">${getAdHtml(config.ads.ad3, 2600)}</center>`;
      
      articleHtml = segments.join(separator) + (separator === "</p>" ? "</p>" : "");
    }

    const hostName = host.split(":")[0] || "Ozo-Lite";
    const partsHost = hostName.split(".").filter(p => p && p.toLowerCase() !== "www");
    const rawBrand = partsHost.length > 0 ? partsHost[0] : "Ozo-Lite";
    const brandName = (rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1)).replace(/-/g, " ");

    const qImage = encodeURIComponent(`${data.title || ""} article`);
    const dynamicThumb = `https://tse1.mm.bing.net/th?q=${qImage}&w=1200&h=675&p=0`;
    const finalImage = data.json?.image ? absUrl(data.json.image, host) : dynamicThumb;
    const imageId = `${canonicalUrl}#primaryimage`;
    const publishedAt = dateValue(data, ["datePublished", "date_published", "published_at", "published", "created_at", "created"]);
    const modifiedAt = dateValue(data, ["dateModified", "date_modified", "modified_at", "updated_at", "updated", "published_at", "published"]);
    const galleryHtml = articleImageGallery(data);
    const hAtomMeta = `<div class="hatom-meta">
      <span class="entry-title">${esc(data.title)}</span>
      <span class="author vcard"><span class="fn">${esc(brandName)}</span></span>
      <time class="published" datetime="${esc(publishedAt)}">${esc(publishedAt)}</time>
      <time class="updated" datetime="${esc(modifiedAt)}">${esc(modifiedAt)}</time>
    </div>`;
    const body = `${breadcrumbs(crumbs)}
${gameEnabled ? nowPlayingStrip() : articleStrip({ label: "New Articles" })}
<section class="section"><h1>${esc(data.title)}</h1></section>

<section class="article-layout"><article class="article-card hentry">${hAtomMeta}<div class="entry-content">${articleHtml}</div></article><aside class="side"><h2 style="margin-top:0">Related Articles</h2><div class="article-grid side-article-grid">${relatedHtml}</div></aside></section>
${galleryHtml}
${articleKeywordTags(data)}
${gameFaqPanel(data)}`;

    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: data.title,
      name: data.title,
      description: metaDescription,
      url: canonicalUrl,
      image: { "@id": imageId },
      thumbnailUrl: finalImage,
      keywords: keywordList,
      author: { "@type": "Person", name: brandName, url: absUrl("/", host) },
      publisher: { 
        "@type": "Organization", 
        name: brandName, 
        logo: absUrl("/favicon.svg", host)
      },
      datePublished: publishedAt,
      dateModified: modifiedAt,
      mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl }
    };
    const imageSchema = {
      "@context": "https://schema.org",
      "@type": "ImageObject",
      "@id": imageId,
      url: finalImage,
      contentUrl: finalImage,
      width: 1200,
      height: 675,
      caption: data.title,
      name: `${data.title} image`,
      description: metaDescription,
      representativeOfPage: true
    };
    const faqSchema = buildFaqSchema(Array.isArray(data.questions) ? data.questions : [], normalizeTag(metaDescription || ""), host, canonicalPath);
    return layout({
      title: data.title,
      description: metaDescription,
      canonical: canonicalUrl,
      body,
      bodyClass: "smart-collapse",
      ogType: "article",
      ogUrl: canonicalUrl,
      ogImage: finalImage,
      jsonLd: [articleSchema, imageSchema, buildBreadcrumbSchema(crumbs, host), faqSchema],
      host,
      hideTopAd: true,
      hideBottomAd: true
    });
  }

  return { articlesRootPage, articlesFolderPage, articlePageFromDynamic };
}
