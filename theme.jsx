// theme.jsx — design tokens + theme computation for Szabad Nemzet

// ── Headline font options (Google Fonts loaded in index.html) ────────────────
const FONTS = {
  newsreader: { label: "Newsreader", head: "'Newsreader', Georgia, 'Times New Roman', serif", serifHead: true },
  caslon:     { label: "Caslon",     head: "'Libre Caslon Display', Georgia, serif", serifHead: true },
  franklin:   { label: "Franklin",   head: "'Libre Franklin', system-ui, sans-serif", serifHead: false },
  oswald:     { label: "Oswald",     head: "'Oswald', 'Arial Narrow', system-ui, sans-serif", serifHead: false, condensed: true },
  archivo:    { label: "Archivo",    head: "'Archivo', system-ui, sans-serif", serifHead: false },
};
const FONT_OPTIONS = Object.keys(FONTS).map((k) => ({ value: k, label: FONTS[k].label }));

const BODY_SERIF = "'Source Serif 4', Georgia, serif";
const BODY_SANS  = "'Libre Franklin', system-ui, sans-serif";

// ── Color palettes (light). Each defines the paper/ink/line mood + national green.
const PALETTES = {
  zaszlo: {
    label: "Zászló",
    paper: "#f7f3ea", surface: "#fffdf8", ink: "#1c1a15", inkSoft: "#5d574a",
    line: "#e2dac8", green: "#3f6b4a",
    dark: { paper: "#24211a", surface: "#2c2820", ink: "#f3eee2", inkSoft: "#b3aa95", line: "#3d382c", green: "#7cb98b" },
  },
  semleges: {
    label: "Semleges",
    paper: "#f7f6f4", surface: "#ffffff", ink: "#16150f", inkSoft: "#56544c",
    line: "#e6e4df", green: "#4a6052",
    dark: { paper: "#211f1d", surface: "#2a2825", ink: "#f1f0ec", inkSoft: "#a8a59d", line: "#39362f", green: "#82a698" },
  },
  orokseg: {
    label: "Örökség",
    paper: "#f3ece0", surface: "#fbf6ec", ink: "#211c14", inkSoft: "#5f5645",
    line: "#ddd2bd", green: "#33503c",
    dark: { paper: "#262017", surface: "#2f281c", ink: "#efe7d6", inkSoft: "#b6aa90", line: "#413829", green: "#79ad84" },
  },
  ujsagpapir: {
    label: "Újságpapír",
    paper: "#ece4d6", surface: "#f4eee1", ink: "#211c14", inkSoft: "#5c5444",
    line: "#d6cab2", green: "#54684a",
    dark: { paper: "#252013", surface: "#2e2818", ink: "#ece3cf", inkSoft: "#b3a781", line: "#423a26", green: "#8ba36c" },
  },
};
const PALETTE_OPTIONS = Object.keys(PALETTES).map((k) => ({ value: k, label: PALETTES[k].label }));

// ── Accent (primary) colors ──────────────────────────────────────────────────
const ACCENTS = ["#ce2939", "#9c1d2b", "#3f6b4a", "#1f4e79"]; // flag red, deep red, green, navy

// ── Density ───────────────────────────────────────────────────────────────────
const DENSITY = {
  compact:  { scale: 0.92, gap: 18, pad: 14, lead: 1.45 },
  regular:  { scale: 1.0,  gap: 26, pad: 20, lead: 1.6 },
  comfy:    { scale: 1.08, gap: 36, pad: 28, lead: 1.72 },
};

// ── Direction presets (applied as a bundle when chosen) ────────────────────────
const DIRECTIONS = {
  nemzet: { label: "Nemzet", bundle: { headlineFont: "newsreader", density: "regular",  palette: "zaszlo",     accent: "#ce2939" } },
  modern: { label: "Modern", bundle: { headlineFont: "franklin",   density: "comfy",    palette: "semleges",   accent: "#3f6b4a" } },
  eros:   { label: "Erős",   bundle: { headlineFont: "oswald",     density: "compact",  palette: "ujsagpapir", accent: "#9c1d2b" } },
};

// Readable text color on a given accent background
function inkOn(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1a1813" : "#ffffff";
}

// Build the CSS custom-property object from current tweak values
function buildTheme(t) {
  const pal = PALETTES[t.palette] || PALETTES.zaszlo;
  const c = t.dark ? pal.dark : pal;
  const font = FONTS[t.headlineFont] || FONTS.newsreader;
  const den = DENSITY[t.density] || DENSITY.regular;
  const accent = t.accent || "#ce2939";
  const bodyFont = font.serifHead ? BODY_SERIF : BODY_SANS;

  return {
    vars: {
      "--paper": c.paper,
      "--surface": c.surface,
      "--ink": c.ink,
      "--ink-soft": c.inkSoft,
      "--line": c.line,
      "--green": c.green,
      "--accent": accent,
      "--accent-ink": inkOn(accent),
      "--font-head": font.head,
      "--font-body": bodyFont,
      "--gap": den.gap + "px",
      "--pad": den.pad + "px",
      "--lead": den.lead,
      "--scale": den.scale,
      "--head-spacing": font.condensed ? "-0.01em" : (font.serifHead ? "-0.011em" : "-0.018em"),
    },
    flags: {
      uppercaseHeads: t.direction === "eros",
      condensed: !!font.condensed,
      serifHead: font.serifHead,
      dark: !!t.dark,
    },
  };
}

Object.assign(window, {
  FONTS, FONT_OPTIONS, BODY_SERIF, BODY_SANS, PALETTES, PALETTE_OPTIONS,
  ACCENTS, DENSITY, DIRECTIONS, inkOn, buildTheme,
});
