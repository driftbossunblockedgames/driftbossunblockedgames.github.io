export function esc(v = "") {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function slugify(s = "") {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function catSlug(name = "") {
  return slugify(name);
}

export function stripTags(html = "") {
  return String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerpt(text = "", n = 160) {
  const t = stripTags(text);
  return t.length > n ? `${t.slice(0, n).trim()}...` : t;
}

export function hashNum(s = "") {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pickRandom(list = []) {
  return list[Math.floor(Math.random() * list.length)] || "";
}

export function shuffle(arr = []) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function partialShuffle(arr, n) {
  const len = arr.length;
  if (n >= len) return shuffle(arr);
  const result = new Array(n);
  const taken = new Set();
  let count = 0;
  while (count < n) {
    const idx = Math.floor(Math.random() * len);
    if (!taken.has(idx)) {
      result[count] = arr[idx];
      taken.add(idx);
      count++;
    }
  }
  return result;
}
export function pick(arr = [], n = 8) {
  return arr.slice(0, Math.max(0, n));
}

export function articleSlug(title = "") {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .join("-");
}

export function rfSlug(str = "") {
  // Decode URL (like urldecode)
  let clean = decodeURIComponent(String(str || ""));

  // Translasi karakter khusus (Basic ASCII Translit)
  clean = clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Hapus karakter selain huruf, angka, dan spasi
  clean = clean.replace(/[^a-zA-Z0-9 ]/g, "");

  // Pisahkan jadi array kata
  const words = clean.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";

  // Tentukan: pakai delimiter atau tidak (50/50)
  const useDelimiter = Math.random() < 0.5;

  if (!useDelimiter) {
    // Jika tanpa delimiter -> CamelCase
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
  } else {
    // Jika dengan delimiter -> semua huruf kecil
    const lowerWords = words.map(w => w.toLowerCase());
    let slug = lowerWords[0];
    const delimiters = ["-", "_", "__"];
    for (let i = 1; i < lowerWords.length; i++) {
      const sep = delimiters[Math.floor(Math.random() * delimiters.length)];
      slug += sep + lowerWords[i];
    }
    return slug;
  }
}

export function articleSlugMixed(title = "") {
  return rfSlug(title);
}

export function normalizeTag(v = "") {
  return String(v || "").replace(/"/g, "").replace(/\s+/g, " ").trim();
}

export function cleanSearchTitle(v = "") {
  return String(v || "").replace(/\s*\([A-Za-z0-9]+\/[A-Za-z0-9]+\)\s*$/g, "").trim();
}

export function relatedGames(g, games = [], n = 12) {
  const cats = new Set(Array.isArray(g.cat) ? g.cat : []);
  return games
    .filter((x) => x.slug !== g.slug)
    .map((x) => ({ x, overlap: (x.cat || []).filter((c) => cats.has(c)).length }))
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, n)
    .map((v) => v.x);
}

export function clampHtmlPayload(input = "", maxChars = 120000) {
  const text = String(input || "");
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n<p><em>Content truncated for performance.</em></p>`;
}

export function titleCase(str = "") {
  return String(str || "")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}


