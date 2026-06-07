// app.jsx — Szabad Nemzet pages + app shell

const { useState, useEffect, useRef } = React;

// ── Sidebar widgets ───────────────────────────────────────────
function MostRead({ onOpen }) {
  const items = (getMeta().mostRead || []).map(byId).filter(Boolean);
  return (
    <div className="panel">
      <h4 className="panel-title">Legolvasottabb</h4>
      <div className="mostread">
        {items.map((a, i) => (
          <div className="row" key={a.id} onClick={() => onOpen(a.id)}>
            <span className="num">{i + 1}</span>
            <h5 className="title">{a.title}</h5>
          </div>
        ))}
      </div>
    </div>
  );
}

function OpinionCard({ a, onOpen }) {
  const initials = a.author.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <article className="card" onClick={() => onOpen(a.id)}>
      <span className="ava">{initials}</span>
      <div>
        <span className="kicker">{a.kicker}</span>
        <h3 className="title">{a.title}</h3>
        <p className="who"><b>{a.author}</b> · {a.role}</p>
      </div>
    </article>
  );
}

function HistoryFeature({ a, onOpen }) {
  return (
    <article className="feat" onClick={() => onOpen(a.id)}>
      <Ph label={a.img} kind="" alt={a.title} />
      <div className="body">
        <span className="kicker">{a.kicker}</span>
        <h3 className="title">{a.title}</h3>
        <p className="dek">{a.dek}</p>
        <div className="meta" style={{ marginTop: 16 }}>
          <span className="by">{a.author}</span><span className="sep">·</span><span>{a.read} perc olvasás</span>
        </div>
      </div>
    </article>
  );
}

// ── Hero ──────────────────────────────────────────────────────
function Hero({ lead, side, onOpen }) {
  if (!lead) return null;
  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-grid">
          <div className="hero-lead card" onClick={() => onOpen(lead.id)}>
            <Ph label={lead.img} kind="lead" alt={lead.title} />
            <span className="kicker">{lead.kicker}</span>
            <h2 className="hero-title">{lead.title}</h2>
            <p className="hero-dek">{lead.dek}</p>
            <div style={{ marginTop: 14 }}><Meta a={lead} /></div>
          </div>
          <div className="hero-side">
            {side.map((a) => (
              <article className="card" key={a.id} onClick={() => onOpen(a.id)}>
                <span className="kicker">{a.kicker}</span>
                <h3 className="title">{a.title}</h3>
                <p className="dek">{a.dek}</p>
                <div style={{ marginTop: 10 }}><Meta a={a} /></div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SecHead({ title, more = "Összes hír" }) {
  return (
    <div className="sec-head">
      <h2 className="sec-title">{title}</h2>
      <a className="sec-more" href="#" onClick={(e) => e.preventDefault()}>{more} →</a>
    </div>
  );
}

// ── Home page ─────────────────────────────────────────────────
function HomePage({ onOpen }) {
  const all = getArticles();                              // newest first (manifest order)
  const features = all.filter((a) => a.feature);
  const lead = features[0] || all[0];
  const side = all.filter((a) => lead && a.id !== lead.id).slice(0, 2);

  const belfold = byCat("belfold").slice(0, 3);
  const velemeny = byCat("velemeny");
  const kultura = byCat("kultura").slice(0, 3);
  const tort = byCat("tortenelem");
  const tortFeat = tort.find((a) => a.feature) || tort[0];
  const tortRest = tort.filter((a) => !tortFeat || a.id !== tortFeat.id);

  return (
    <main>
      <Hero lead={lead} side={side} onOpen={onOpen} />

      <div className="wrap">
        <section id="belfold" className="sec">
          <SecHead title="Belföld" />
          <div className="layout">
            <div className="cols">
              {belfold.map((a) => <ColCard key={a.id} a={a} onOpen={onOpen} />)}
            </div>
            <aside className="rail">
              <MostRead onOpen={onOpen} />
            </aside>
          </div>
        </section>

        <section id="velemeny" className="sec">
          <SecHead title="Vélemény" more="Minden publicisztika" />
          <div className="opin">
            {velemeny.map((a) => <OpinionCard key={a.id} a={a} onOpen={onOpen} />)}
          </div>
        </section>

        <section id="kultura" className="sec">
          <SecHead title="Kultúra" />
          <div className="cols">
            {kultura.map((a) => <ColCard key={a.id} a={a} onOpen={onOpen} />)}
          </div>
        </section>

        <section id="tortenelem" className="sec">
          <SecHead title="Történelem" more="A rovat archívuma" />
          {tortFeat && <HistoryFeature a={tortFeat} onOpen={onOpen} />}
          <div className="cols" style={{ marginTop: "var(--gap)" }}>
            {tortRest.map((a) => <ColCard key={a.id} a={a} onOpen={onOpen} />)}
          </div>
        </section>
      </div>
    </main>
  );
}

// ── Article page ──────────────────────────────────────────────
function ArticlePage({ id, onOpen, onHome }) {
  const a = byId(id);
  const [content, setContent] = useState(null);   // { html, read } | null while loading
  const [err, setErr] = useState(false);

  useEffect(() => {
    let live = true;
    setContent(null); setErr(false);
    loadArticleBody(id)
      .then((r) => { if (live) setContent(r); })
      .catch(() => { if (live) setErr(true); });
    return () => { live = false; };
  }, [id]);

  if (!a) {
    return (
      <main className="art">
        <div className="wrap">
          <div className="crumb"><span className="back" onClick={onHome}>← Címlap</span></div>
          <p style={{ padding: "40px 0", color: "var(--ink-soft)" }}>A cikk nem található.</p>
        </div>
      </main>
    );
  }

  const initials = a.author.split(" ").map((w) => w[0]).slice(0, 2).join("");
  const related = (a.related || []).map(byId).filter(Boolean);
  const readMin = (content && content.read) || a.read;
  const cap = content && content.meta ? content.meta.caption : null;

  return (
    <main className="art">
      <div className="wrap">
        <div className="crumb">
          <span className="back" onClick={onHome}>← Címlap</span>
          <span className="sep">/</span>
          <a href="#" onClick={(e) => e.preventDefault()}>{SECTION_LABEL[a.cat] || a.kicker}</a>
        </div>

        <div className="art-head">
          <span className="kicker">{a.kicker}</span>
          <h1 className="art-title">{a.title}</h1>
          <p className="art-dek">{a.dek}</p>
          <div className="art-byline">
            <span className="ava">{initials}</span>
            <span><span className="by">{a.author}</span> <span className="muted">· {a.role}</span></span>
            <span className="muted">{a.date}</span>
            <span className="muted">· {readMin} perc</span>
            <span className="art-share">
              <a href={facebookShareUrl(a.id)} target="_blank" rel="noopener noreferrer"
                onClick={(e) => { e.preventDefault(); window.open(facebookShareUrl(a.id), "_blank", "noopener,noreferrer"); }}
                aria-label="Megosztás Facebookon">f</a>
              <a href={twitterShareUrl(a.id, a.title)} target="_blank" rel="noopener noreferrer"
                onClick={(e) => { e.preventDefault(); window.open(twitterShareUrl(a.id, a.title), "_blank", "noopener,noreferrer"); }}
                aria-label="Megosztás X-en">𝕏</a>
              <button type="button" aria-label="Link másolása" onClick={() => {
                navigator.clipboard && navigator.clipboard.writeText(shareUrl(a.id));
              }}>↗</button>
            </span>
          </div>
        </div>

        <figure className="art-hero">
          <Ph label={a.img} kind="" alt={a.title} />
          {(cap || !isImagePath(a.img)) && (
            <figcaption className="art-cap">{cap || a.img} — Szabad Nemzet illusztráció</figcaption>
          )}
        </figure>

        {err ? (
          <article className="art-body"><p>A cikk tartalma jelenleg nem tölthető be.</p></article>
        ) : content ? (
          <article className="art-body" dangerouslySetInnerHTML={{ __html: content.html }} />
        ) : (
          <article className="art-body art-loading"><p>Tartalom betöltése…</p></article>
        )}

        <div className="art-foot">
          <span style={{ fontSize: ".8em", color: "var(--ink-soft)", marginRight: 4 }}>Címkék:</span>
          {[a.kicker, SECTION_LABEL[a.cat] || "", "Nemzet"].filter(Boolean).map((t) => (
            <span className="tag" key={t}>{t}</span>
          ))}
        </div>

        {related.length > 0 && (
          <section className="related">
            <SecHead title="Kapcsolódó cikkek" more="Tovább a rovathoz" />
            <div className="cols">
              {related.map((r) => <ColCard key={r.id} a={r} onOpen={onOpen} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

// ── Footer ────────────────────────────────────────────────────
function Footer({ onLogo, logoVariant = "emblem" }) {
  const cols = [
    { h: "Rovatok", items: ["Belföld", "Vélemény", "Kultúra", "Történelem", "Világ", "Gazdaság"] },
    { h: "A lapról", items: ["Rólunk", "Impresszum"] },
    { h: "Kövessen", items: ["Facebook", "RSS"] },
  ];
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-brand">
            <Logo onClick={onLogo} flagSize={34} variant={logoVariant} />
            <p>Független magyar hírportál. A nemzet hangja — közélet, kultúra és történelem egy helyen, elkötelezetten a hazai értékek mellett.</p>
          </div>
          {cols.map((c) => (
            <div className="foot-col" key={c.h}>
              <h5>{c.h}</h5>
              {c.items.map((it) => <a key={it} href="#" onClick={(e) => e.preventDefault()}>{it}</a>)}
            </div>
          ))}
        </div>
        <div className="foot-bottom">
          <span><Tricolor /> © 2026 Szabad Nemzet. Minden jog fenntartva.</span>
          <span>Adatvédelem · Felhasználási feltételek · Cookie-beállítások</span>
        </div>
      </div>
    </footer>
  );
}

// ── Tweaks ────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "modern",
  "headlineFont": "franklin",
  "palette": "semleges",
  "accent": "#3f6b4a",
  "density": "comfy",
  "logo": "emblem",
  "dark": false
}/*EDITMODE-END*/;

function Tweaks({ t, setTweak }) {
  const dirs = Object.keys(DIRECTIONS).map((k) => ({ value: k, label: DIRECTIONS[k].label }));
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Irányvonal" />
      <TweakRadio label="Stílus" value={t.direction} options={dirs}
        onChange={(v) => setTweak({ direction: v, ...DIRECTIONS[v].bundle })} />
      <TweakSection label="Tipográfia" />
      <TweakSelect label="Címbetűtípus" value={t.headlineFont} options={FONT_OPTIONS}
        onChange={(v) => setTweak("headlineFont", v)} />
      <TweakRadio label="Sűrűség" value={t.density}
        options={[{ value: "compact", label: "Tömör" }, { value: "regular", label: "Normál" }, { value: "comfy", label: "Tágas" }]}
        onChange={(v) => setTweak("density", v)} />
      <TweakSection label="Szín" />
      <TweakSelect label="Paletta" value={t.palette} options={PALETTE_OPTIONS}
        onChange={(v) => setTweak("palette", v)} />
      <TweakColor label="Kiemelőszín" value={t.accent} options={ACCENTS}
        onChange={(v) => setTweak("accent", v)} />
      <TweakToggle label="Sötét mód" value={t.dark} onChange={(v) => setTweak("dark", v)} />
    </TweaksPanel>
  );
}

// ── App ───────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState({ name: "home" });
  const [active, setActive] = useState("cimlap");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadErr, setLoadErr] = useState(null);

  // Load the article manifest once on mount, then sync route from the URL.
  useEffect(() => {
    loadManifest().then(() => {
      setLoaded(true);
      const id = new URLSearchParams(location.search).get("cikk");
      if (id && byId(id)) {
        setRoute({ name: "article", id });
        setActive(byId(id).cat || "cimlap");
      }
    }).catch((e) => setLoadErr(e.message || String(e)));
  }, []);

  // Browser back/forward → re-read the article id from the URL.
  useEffect(() => {
    const onPop = () => {
      const id = new URLSearchParams(location.search).get("cikk");
      if (id && byId(id)) { setRoute({ name: "article", id }); setActive(byId(id).cat || "cimlap"); }
      else { setRoute({ name: "home" }); setActive("cimlap"); }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const { vars, flags } = buildTheme(t);

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 54;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const openArticle = (id) => {
    setRoute({ name: "article", id });
    setActive(byId(id)?.cat || "cimlap");
    history.pushState({ cikk: id }, "", "?cikk=" + encodeURIComponent(id));
    window.scrollTo({ top: 0, behavior: "auto" });
  };
  const goHome = () => {
    setRoute({ name: "home" });
    setActive("cimlap");
    history.pushState({}, "", location.pathname);
    window.scrollTo({ top: 0, behavior: "auto" });
  };
  const onNav = (id) => {
    if (id === "cimlap") { goHome(); return; }
    setActive(id);
    if (route.name !== "home") {
      setRoute({ name: "home" });
      setTimeout(() => scrollToId(id), 60);
    } else {
      scrollToId(id);
    }
  };

  const cls = ["sn"];
  if (flags.uppercaseHeads) cls.push("uc-heads");
  if (flags.dark) cls.push("dark");

  return (
    <div className={cls.join(" ")} style={vars}>
      <UtilBar dark={t.dark} onToggleDark={() => setTweak("dark", !t.dark)} />
      <Masthead onLogo={goHome} flagSize={flags.condensed ? 44 : 50} logoVariant={t.logo} />
      <Nav active={active} onNav={onNav} condensed={flags.condensed} />
      <MobileBar onMenu={() => setMenuOpen(true)} onLogo={goHome} logoVariant={t.logo} />
      <MobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active={active}
        onNav={(id) => { setMenuOpen(false); onNav(id); }}
        dark={t.dark}
        onToggleDark={() => setTweak("dark", !t.dark)}
      />
      <Ticker items={getMeta().ticker} />
      {loadErr ? (
        <main className="wrap"><p style={{ padding: "60px 0", color: "var(--ink-soft)" }}>
          A tartalom nem tölthető be: {loadErr}
        </p></main>
      ) : !loaded ? (
        <main className="wrap"><p style={{ padding: "60px 0", color: "var(--ink-soft)" }}>
          Betöltés…
        </p></main>
      ) : route.name === "home"
        ? <HomePage onOpen={openArticle} />
        : <ArticlePage id={route.id} onOpen={openArticle} onHome={goHome} />}
      <Footer onLogo={goHome} logoVariant={t.logo === "image" ? "emblem" : t.logo} />
      <Tweaks t={t} setTweak={setTweak} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
