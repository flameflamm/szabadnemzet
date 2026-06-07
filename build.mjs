// build.mjs — Szabad Nemzet static build step
// ─────────────────────────────────────────────────────────────────────────────
// Run from the project root:   node build.mjs
// (the GitHub Action runs this automatically on every push — see
//  .github/workflows/deploy.yml — so you normally never run it by hand.)
//
// What it does, by scanning articles/*.md:
//   1. Rebuilds  articles/index.json  (the manifest the site loads) — so you
//      NEVER hand-edit the manifest; just add/remove .md files.
//   2. Regenerates  cikk/<id>.html  — the per-article pages that carry the
//      Facebook/Twitter preview tags, then forward readers into the app.
//
// To publish an article: drop a new  articles/<id>.md  with front-matter, push.
// Editorial bits that aren't per-article (most-read list, news ticker) live in
//   articles/_meta.json  — edit that by hand when you want to change them.
// ─────────────────────────────────────────────────────────────────────────────

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const SITE_BASE = "https://mor-lang.dev/FakeSite/"; // ← if you move the site, change here AND in content.jsx (keep trailing slash)
const SITE_NAME = "Szabad Nemzet";

// ── helpers ──────────────────────────────────────────────────────────────────
const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const isImg = (s) => typeof s === "string" && /\.(jpe?g|png|webp|gif|avif)$/i.test(s.trim());
const abs = (p) => SITE_BASE + String(p).replace(/^\/+/, "");

function coerce(v) {
  const s = v.trim();
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^\[.*\]$/.test(s)) return s.slice(1, -1).split(",").map((x) => x.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  return s.replace(/^["']|["']$/g, "");
}
// Parse YAML-ish front-matter (scalars, inline arrays, block lists).
function parseFrontMatter(text) {
  const t = text.replace(/^\uFEFF/, "");
  const m = t.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!m) return {};
  const meta = {};
  let listKey = null;
  for (const raw of m[1].split("\n")) {
    if (!raw.trim()) continue;
    const li = raw.match(/^\s*-\s+(.*)$/);
    if (li && listKey) { meta[listKey].push(coerce(li[1])); continue; }
    const kv = raw.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    if (kv[2].trim() === "") { meta[kv[1]] = []; listKey = kv[1]; }
    else { meta[kv[1]] = coerce(kv[2]); listKey = null; }
  }
  return meta;
}

// ── 1. scan articles ──────────────────────────────────────────────────────────
const dir = "articles";
const files = (await readdir(dir)).filter((f) => f.endsWith(".md") && !f.startsWith("_"));

const articles = [];
for (const f of files) {
  const id = path.basename(f, ".md");
  const meta = parseFrontMatter(await readFile(path.join(dir, f), "utf8"));
  if (!meta.title) { console.warn("⚠ skipping " + f + " (no title in front-matter)"); continue; }
  const rec = { id, cat: meta.cat, kicker: meta.kicker, title: meta.title, dek: meta.dek,
    author: meta.author, role: meta.role, date: meta.date, read: meta.read, img: meta.img };
  if (meta.feature) rec.feature = true;
  if (meta.opinion) rec.opinion = true;
  if (Array.isArray(meta.related) && meta.related.length) rec.related = meta.related;
  articles.push(rec);
}
// newest first
articles.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

// ── 2. write manifest (merge in hand-curated meta) ──────────────────────────────
let editorial = { mostRead: [], ticker: [] };
try { editorial = JSON.parse(await readFile(path.join(dir, "_meta.json"), "utf8")); }
catch { console.warn("⚠ articles/_meta.json not found — manifest will have empty meta"); }

await writeFile(path.join(dir, "index.json"),
  JSON.stringify({ meta: editorial, articles }, null, 2) + "\n", "utf8");
console.log("✓ articles/index.json — " + articles.length + " articles");

// ── 3. write Open Graph preview pages ───────────────────────────────────────────
await mkdir("cikk", { recursive: true });
for (const a of articles) {
  const url = SITE_BASE + "cikk/" + a.id + ".html";
  const img = abs(isImg(a.img) ? a.img : "images/logo.svg");
  const enc = encodeURIComponent(a.id);
  const html = `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(a.title + " — " + SITE_NAME)}</title>
<meta name="description" content="${esc(a.dek)}" />

<!-- Open Graph (Facebook) -->
<meta property="og:type" content="article" />
<meta property="og:site_name" content="${esc(SITE_NAME)}" />
<meta property="og:title" content="${esc(a.title)}" />
<meta property="og:description" content="${esc(a.dek)}" />
<meta property="og:image" content="${esc(img)}" />
<meta property="og:url" content="${esc(url)}" />

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(a.title)}" />
<meta name="twitter:description" content="${esc(a.dek)}" />
<meta name="twitter:image" content="${esc(img)}" />

<link rel="canonical" href="${esc(url)}" />
<meta http-equiv="refresh" content="0; url=../index.html?cikk=${enc}" />
<script>location.replace("../index.html?cikk=${enc}");</script>
</head>
<body style="font-family:Georgia,serif;background:#f7f6f4;color:#24211a;margin:0;display:flex;align-items:center;justify-content:center;height:100vh">
<p>Átirányítás a cikkhez… <a href="../index.html?cikk=${enc}">${esc(a.title)}</a></p>
</body>
</html>
`;
  await writeFile("cikk/" + a.id + ".html", html, "utf8");
}
console.log("✓ cikk/ — " + articles.length + " Open Graph pages");
console.log("Done.");
