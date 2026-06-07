// components.jsx — Szabad Nemzet shared UI

// ── Placeholder image ─────────────────────────────────────────
function Ph({ label, kind = "wide", style, alt = "" }) {
  if (isImagePath(label)) {
    return (
      <div className={"ph ph-has-img " + kind} style={style}>
        <img src={label} alt={alt} loading="lazy" />
      </div>
    );
  }
  return <div className={"ph " + kind} data-label={label} style={style} aria-hidden="true" />;
}

// ── Brand mark (the Szabad Nemzet logo image) ─────────────────
function BrandMark({ size = 50 }) {
  const s = Math.round(size * 1.2); // 20% larger on-page
  return <span className="brandmark" role="img" aria-label="Szabad Nemzet" style={{ width: s + "px", height: s + "px" }} />;
}

// ── Raised battle-flag emblem (bold, martial, traditional) ────
function Emblem({ size = 50 }) {
  return (
    <span className="emblem" style={{ "--em": size + "px" }} aria-hidden="true">
      <span className="finial" />
      <span className="staff" />
      <span className="banner" />
    </span>
  );
}

// ── Hand raising the flag (monochrome silhouette + tricolor) ──
function HandFlag({ size = 56 }) {
  const flagPath = "M67,17 C89,11 105,23 120,15 L116,54 C99,60 85,46 59,52 Z";
  const groove = { stroke: "var(--paper)", fill: "none", strokeLinecap: "round" };
  return (
    <svg className="handflag" viewBox="0 0 126 138" style={{ "--em": size + "px" }}
         role="img" aria-label="Felemelt zászló">
      <defs>
        <clipPath id="hf-clip"><path d={flagPath} /></clipPath>
      </defs>
      {/* staff (ends hidden behind the fist) */}
      <line x1="70" y1="12" x2="57" y2="89" stroke="currentColor" strokeWidth="4.6" strokeLinecap="round" />
      <circle cx="70" cy="10" r="4.2" fill="currentColor" />
      {/* tricolor flag */}
      <g clipPath="url(#hf-clip)">
        <rect x="55" y="7" width="73" height="20" fill="#ce2939" />
        <rect x="55" y="27" width="73" height="16" fill="#f4f1e9" />
        <rect x="55" y="43" width="73" height="23" fill="#3f6b4a" />
      </g>
      <path d={flagPath} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* forearm */}
      <path d="M45,92 L40,138 L74,138 L75,92 Z" fill="currentColor" />
      {/* clenched fist */}
      <path d="M32,95 L31,72 Q31,60 43,59 Q48,54 53,59 Q58,54 63,59 Q68,54 73,59
               Q84,60 84,72 L84,86 Q84,96 72,96 L43,96 Q32,96 32,95 Z"
            fill="currentColor" />
      {/* finger + thumb grooves (paper-colored so they read in both themes) */}
      <path d="M48,61 L48,75 M58,60 L58,75 M68,61 L68,75" style={groove} strokeWidth="2.3" />
      <path d="M34,83 Q58,88 81,82" style={groove} strokeWidth="2.6" />
    </svg>
  );
}

// kept as alias so older callers don't break
function FlagMark(props) { return <Emblem {...props} />; }

function Tricolor() {
  return (
    <span className="tri" aria-hidden="true">
      <i style={{ background: "#ce2939" }} />
      <i style={{ background: "#f3f0e8" }} />
      <i style={{ background: "#3f6b4a" }} />
    </span>
  );
}

// ── Logo ──────────────────────────────────────────────────────
function Logo({ onClick, flagSize = 50, variant = "emblem" }) {
  return (
    <a className="logo" onClick={onClick} aria-label="Szabad Nemzet — címlap">
      <BrandMark size={flagSize} />
      <span className="logo-word">Szabad <span className="nemzet">Nemzet</span></span>
    </a>
  );
}

// ── Theme toggle ──────────────────────────────────────────────
function ThemeToggle({ dark, onToggle }) {
  return (
    <button className="themetoggle" onClick={onToggle} aria-label="Sötét mód váltása">
      <span className="ico" aria-hidden="true">
        {dark ? (
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
          </svg>
        )}
      </span>
      {dark ? "Világos" : "Sötét"}
    </button>
  );
}

// ── Utility bar ───────────────────────────────────────────────
function UtilBar({ dark, onToggleDark }) {
  const nameday = nameDayFor();
  // Live Budapest temperature via Open-Meteo (no key, CORS-friendly).
  // Last value is cached so it appears instantly on reload.
  const [temp, setTemp] = React.useState(() => {
    const c = localStorage.getItem("sn_temp");
    return c == null ? null : Number(c);
  });
  React.useEffect(() => {
    let live = true;
    fetch("https://api.open-meteo.com/v1/forecast?latitude=47.4979&longitude=19.0402&current_weather=true")
      .then((r) => r.json())
      .then((d) => {
        const tC = d && d.current_weather && d.current_weather.temperature;
        if (live && typeof tC === "number") {
          const r = Math.round(tC);
          setTemp(r);
          try { localStorage.setItem("sn_temp", String(r)); } catch (e) {}
        }
      })
      .catch(() => {});
    return () => { live = false; };
  }, []);
  return (
    <div className="util">
      <div className="wrap">
        <div className="util-left">
          <span className="dot" />
          <span>{huDateLong()}</span>
          <span className="hide-sm">Budapest{temp == null ? "" : ` · ${temp}°C`}</span>
          {nameday && <span className="hide-sm">Névnap: {nameday}</span>}
        </div>
        <div className="util-right">
          <ThemeToggle dark={dark} onToggle={onToggleDark} />
        </div>
      </div>
    </div>
  );
}

// ── Masthead ──────────────────────────────────────────────────
function Masthead({ onLogo, flagSize, logoVariant }) {
  return (
    <header className="mast">
      <div className="wrap">
        <div className="mast-line">Független hírportál · Alapítva MMXXVI</div>
        <Logo onClick={onLogo} flagSize={flagSize} variant={logoVariant} />
      </div>
    </header>
  );
}

// ── Primary nav ───────────────────────────────────────────────
function Nav({ active, onNav, condensed }) {
  return (
    <nav className={"nav" + (condensed ? " condensed" : "")}>
      <div className="wrap">
        {SECTIONS.map((s) => (
          <a key={s.id} className={active === s.id ? "active" : ""}
             onClick={() => onNav(s.id)} href={"#" + s.id}>{s.label}</a>
        ))}
        {NAV_EXTRA.map((x) => (
          <a key={x} className="extra" href="#" onClick={(e) => e.preventDefault()}>{x}</a>
        ))}
        <span className="nav-spacer" />
        <a className="nav-search" href="#" onClick={(e) => e.preventDefault()} aria-label="Keresés">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
        </a>
      </div>
    </nav>
  );
}

// ── Breaking ticker ───────────────────────────────────────────
function Ticker({ items = [] }) {
  const row = [...items, ...items];
  return (
    <div className="ticker">
      <div className="wrap">
        <span className="ticker-tag"><span className="pulse" />Friss</span>
        <div className="ticker-track">
          <div className="ticker-row">
            {row.map((h, i) => <span key={i}>{h}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Meta line ─────────────────────────────────────────────────
function Meta({ a }) {
  return (
    <div className="meta">
      <span className="by">{a.author}</span>
      <span className="sep">·</span>
      <span>{a.date}</span>
      <span className="sep">·</span>
      <span>{a.read} perc</span>
    </div>
  );
}

// ── Cards ─────────────────────────────────────────────────────
function ColCard({ a, onOpen }) {
  return (
    <article className="card" onClick={() => onOpen(a.id)}>
      <Ph label={a.img} kind="wide" alt={a.title} />
      <span className="kicker">{a.kicker}</span>
      <h3 className="title">{a.title}</h3>
      <p className="dek">{a.dek}</p>
      <Meta a={a} />
    </article>
  );
}

function ListCard({ a, onOpen, withImg }) {
  return (
    <article className="card" onClick={() => onOpen(a.id)}>
      {withImg && <Ph label={a.img} kind="sq" alt={a.title} />}
      <div>
        <span className="kicker">{a.kicker}</span>
        <h3 className="title">{a.title}</h3>
      </div>
    </article>
  );
}

// ── Mobile top bar (sticky) ───────────────────────────────────
function MobileBar({ onMenu, onLogo, logoVariant = "emblem" }) {
  return (
    <header className="mbar">
      <button className="mbar-btn" aria-label="Menü" onClick={onMenu}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>
      <a className="mbar-logo" onClick={onLogo} aria-label="Szabad Nemzet — címlap">
        <BrandMark size={30} />
        <span className="logo-word">Szabad <span className="nemzet">Nemzet</span></span>
      </a>
      <button className="mbar-btn" aria-label="Keresés" onClick={(e) => e.preventDefault()}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
        </svg>
      </button>
    </header>
  );
}

// ── Mobile slide-in drawer ────────────────────────────────────
function MobileDrawer({ open, onClose, active, onNav, dark, onToggleDark }) {
  return (
    <div className={"drawer-root" + (open ? " open" : "")} aria-hidden={!open}
         style={{ pointerEvents: open ? "auto" : "none" }}>
      <div className="drawer-scrim" onClick={onClose} style={{ opacity: open ? 1 : 0 }} />
      <aside className="drawer" role="dialog" aria-label="Navigáció"
             style={{ transform: open ? "translateX(0)" : "translateX(-102%)" }}>
        <div className="drawer-head">
          <span className="drawer-brand"><BrandMark size={26} /><span className="logo-word">Szabad <span className="nemzet">Nemzet</span></span></span>
          <button className="drawer-x" aria-label="Bezárás" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="drawer-date">{huDateLong()}{nameDayFor() ? " · Névnap: " + nameDayFor() : ""}</div>
        <nav className="drawer-nav">
          {SECTIONS.map((s) => (
            <a key={s.id} className={active === s.id ? "active" : ""} href={"#" + s.id}
               onClick={(e) => { e.preventDefault(); onNav(s.id); }}>{s.label}</a>
          ))}
          {NAV_EXTRA.map((x) => (
            <a key={x} className="extra" href="#" onClick={(e) => e.preventDefault()}>{x}</a>
          ))}
        </nav>
        <div className="drawer-foot">
          <ThemeToggle dark={dark} onToggle={onToggleDark} />
        </div>
      </aside>
    </div>
  );
}

Object.assign(window, {
  Ph, BrandMark, Emblem, HandFlag, FlagMark, Tricolor, Logo, ThemeToggle, UtilBar, Masthead, Nav, Ticker, Meta, ColCard, ListCard, MobileBar, MobileDrawer,
});
