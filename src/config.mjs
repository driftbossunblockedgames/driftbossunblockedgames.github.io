/**
 * KONFIGURASI UTAMA WEBSITE
 * Di sini Anda bisa mengatur Iklan, Konten Homepage, SEO, dan Analytics.
 */
export const config = {
  // PENGATURAN FITUR
  // gameEnabled: true = website game + artikel, false = fokus artikel saja.
  // gameOnly: true = homepage dan navigasi utama fokus game saja untuk SEO keyword game.
  features: {
    gameEnabled: true, // Jika false, game akan dimatikan dan web fokus menjadi portal artikel
    gameOnly: true, // Aktifkan bersama gameEnabled:true untuk homepage khusus game tanpa blok artikel
    // Pilihan permalink artikel:
    // "model1" = /{prefix}/{f1f2}/{code}/{slug}
    // "model2" = /{prefix}/{f1}/{f2}/{action}{code}-{slug}
    // "both"   = sitemap menampilkan keduanya, link utama dipilih stabil per artikel
    articlePermalinkMode: "both",
    // Mode homepage unavailable:
    // "off"    = homepage normal
    // "on"     = homepage menampilkan error/skrip belum terinstall untuk semua pengunjung
    // "model2" = aktif hanya saat articlePermalinkMode memakai model2
    // "referrer" = blokir direct access, hanya izinkan dari search engine
    homepageUnavailableEnabled: false,
    homepageUnavailableMode: "referrer",
  },

  // PENGATURAN PENTING / SERING DIUBAH
  // Pilihan theme: "neon", "ocean", "ember", "violet", "mono", "white", "almond".
  // Ganti value activeTheme untuk mengubah warna global website.
  activeTheme: "almond",

  // analytics.histatsId: ID Histats khusus situs/domain ini.
  // analytics.histatsIDGlobal: ID Histats global tambahan, boleh dikosongkan.
  // analytics.googleAnalyticsId: ID GA4, contoh "G-XXXXXXXXXX".
  // analytics.adsenseId: Publisher ID AdSense.
  // analytics.adsenseEnabled: true untuk aktifkan script AdSense.
  analytics: {
    histatsId: "3998156",
    histatsIDGlobal: "",
    googleAnalyticsId: "G-Q7YYG6BQ16",
    adsenseId: "ca-pub-6730641570548989",
    adsenseEnabled: false
  },

  // ads.ad1/ad2/ad3: slot iklan utama yang dirender di layout/konten.
  // ads.socialBar: script social bar/popunder tambahan.
  // ads.directLink: link direct yang dibuka saat tombol play diklik.
  // ads.articleAdPositions: posisi sisipan iklan di konten artikel.
  ads: {
    ad1: `<script type="text/javascript">
  atOptions = {
    'key' : '72aae8a75da17a34e48ed84feaa311bf',
    'format' : 'iframe',
    'height' : 90,
    'width' : 728,
    'params' : {}
  };
</script>
<script type="text/javascript" src="https://biggerbreakerfind.com/72aae8a75da17a34e48ed84feaa311bf/invoke.js"></script>`,
    ad2: `<script type="text/javascript">
  atOptions = {
    'key' : '5c2ef2cb97dff829617ea4c4e1d5ca7b',
    'format' : 'iframe',
    'height' : 250,
    'width' : 300,
    'params' : {}
  };
</script>
<script type="text/javascript" src="https://biggerbreakerfind.com/5c2ef2cb97dff829617ea4c4e1d5ca7b/invoke.js"></script>`,
    ad3: `<script type="text/javascript">
  atOptions = {
    'key' : '4b03159602cba0243869c415124b923e',
    'format' : 'iframe',
    'height' : 90,
    'width' : 728,
    'params' : {}
  };
</script>
<script type="text/javascript" src="https://biggerbreakerfind.com/4b03159602cba0243869c415124b923e/invoke.js"></script>`,
    socialBar: `<script src="https://biggerbreakerfind.com/48/5f/74/485f7426bb614d7e620b0e088268e010.js"></script>`,
    directLink: "https://biggerbreakerfind.com/m5c9h7sz5?key=b5c00cea2c5f93da4bf36a756da22d91",
    // In-article ad positions (paragraph index, starts at 0)
    articleAdPositions: {
      ad1: 'top', // 'top' for before content, or paragraph index
      ad3: 5,     // After paragraph 1 (index 0)
      ad2: 3,      // After paragraph 4 (index 3) or use 'mid' for middle
    }
  },

  // seo.robots.allowedBots: bot utama yang diberi Allow.
  // seo.robots.blockedBots: bot yang diblokir dari robots.txt.
  seo: {
    robots: {
      allowedBots: ["Googlebot", "Bingbot", "Yandex"],
      blockedBots: ["FacebookBot", "MetaBot", "ClaudeBot", "CCBot", "Omgilibot"]
    }
  },

  // verification.googleConsole: kode verifikasi Google Search Console.
  verification: {
    googleConsole: "" // Isi dengan kode verifikasi google console jika ada
  },

  // PENGATURAN THEME DETAIL
  // themes: preset warna lengkap. Biasanya cukup ubah activeTheme di atas.
  // colors.bg/bg2/bgGlow: background body.
  // colors.panel/panel2/card/card2: panel, section, card, sidebar item.
  // colors.header/sidebar/sidebar2/input: header, sidebar, input/search.
  // colors.playerOverlay: warna overlay player sebelum game dimuat.
  // colors.line/text/heading/muted: border dan warna font.
  // colors.accent/accent2/accentText: tombol, link, hover, CTA.
  // colors.glow/glowSoft: shadow/glow ringan.
  themes: {
    neon: {
      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
      baseFontSize: "16px",
      radius: "10px",
      colors: {
        bg: "#070b14",
        bg2: "#0c1220",
        bgGlow: "rgba(166,255,0,.08)",
        panel: "#141b2a",
        panel2: "#1a2131",
        card: "#111b2c",
        card2: "#161e2e",
        header: "rgba(8, 12, 21, 0.95)",
        sidebar: "rgba(8, 12, 21, 0.95)",
        sidebar2: "rgba(7, 11, 20, 0.95)",
        input: "#111a28",
        playerOverlay: "rgba(0, 0, 0, 0.20)",
        line: "rgba(255, 255, 255, 0.1)",
        text: "#edf3ff",
        heading: "#ffffff",
        muted: "#9eb0c8",
        accent: "#b7ff2d",
        accent2: "#97d62d",
        accentText: "#17210a",
        glow: "rgba(183, 255, 45, 0.35)",
        glowSoft: "rgba(183, 255, 45, 0.12)"
      }
    },
    ocean: {
      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
      baseFontSize: "16px",
      radius: "10px",
      colors: {
        bg: "#061018",
        bg2: "#0a1926",
        bgGlow: "rgba(45, 164, 255, .11)",
        panel: "#102333",
        panel2: "#162d40",
        card: "#0e2233",
        card2: "#132b3f",
        header: "rgba(6, 16, 24, 0.95)",
        sidebar: "rgba(6, 16, 24, 0.96)",
        sidebar2: "rgba(8, 20, 31, 0.96)",
        input: "#0d2030",
        playerOverlay: "rgba(2, 12, 20, 0.24)",
        line: "rgba(143, 194, 230, 0.16)",
        text: "#eef8ff",
        heading: "#ffffff",
        muted: "#9cc2dc",
        accent: "#2da4ff",
        accent2: "#58d6ff",
        accentText: "#031421",
        glow: "rgba(45, 164, 255, 0.34)",
        glowSoft: "rgba(45, 164, 255, 0.13)"
      }
    },
    ember: {
      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
      baseFontSize: "16px",
      radius: "10px",
      colors: {
        bg: "#130b08",
        bg2: "#1d100b",
        bgGlow: "rgba(255, 130, 45, .12)",
        panel: "#251713",
        panel2: "#312018",
        card: "#211611",
        card2: "#2b1c15",
        header: "rgba(19, 11, 8, 0.95)",
        sidebar: "rgba(19, 11, 8, 0.96)",
        sidebar2: "rgba(25, 14, 10, 0.96)",
        input: "#211510",
        playerOverlay: "rgba(34, 16, 0, 0.24)",
        line: "rgba(255, 205, 170, 0.15)",
        text: "#fff4ed",
        heading: "#ffffff",
        muted: "#d1aa94",
        accent: "#ff992d",
        accent2: "#ffbd59",
        accentText: "#211000",
        glow: "rgba(255, 153, 45, 0.35)",
        glowSoft: "rgba(255, 153, 45, 0.12)"
      }
    },
    violet: {
      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
      baseFontSize: "16px",
      radius: "10px",
      colors: {
        bg: "#0d0a17",
        bg2: "#161026",
        bgGlow: "rgba(183, 45, 255, .11)",
        panel: "#1e1730",
        panel2: "#271d3c",
        card: "#1a1429",
        card2: "#221936",
        header: "rgba(13, 10, 23, 0.95)",
        sidebar: "rgba(13, 10, 23, 0.96)",
        sidebar2: "rgba(17, 12, 29, 0.96)",
        input: "#1b142a",
        playerOverlay: "rgba(16, 4, 24, 0.24)",
        line: "rgba(220, 190, 255, 0.15)",
        text: "#f7f0ff",
        heading: "#ffffff",
        muted: "#bba8d7",
        accent: "#b72dff",
        accent2: "#dd72ff",
        accentText: "#17051f",
        glow: "rgba(183, 45, 255, 0.35)",
        glowSoft: "rgba(183, 45, 255, 0.12)"
      }
    },
    mono: {
      fontFamily: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
      baseFontSize: "16px",
      radius: "8px",
      colors: {
        bg: "#090b0f",
        bg2: "#11151c",
        bgGlow: "rgba(160, 174, 192, .08)",
        panel: "#171c24",
        panel2: "#202733",
        card: "#141922",
        card2: "#1b2230",
        header: "rgba(9, 11, 15, 0.95)",
        sidebar: "rgba(9, 11, 15, 0.96)",
        sidebar2: "rgba(12, 15, 21, 0.96)",
        input: "#131922",
        playerOverlay: "rgba(15, 23, 42, 0.20)",
        line: "rgba(226, 232, 240, 0.13)",
        text: "#f1f5f9",
        heading: "#ffffff",
        muted: "#a8b3c2",
        accent: "#e2e8f0",
        accent2: "#94a3b8",
        accentText: "#0f172a",
        glow: "rgba(226, 232, 240, 0.24)",
        glowSoft: "rgba(226, 232, 240, 0.09)"
      }
    },
    white: {
      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
      baseFontSize: "16px",
      radius: "10px",
      colors: {
        bg: "#f4f7fb",
        bg2: "#ffffff",
        bgGlow: "rgba(37, 99, 235, .08)",
        panel: "#ffffff",
        panel2: "#eef4fb",
        card: "#ffffff",
        card2: "#f3f7fc",
        header: "rgba(255, 255, 255, 0.94)",
        sidebar: "rgba(255, 255, 255, 0.96)",
        sidebar2: "rgba(238, 244, 251, 0.96)",
        input: "#eef4fb",
        playerOverlay: "rgba(15, 23, 42, 0.12)",
        line: "rgba(30, 41, 59, 0.14)",
        text: "#142033",
        heading: "#07111f",
        muted: "#5f6f86",
        accent: "#2563eb",
        accent2: "#06b6d4",
        accentText: "#ffffff",
        glow: "rgba(37, 99, 235, 0.28)",
        glowSoft: "rgba(37, 99, 235, 0.10)"
      }
    },
    almond: {
      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
      baseFontSize: "16px",
      radius: "10px",
      colors: {
        bg: "#f3eadc",
        bg2: "#fffaf2",
        bgGlow: "rgba(166, 104, 36, .10)",
        panel: "#fff7ea",
        panel2: "#f0dfc7",
        card: "#fffaf2",
        card2: "#f5e8d4",
        header: "rgba(255, 250, 242, 0.95)",
        sidebar: "rgba(255, 250, 242, 0.96)",
        sidebar2: "rgba(243, 234, 220, 0.96)",
        input: "#f5e8d4",
        playerOverlay: "rgba(88, 62, 34, 0.12)",
        line: "rgba(88, 62, 34, 0.18)",
        text: "#2a2016",
        heading: "#18120c",
        muted: "#755f49",
        accent: "#b45309",
        accent2: "#d97706",
        accentText: "#fffaf2",
        glow: "rgba(180, 83, 9, 0.30)",
        glowSoft: "rgba(180, 83, 9, 0.11)"
      }
    }
  },
  // 2. KONTEN HOMEPAGE (Teks SEO & FAQ)
  homepage: {
    // Judul yang muncul di Tab Browser dan Google (Gunakan {brand} & {games} sebagai variasi)
    seoTitle: "UNBLOCKED GAMES G+ | {brand} FOR SCHOOL: PLAY {games} UNBLOCKED",
    // Deskripsi singkat yang muncul di hasil pencarian Google
    seoDescription: "Play the best unblocked games for school on {brand}. Access 1000+ free games like Drift Boss & Cookie Clicker. No download, safe for Chromebook, and 100% unblocked!",

    // Bagian Artikel SEO di bawah Homepage
    article: {
      headline: "Unblocked Games G+ at {brand}",
      // Paragraf pembuka (gunakan {brand} untuk memanggil nama domain)
      paragraphs: [
        "Unblocked Games G+ are free browser games made for quick access on school laptops, Chromebooks, tablets, phones, and desktop browsers. At {brand}, every game is built around instant play: open the page, choose a title, and start without downloads, plugins, accounts, or sign-up forms.",
        "{brand} focuses on lightweight online games that load fast and fit short breaks. Whether you want an arcade challenge, a puzzle game, a sports match, a racing run, or a multiplayer battle, the homepage keeps popular game picks easy to find and ready to play."
      ],
      // Seksi-seksi tambahan dengan judul
      sections: [
        {
          title: "What Are Unblocked Games G+?",
          content: "Unblocked Games G+ describes online games that run directly inside a web browser. Most titles use HTML5 and JavaScript, so players do not need Flash, separate apps, or installer files. This makes the games easier to open on managed devices and modern browsers.\n\nThe main idea is simple: pick a game, wait for the player to load, and enjoy a click-and-play session. Because the games are lightweight, they work well for quick sessions on Chromebooks, school computers, mobile phones, tablets, and regular desktops."
        },
        {
          title: "Why Players Search for Unblocked Games G+",
          list: [ // Daftar poin-poin
            "Easy access from a browser without extra software.",
            "No downloads, no plugins, and no account registration.",
            "Free entertainment for short breaks and casual sessions.",
            "A wide mix of arcade, puzzle, action, racing, sports, and multiplayer games.",
            "Fast loading pages designed for lightweight devices such as Chromebooks."
          ]
        },
        {
          title: "Popular Game Types to Try",
          content: "The best Unblocked Games G+ libraries include many different play styles. Runner games test timing and reflexes, slope and tunnel games focus on fast reactions, basketball and soccer games bring quick competition, while puzzle and strategy games reward planning.\n\nPlayers often look for familiar titles such as Drift Boss, Cookie Clicker, Run 3, Slope, Moto X3M, Basketball Stars, Paper.io 2, Tunnel Rush, Shell Shockers, and 1v1.LOL. Availability can change over time, but the goal stays the same: fast browser gameplay with simple access."
        },
        {
          title: "Anytime Browser Gaming",
          content: "Because the games run in the browser, {brand} is designed to be flexible across screen sizes. You can browse from a desktop monitor, open a quick game on a Chromebook, or use a phone or tablet when touch controls are supported.\n\nThere are no app stores, downloads, or complicated setup steps. Just search for a game, open its page, and play online from the device you already have."
        },
        {
          title: "Safe and Responsible Play",
          content: "{brand} keeps the experience simple by avoiding account requirements and download prompts. Browser-based games are convenient, but players should still use trusted pages, avoid suspicious pop-ups, and follow the rules of their school, workplace, or network.\n\nFor the best experience, play during free time, keep personal information private, and use a modern browser with a stable internet connection. Gaming should stay fun, quick, and responsible."
        },
        {
          title: "Learning and Skill Benefits",
          content: "Unblocked games are not only about passing time. Puzzle games build logic, racing games sharpen reaction speed, sports games train timing, and strategy games encourage decision-making. Some educational games also include math, typing, memory, or coding-style challenges.\n\nThe best part is that these skills develop through play. A short session can still practice focus, pattern recognition, hand-eye coordination, and problem solving."
        }
      ]
    },
    // Daftar Pertanyaan & Jawaban (FAQ) untuk Homepage
    faqs: [
      { q: "Are Unblocked Games G+ free?", a: "Yes. Games on {brand} are made for free browser play with no subscription or sign-up required." },
      { q: "Can I play on a phone, tablet, or Chromebook?", a: "Yes. Most games run in modern browsers across desktop, Chromebook, tablet, and mobile devices. Some titles work best with keyboard controls." },
      { q: "Do I need to download anything?", a: "No. The games are designed for browser play, so you do not need installer files, plugins, or extra apps." },
      { q: "Are these games lightweight?", a: "Most titles are built for quick loading and short sessions, which makes them suitable for lower-end laptops and school Chromebooks." },
      { q: "Is it safe to play at school?", a: "The games run in the browser and do not require personal information. Always follow your school or workplace policy before playing on a managed network." }
    ]
  },

};

// FUNGSI PEMBANTU (HELPERS)
// Jangan ubah logika di bawah ini kecuali Anda mengerti JavaScript.

/** Mengambil kode iklan lebih awal tanpa memblokir render utama. */
export function getAdHtml(adCode, delay = 1200) {
  if (!adCode) return "";
  const id = "ad-" + Math.random().toString(36).slice(2, 11);
  const b64 = Buffer.from(adCode).toString("base64");
  const width = Number((String(adCode).match(/'width'\s*:\s*(\d+)/) || [])[1] || 728);
  const height = Number((String(adCode).match(/'height'\s*:\s*(\d+)/) || [])[1] || 90);
  return `
<div id="${id}" class="ad-slot" style="min-height:${height}px; max-width:100%; width:min(100%, ${width}px); margin-inline:auto; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.03); border-radius:8px; overflow:hidden"></div>
<script>
  (function() {
    let loaded = false;
    const loadAd = () => {
      if (loaded) return;
      loaded = true;
      try {
        const container = document.getElementById("${id}");
        if (!container) return;
        const html = atob("${b64}");
        const frame = document.createElement("iframe");
        frame.title = "Advertisement";
        frame.width = "${width}";
        frame.height = "${height}";
        frame.loading = "eager";
        frame.referrerPolicy = "no-referrer-when-downgrade";
        frame.setAttribute("scrolling", "no");
        frame.setAttribute("frameborder", "0");
        frame.style.cssText = "display:block;width:100%;max-width:${width}px;height:${height}px;border:0;margin:0 auto;overflow:hidden;background:transparent;";
        frame.srcdoc = '<!doctype html><html><head><base target="_blank"><style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:transparent;}body{display:flex;align-items:center;justify-content:center;}</style></head><body>' + html + '</body></html>';
        container.replaceChildren(frame);
      } catch (e) { console.error("Ad load error", e); }
    };
    const schedule = () => {
      const timer = setTimeout(loadAd, ${delay});
      const slot = document.getElementById("${id}");
      if ("IntersectionObserver" in window && slot) {
        const observer = new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            clearTimeout(timer);
            observer.disconnect();
            loadAd();
          }
        }, { rootMargin: "900px 0px" });
        observer.observe(slot);
      }
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", schedule, { once: true });
    } else {
      schedule();
    }
  })();
</script>
`;
}

/** Script Histats (Lazy Load agar web tetap kencang) */
export function getHistatsHtml(id) {
  const ids = (Array.isArray(id) ? id : [id])
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const uniqueIds = [...new Set(ids)];
  if (!uniqueIds.length) return "";
  const pushes = uniqueIds.map((histatsId) => `  _Hasync.push(['Histats.start', '1,${histatsId},4,0,0,0,00010000']);
  _Hasync.push(['Histats.fasi', '1']);
  _Hasync.push(['Histats.track_hits', '']);`).join("\n");
  const noscript = uniqueIds.map((histatsId) => `<noscript><a href="/" target="_blank"><img src="//sstatic1.histats.com/0.gif?${histatsId}&101" alt="hit tracker" border="0"></a></noscript>`).join("\n");
  return `
<!-- Histats.com  START  (aync)-->
<script type="text/javascript">
  var _Hasync = _Hasync || [];
${pushes}
  (function() {
    const hsLoad = () => {
      var hs = document.createElement('script'); hs.type = 'text/javascript'; hs.async = true;
      hs.src = ('//s10.histats.com/js15_as.js');
      (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(hs);
    };
    if (window.requestIdleCallback) {
      setTimeout(() => requestIdleCallback(hsLoad), 7000);
    } else {
      setTimeout(hsLoad, 10000);
    }
  })();
</script>
${noscript}
<!-- Histats.com  END  -->
`;
}

/** Script Google Analytics (Lazy Load) */
export function getGoogleAnalyticsHtml(id) {
  if (!id) return "";
  return `
<script>
  (function() {
    const gaLoad = () => {
      var s = document.createElement('script');
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=${id}";
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${id}', { 'page_path': location.pathname, 'send_page_view': true });
    };
    if (window.requestIdleCallback) {
      setTimeout(() => requestIdleCallback(gaLoad), 5000);
    } else {
      setTimeout(gaLoad, 8000);
    }
  })();
</script>
`;
}

export function getAdSenseHtml(id, enabled = false) {
  if (!id || !enabled) return "";
  return `
<script>
  (function() {
    const loadAdSense = () => {
      var s = document.createElement('script');
      s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${id}";
      s.async = true;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    setTimeout(loadAdSense, 3500);
  })();
</script>
`;
}
