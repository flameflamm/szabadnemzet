// content.jsx — Szabad Nemzet content layer
// ───────────────────────────────────────────────────────────────────────────
// Articles live as Markdown files with YAML front-matter in /articles/*.md
// A generated /articles/index.json manifest lists every article's metadata
// (everything EXCEPT the body) so the homepage can sort/filter without
// downloading every article. Bodies are fetched on demand when an article
// is opened. This is a static, deployable model: publishing = committing a
// new .md file + adding its entry to index.json.
// ───────────────────────────────────────────────────────────────────────────

// ── Static site config (not content) ─────────────────────────────────────────
// Deployed base URL — REQUIRED for share links + Open Graph previews to work.
// Must end with a trailing slash.
const SITE_BASE = "https://mor-lang.dev/FakeSite/";
const SITE_NAME = "Szabad Nemzet";

const SECTIONS = [
  { id: "cimlap",     label: "Címlap" },
  { id: "belfold",    label: "Belföld" },
  { id: "velemeny",   label: "Vélemény" },
  { id: "kultura",    label: "Kultúra" },
  { id: "tortenelem", label: "Történelem" },
];
const NAV_EXTRA = ["Világ", "Gazdaság", "Sport"];
const SECTION_LABEL = {
  belfold: "Belföld", velemeny: "Vélemény", kultura: "Kultúra",
  tortenelem: "Történelem", gazdasag: "Gazdaság", vilag: "Világ",
};

// ── Front-matter parser ───────────────────────────────────────────────────────
// Splits a raw .md file into { meta, body }. Supports scalars (string / number /
// boolean), inline arrays `key: [a, b]`, and YAML block lists:
//   related:
//     - forint
//     - videk
function coerce(v) {
  const s = v.trim();
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^\[.*\]$/.test(s)) {
    // inline array — tolerant of quotes / bare words
    return s.slice(1, -1).split(",").map((x) => x.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  }
  return s.replace(/^["']|["']$/g, "");
}

function parseFrontMatter(text) {
  const t = text.replace(/^\uFEFF/, "");           // strip BOM
  const m = t.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!m) return { meta: {}, body: t.trim() };

  const meta = {};
  const lines = m[1].split("\n");
  let listKey = null;
  for (const raw of lines) {
    if (!raw.trim()) continue;
    const li = raw.match(/^\s*-\s+(.*)$/);          // "  - item"
    if (li && listKey) { meta[listKey].push(coerce(li[1])); continue; }
    const kv = raw.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1], val = kv[2];
    if (val.trim() === "") { meta[key] = []; listKey = key; }   // start of block list
    else { meta[key] = coerce(val); listKey = null; }
  }
  const body = t.slice(m[0].length).trim();
  return { meta, body };
}

// ── Markdown → HTML ───────────────────────────────────────────────────────────
// Uses `marked` (loaded in index.html). Falls back to a minimal paragraph
// renderer if the library is unavailable for any reason.
function mdToHtml(md) {
  if (!md) return "";
  if (window.marked && typeof window.marked.parse === "function") {
    return window.marked.parse(md, { mangle: false, headerIds: false });
  }
  return md.split(/\n{2,}/).map((b) => {
    const s = b.trim();
    if (s.startsWith("> ")) return "<blockquote>" + s.slice(2) + "</blockquote>";
    return "<p>" + s + "</p>";
  }).join("\n");
}

// ── Date helpers ────────────────────────────────────────────────────────────
const HU_MONTHS = ["január", "február", "március", "április", "május", "június",
  "július", "augusztus", "szeptember", "október", "november", "december"];
const HU_DAYS = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];
const _pad2 = (n) => (n < 10 ? "0" + n : "" + n);
function formatHuDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return iso || "";
  return `${m[1]}. ${HU_MONTHS[parseInt(m[2], 10) - 1]} ${parseInt(m[3], 10)}.`;
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}. ${HU_MONTHS[d.getMonth()]} ${d.getDate()}.`;
}
// Long form with weekday, e.g. "2026. június 7., vasárnap"
function huDateLong(d) {
  d = d || new Date();
  return `${d.getFullYear()}. ${HU_MONTHS[d.getMonth()]} ${d.getDate()}., ${HU_DAYS[d.getDay()]}`;
}
// Hungarian name-day(s) for a date (defaults to today)
function nameDayFor(d) {
  d = d || new Date();
  const key = _pad2(d.getMonth() + 1) + "-" + _pad2(d.getDate());
  return (window.NAMEDAYS && window.NAMEDAYS[key]) || "";
}
function estimateRead(text) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}
// True when an `img` value is a real file path rather than placeholder caption text.
function isImagePath(s) {
  return typeof s === "string" && /\.(jpe?g|png|webp|gif|avif)$/i.test(s.trim());
}

// ── In-memory store (populated after the manifest loads) ──────────────────────
let _articles = [];          // listing records from index.json (newest first)
let _meta = { mostRead: [], ticker: [] };
const _bodyCache = {};        // id → { html, read }  (filled lazily on open)

function setManifest(manifest) {
  _meta = manifest.meta || { mostRead: [], ticker: [] };
  _articles = (manifest.articles || []).map((a) => ({
    ...a,
    date: formatHuDate(a.date),   // keep human display; sort already done server-side
    _iso: a.date,
  }));
}
function getArticles() { return _articles.slice(); }
function getMeta() { return _meta; }
const byId  = (id)  => _articles.find((a) => a.id === id);
const byCat = (cat) => _articles.filter((a) => a.cat === cat);

// ── Async loaders ─────────────────────────────────────────────────────────────
async function loadManifest() {
  const res = await fetch("articles/index.json", { cache: "no-cache" });
  if (!res.ok) throw new Error("index.json " + res.status);
  const data = await res.json();
  setManifest(data);
  return data;
}

// Fetch + parse a single article body. Returns { html, read }. Cached.
async function loadArticleBody(id) {
  if (_bodyCache[id]) return _bodyCache[id];
  const res = await fetch("articles/" + id + ".md", { cache: "no-cache" });
  if (!res.ok) throw new Error(id + ".md " + res.status);
  const { meta, body } = parseFrontMatter(await res.text());
  const out = { html: mdToHtml(body), read: meta.read || estimateRead(body), meta };
  _bodyCache[id] = out;
  return out;
}

// ── Authoring helper: build a publish-ready .md file from a form object ───────
// (Used by a future composer screen — produces the exact on-disk format so the
//  output can be committed straight into /articles/.)
function slugify(s) {
  return (s || "cikk").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "cikk";
}
function buildMarkdownFile(d) {
  const L = ["---"];
  const push = (k, v) => { if (v !== undefined && v !== "" && v !== false) L.push(k + ": " + v); };
  push("title", d.title); push("dek", d.dek); push("cat", d.cat);
  push("kicker", d.kicker); push("author", d.author); push("role", d.role);
  push("date", d.date); push("read", d.read);
  if (d.feature) L.push("feature: true");
  if (d.opinion) L.push("opinion: true");
  push("img", d.img);
  if (d.related && d.related.length) { L.push("related:"); d.related.forEach((r) => L.push("  - " + r)); }
  L.push("---", "");
  return L.join("\n") + "\n" + (d.body || "").trim() + "\n";
}

// ── Sharing ───────────────────────────────────────────────────────────────────
// Public URL for an article. Points at a tiny per-article page under /cikk/
// that carries Open Graph tags (so Facebook shows a real preview) and then
// forwards the reader into the SPA.
function shareUrl(id) {
  return SITE_BASE + "cikk/" + id + ".html";
}
// Absolute preview image for an article: the real cover if it has one,
// otherwise the site logo as a graceful fallback.
function shareImage(article) {
  const img = article && article.img;
  const path = isImagePath(img) ? img : "images/logo.svg";
  return SITE_BASE + path.replace(/^\/+/, "");
}
function facebookShareUrl(id) {
  return "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(shareUrl(id));
}
function twitterShareUrl(id, title) {
  return "https://twitter.com/intent/tweet?url=" + encodeURIComponent(shareUrl(id)) +
    "&text=" + encodeURIComponent(title || "");
}

Object.assign(window, {
  SITE_BASE, SITE_NAME, SECTIONS, NAV_EXTRA, SECTION_LABEL,
  parseFrontMatter, mdToHtml, formatHuDate, todayStr, huDateLong, nameDayFor, estimateRead, isImagePath, slugify,
  setManifest, getArticles, getMeta, byId, byCat,
  loadManifest, loadArticleBody, buildMarkdownFile,
  shareUrl, shareImage, facebookShareUrl, twitterShareUrl,
});
