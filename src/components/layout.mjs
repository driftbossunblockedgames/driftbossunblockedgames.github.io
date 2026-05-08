import { esc } from "../lib/utils.mjs";

export function createLayout({ 
  BASE_URL, 
  config, 
  ASSET_VERSION, 
  getAdHtml,
  getGoogleAnalyticsHtml, 
  getAdSenseHtml, 
  getHistatsHtml,
  sidebarHtml 
}) {
  const safeCssValue = (value = "") => String(value).replace(/[<>{};]/g, "").trim();
  const themeVarMap = {
    bg: "--bg",
    bg2: "--bg2",
    bgGlow: "--bg-glow",
    panel: "--panel",
    panel2: "--panel2",
    card: "--card",
    card2: "--card2",
    header: "--header-bg",
    sidebar: "--sidebar-bg",
    sidebar2: "--sidebar-bg2",
    input: "--input-bg",
    playerOverlay: "--player-overlay",
    line: "--line",
    text: "--txt",
    heading: "--heading",
    muted: "--muted",
    accent: "--lime",
    accent2: "--lime-soft",
    accentText: "--accent-text",
    glow: "--glow",
    glowSoft: "--glow-soft"
  };
  function themeCss(activeTheme = "") {
    const themes = config.themes || {};
    const theme = themes[activeTheme] || themes[config.activeTheme] || themes.neon || {};
    const colors = theme.colors || {};
    const vars = [];
    for (const [key, cssVar] of Object.entries(themeVarMap)) {
      if (colors[key]) vars.push(`${cssVar}:${safeCssValue(colors[key])}`);
    }
    if (theme.fontFamily) vars.push(`--font-family:${safeCssValue(theme.fontFamily)}`);
    if (theme.baseFontSize) vars.push(`--base-font-size:${safeCssValue(theme.baseFontSize)}`);
    if (theme.radius) vars.push(`--radius:${safeCssValue(theme.radius)}`);
    return vars.length ? `<style id="theme-config">:root{${vars.join(";")}}</style>` : "";
  }

  return function layout({
    title = "Unblocked Games",
    description = "",
    canonical = "",
    body = "",
    jsonLd = [],
    host = "",
    ogType = "website",
    ogTitle = "",
    ogDescription = "",
    ogUrl = "",
    ogImage = "",
    bodyClass = "",
    currentTheme = "",
    hideTopAd = false,
    hideBottomAd = false
  }) {
    const cleanHost = String(host || "").replace(/^https?:\/\//i, "").split("/")[0];
    const rawBrand = cleanHost.split(".")[0] || "Ozo-Lite";
    const brandName = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1);
    const ldList = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
    const activeTheme = currentTheme || config.activeTheme || "neon";
    const gameOnly = config?.features?.gameOnly === true;
    if (!ogTitle) ogTitle = title;
    if (!ogDescription) ogDescription = description;
    if (!ogUrl) ogUrl = canonical;
    if (!ogImage) {
      try {
        ogImage = canonical ? new URL("/img/og-image.jpg", canonical).href : `${BASE_URL}/img/og-image.jpg`;
      } catch {
        ogImage = `${BASE_URL}/img/og-image.jpg`;
      }
    }

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="preconnect" href="https://biggerbreakerfind.com" crossorigin>
  <link rel="dns-prefetch" href="//biggerbreakerfind.com">
  <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossorigin>
  <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
  <link rel="dns-prefetch" href="https://s10.histats.com">
  <title>${esc(String(title).toUpperCase())}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="max-image-preview:large">
  <link rel="canonical" href="${esc(canonical)}">
  <meta property="og:type" content="${esc(ogType)}">
  <meta property="og:title" content="${esc(String(ogTitle).toUpperCase())}">
  <meta property="og:description" content="${esc(ogDescription)}">
  <meta property="og:url" content="${esc(ogUrl)}">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(String(ogTitle).toUpperCase())}">
  <meta name="twitter:description" content="${esc(ogDescription)}">
  <meta name="twitter:image" content="${esc(ogImage)}">
  <link rel="preload" href="/style.css?v=${ASSET_VERSION}" as="style">
  <link rel="stylesheet" href="/style.css?v=${ASSET_VERSION}">
  ${themeCss(activeTheme)}
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  ${ldList.filter(Boolean).map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`).join("\n  ")}
  ${config.verification.googleConsole ? `<meta name="google-site-verification" content="${esc(config.verification.googleConsole)}">` : ""}
  ${getGoogleAnalyticsHtml(config.analytics.googleAnalyticsId)}
  ${getAdSenseHtml(config.analytics.adsenseId, config.analytics.adsenseEnabled)}
</head>
<body class="${esc(bodyClass)} theme-${esc(activeTheme)}">
  <header class="topbar">
    <a class="brand" href="/">${esc(brandName)}</a>
    <div class="top-search">
      <form action="/search" method="get">
        <input type="text" name="q" placeholder="Search games..." required>
        <button type="submit">🔍</button>
      </form>
    </div>
    <nav class="nav">
      <a href="/">Home</a>
      <a href="/games">Games</a>
      <a href="/categories">Categories</a>
      ${gameOnly ? "" : `<a href="/articles">Articles</a>`}
    </nav>
  </header>
  <div class="app-shell">
    ${sidebarHtml()}
    <main class="wrap">
      ${hideTopAd ? "" : `<div class="ad-wrap" style="margin-bottom:20px; min-height:90px; text-align:center">${getAdHtml ? getAdHtml(config.ads.ad1, 500) : config.ads.ad1}</div>`}
      ${body}
      ${hideBottomAd ? "" : `<div class="ad-wrap" style="margin-top:20px; min-height:90px; text-align:center">${getAdHtml ? getAdHtml(config.ads.ad3, 2400) : config.ads.ad3}</div>`}
    </main>
  </div>
  <footer class="footer">
    <div class="footer-links">
      <a href="#privacy" onclick="openModal('privacy'); return false;">Privacy Policy</a>
      <a href="#dmca" onclick="openModal('dmca'); return false;">DMCA</a>
      <a href="#tos" onclick="openModal('tos'); return false;">Terms of Service</a>
      <a href="#contact" onclick="openModal('contact'); return false;">Contact Us</a>
    </div>
    <p>Fast SSR rebuild model. &copy; 2026 ${esc(brandName)}</p>
  </footer>

  <div id="ozModal" class="modal-overlay" onclick="closeModal(event)">
    <div class="modal-content" onclick="event.stopPropagation()">
      <button class="modal-close" onclick="closeModal()">&times;</button>
      <div id="modalBody" class="modal-body-content"></div>
    </div>
  </div>

  <script>
  (() => {
    const toolbar = document.querySelector('.play-actions');
    if (toolbar) {
      const slug = toolbar.getAttribute('data-slug') || '';
      const starsRow = document.querySelector('.stars-row');
      const ratingMsg = document.querySelector('.rating-msg');
      if (starsRow) {
        const stars = starsRow.querySelectorAll('.star');
        const updateStars = (val) => stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.value) <= val));
        const savedRating = localStorage.getItem('rating_' + slug);
        if (savedRating) {
          updateStars(parseInt(savedRating));
          if (ratingMsg) ratingMsg.textContent = 'Thanks for rating!';
        }
        stars.forEach(s => {
          s.onmouseenter = () => updateStars(parseInt(s.dataset.value));
          s.onmouseleave = () => updateStars(parseInt(localStorage.getItem('rating_' + slug) || 0));
          s.onclick = () => {
            const val = parseInt(s.dataset.value);
            localStorage.setItem('rating_' + slug, val);
            updateStars(val);
            if (ratingMsg) ratingMsg.textContent = 'Rating saved!';
          };
        });
      }
      const playerWrap = document.querySelector('.player-stack');
      const player = playerWrap?.querySelector('iframe');
      const voteKey = 'vote_' + slug;
      toolbar.addEventListener('click', async (e) => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        if (action === 'share') {
          const url = location.href;
          try {
            if (navigator.share) { await navigator.share({ title: document.title, url }); return; }
            await navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
          } catch {}
        } else if (action === 'fullscreen') {
          try {
            const target = player || playerWrap || document.documentElement;
            if (!document.fullscreenElement) await target.requestFullscreen();
            else await document.exitFullscreen();
          } catch {}
        } else if (action === 'like' || action === 'dislike') {
          if (localStorage.getItem(voteKey)) return;
          localStorage.setItem(voteKey, action);
          const label = btn.querySelector('.count-label');
          if (label) {
            const count = parseInt(label.textContent.replace(/[^0-9]/g, '')) || 0;
            label.textContent = String(count + 1);
          }
          btn.style.color = '#ffcc00';
        } else if (action === 'comment') {
          const faq = document.querySelector('.faq-panel');
          if (faq) faq.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    const chips = document.querySelector('.chips');
    if (chips) {
      let scrollAmount = 0;
      let isPaused = false;
      const step = 0.6;
      const scroll = () => {
        if (!isPaused) {
          scrollAmount += step;
          if (scrollAmount >= chips.scrollWidth - chips.clientWidth) scrollAmount = 0;
          chips.scrollLeft = scrollAmount;
        }
        requestAnimationFrame(scroll);
      };
      chips.addEventListener('touchstart', () => { isPaused = true; }, { passive: true });
      chips.addEventListener('touchend', () => { scrollAmount = chips.scrollLeft; isPaused = false; }, { passive: true });
      chips.addEventListener('mouseenter', () => isPaused = true);
      chips.addEventListener('mouseleave', () => isPaused = false);
      setTimeout(() => {
        if (chips && chips.scrollWidth > chips.clientWidth + 5) scroll();
      }, 1000);
    }
  })();

  const modalData = {
    privacy: {
      title: 'Privacy Policy',
      content: '<h3>Privacy Policy</h3><p>Your privacy is important to us. This website does not require account registration and may use third-party advertising or analytics services.</p>'
    },
    dmca: {
      title: 'DMCA Policy',
      content: '<h3>DMCA Policy</h3><p>If you believe content on this website infringes your rights, contact us with the affected URL and proof of ownership so we can review it.</p>'
    },
    tos: {
      title: 'Terms of Service',
      content: '<h3>Terms of Service</h3><p>By using this website, you agree to use it responsibly and follow applicable rules in your location, school, workplace, or network.</p>'
    },
    contact: {
      title: 'Contact Us',
      content: '<h3>Contact Us</h3><p>For support, removals, DMCA reports, or general questions, please email <a href="mailto:dmcareportmail@gmail.com">dmcareportmail@gmail.com</a>.</p>'
    }
  };
  function openModal(type) {
    const modal = document.getElementById('ozModal');
    const body = document.getElementById('modalBody');
    const item = modalData[type];
    if (!modal || !body || !item) return;
    body.innerHTML = item.content;
    modal.classList.add('is-active');
  }
  function closeModal(event) {
    if (event && event.target && event.target.id !== 'ozModal') return;
    const modal = document.getElementById('ozModal');
    if (modal) modal.classList.remove('is-active');
  }
  </script>
  ${config.ads.socialBar || ""}
  ${getHistatsHtml([config.analytics.histatsId, config.analytics.histatsIDGlobal])}
</body>
</html>`;
  };
}
