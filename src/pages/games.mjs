export function createGameListPages({
  absUrl,
  breadcrumbs,
  buildBreadcrumbSchema,
  catSlug,
  categoryIcons,
  esc,
  featureGameCard,
  gameCard,
  getByCategory,
  getGames,
  hydrateGameThumbs,
  layout,
  notFound,
  nowPlayingStrip
}) {
  const humanList = (items = []) => {
    const list = items.filter(Boolean).slice(0, 4);
    if (list.length <= 1) return list[0] || "";
    return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
  };
  const relatedSlug = (value = "") => String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "topic";
  const relatedHref = (value = "") => `/related/${relatedSlug(value)}`;
  const itemListSchema = (items = [], host = "") => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.slice(0, 60).map((g, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: g.title,
      url: absUrl(`/play/${g.slug}`, host)
    }))
  });

  function gamesPage(host = "") {
    const games = getGames();
    const featured = games.slice(0, 6);
    hydrateGameThumbs([...featured, ...games.slice(0, 320)]).catch(() => {});
    const categoryCount = new Set(games.flatMap(g => Array.isArray(g.cat) ? g.cat : [])).size;
    const crumbs = [{ name: "Home", path: "/" }, { name: "Games", path: "/games" }];
    const collectionSchema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "All Games",
      url: absUrl("/games", host),
      description: `Browse ${games.length} playable browser games across ${categoryCount} categories.`,
      mainEntity: itemListSchema(games, host)
    };
    return layout({ title: "All Games", canonical: absUrl("/games", host), host, jsonLd: [collectionSchema, buildBreadcrumbSchema(crumbs, host)], body: `${breadcrumbs(crumbs)}${nowPlayingStrip()}<section class="section"><h1>All Games</h1><p class="muted">Browse ${games.length.toLocaleString("en-US")} playable games across ${categoryCount.toLocaleString("en-US")} categories.</p><div class="meta-tags"><a href="/categories">Game Categories</a><a href="/articles">Article Hub</a><a href="/search">Search</a></div></section><section class="section"><h2>Featured Games</h2><div class="feature-grid">${featured.map(featureGameCard).join("")}</div></section><section class="section"><h2>Game Index</h2><div class="grid">${games.slice(0, 320).map(gameCard).join("")}</div></section>` });
  }

  function categoriesPage(host = "") {
    const rows = [...getByCategory().entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const totalGames = rows.reduce((sum, [, items]) => sum + items.length, 0);
    const topRows = [...rows].sort((a, b) => b[1].length - a[1].length).slice(0, 4).map(([name]) => name.toLowerCase());
    const crumbs = [{ name: "Home", path: "/" }, { name: "Categories", path: "/categories" }];
    const collectionSchema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Game Categories",
      url: absUrl("/categories", host),
      description: `Browse ${rows.length} game category hubs containing ${totalGames} playable pages.`,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: rows.map(([name, items], index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${name} Games`,
          url: absUrl(`/category/${catSlug(name)}`, host),
          numberOfItems: items.length
        }))
      }
    };
    return layout({ title: "Categories", canonical: absUrl("/categories", host), host, jsonLd: [collectionSchema, buildBreadcrumbSchema(crumbs, host)], body: `${breadcrumbs(crumbs)}<section class="section"><h1>Game Categories</h1><p class="muted">Explore ${rows.length.toLocaleString("en-US")} game category hubs containing ${totalGames.toLocaleString("en-US")} playable pages. This index groups browser games by clear topics such as ${esc(humanList(topRows))}, so players and crawlers can move from broad categories to focused game collections.</p><div class="meta-tags"><a href="/games">All Games</a><a href="/articles">Article Hub</a><a href="/search">Search</a></div></section><section class="section seo-copy"><h2>Find Games by Topic</h2><p>Each category page collects related games under one theme, making it easier to discover similar gameplay styles, compare titles, and open deeper pages without relying only on search. Use this page as the main category directory before opening a specific game hub.</p></section><section class="section"><h2>Browse Categories</h2><div class="cat-grid">${rows.map(([name, items]) => `<a class="cat-tile" href="/category/${esc(catSlug(name))}"><b>${categoryIcons[catSlug(name)] || categoryIcons[catSlug(name).split("-")[0]] || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`}</b><span>${esc(name)}</span><em>${items.length} games</em></a>`).join("")}</div></section>` });
  }

  function categoryPage(slug, host = "") {
    const entry = [...getByCategory().entries()].find(([name]) => catSlug(name) === slug);
    if (!entry) return notFound(host);
    const [name, items] = entry;
    const sampleGames = humanList(items.map((g) => g.title));
    const keyword = `${name} games`;
    const crumbs = [{ name: "Home", path: "/" }, { name: "Categories", path: "/categories" }, { name, path: `/category/${slug}` }];
    const collectionSchema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${name} Games`,
      url: absUrl(`/category/${slug}`, host),
      description: `Browse ${items.length} ${keyword.toLowerCase()} collected in one focused game hub.`,
      mainEntity: itemListSchema(items, host)
    };
    hydrateGameThumbs(items.slice(0, 220)).catch(() => {});
    return layout({ title: `${name} Games`, canonical: absUrl(`/category/${slug}`, host), host, jsonLd: [collectionSchema, buildBreadcrumbSchema(crumbs, host)], body: `${breadcrumbs(crumbs)}<section class="section"><h1>${esc(keyword)}</h1><p class="muted">Play and browse ${items.length.toLocaleString("en-US")} ${esc(keyword.toLowerCase())} collected in one focused hub. Popular entries in this topic include ${esc(sampleGames)}, with more related browser games listed below.</p><div class="meta-tags"><a href="/categories">All Categories</a><a href="/games">All Games</a><a href="${esc(relatedHref(keyword))}">Search ${esc(name)}</a></div></section><section class="section seo-copy"><h2>About ${esc(keyword)}</h2><p>${esc(keyword)} are grouped here to help players find titles with similar controls, pacing, and gameplay goals. This category page also gives search engines a clearer topic relationship between the game list, individual play pages, and supporting article content.</p></section><section class="section"><h2>${esc(name)} Game List</h2><div class="grid">${items.slice(0, 220).map(gameCard).join("")}</div></section>` });
  }

  return { gamesPage, categoriesPage, categoryPage };
}
