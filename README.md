# Rebuild Ozo-Lite (Isolated)

Build ulang model portal cepat (SSR ringan) tanpa menyentuh skrip utama.

## Fitur
- SSR HTML langsung (tanpa framework frontend berat)
- Data game dari `../data/games.json`
- Data konten game dari `../content/game`
- Halaman artikel dinamis dari `../keyw` + `../apalah`
- Sitemap, robots, RSS
- Cache header dasar untuk performa

## Route
- `/`
- `/games`
- `/categories`
- `/category/:slug`
- `/play/:slug`
- `/search?q=...`
- `/articles`
- `/articles/:f1`
- `/articles/:f1/:f2`
- `/<dynamic>/<f1>/<f2>/<action+code+slug>` (article dynamic path, auto-match)
- `/api/games.json`
- `/robots.txt`
- `/sitemap.xml`
- `/rss.xml`

## Jalankan
```bash
cd rebuild-ozo-lite
npm run dev
```

Default: `http://localhost:4100`

## Catatan
- Folder ini terisolasi, tidak merusak app utama.
- Cocok untuk eksperimen high-performance SSR.
