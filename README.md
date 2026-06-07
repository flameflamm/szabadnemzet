# Szabad Nemzet

Statikus hírportál — egyszerű, telepíthető, és cikkenként Markdown-fájlból épül.
A weboldal tisztán statikus (HTML/CSS/JS), így ingyenesen futtatható GitHub Pages-en.

---

## Hogyan jelenik meg egy cikk?

Minden cikk egy **Markdown-fájl** az `articles/` mappában, YAML „front-matter” fejléccel:

```markdown
---
title: A cikk címe
dek: Egymondatos összefoglaló / alcím.
cat: belfold            # belfold | velemeny | kultura | tortenelem
kicker: Családpolitika  # kis kategóriacímke a cím fölött
author: Kovács Réka
role: belpolitikai szerkesztő
date: 2026-06-05         # ÉÉÉÉ-HH-NN (így rendeződnek sorba, legújabb elöl)
read: 4                  # becsült olvasási idő percben
feature: true            # opcionális — címlapi kiemelés
opinion: true            # opcionális — vélemény jelölés
img: articles/images/borito.jpg   # borítókép (lásd lentebb) — vagy hagyd felirat-szövegnek
related:                 # opcionális — kapcsolódó cikkek azonosítói
  - forint
  - videk
---

Az első bekezdés…

A második bekezdés. Lehet **félkövér**, _dőlt_, [hivatkozás](https://pelda.hu),
felsorolás és alcím is — sima Markdown.

> Idézet, amely kiemelt szövegként jelenik meg a cikkben.

A többi bekezdés…
```

A fájl **neve adja az azonosítót**: `articles/otthonteremtes.md` → `otthonteremtes`.

---

## Publikálás (a teljes folyamat)

1. Hozz létre egy új fájlt: `articles/<azonosito>.md` a fenti fejléccel.
2. (Borítókép esetén) tedd a képet az `images/` mappába, és hivatkozz rá a `img:`
   mezőben **a gyökértől számított útvonallal**, pl. `articles/images/borito.jpg`.
3. **Commit + push.**

Ennyi. A GitHub Action a szerveren újraépíti a tartalomjegyzéket és a megosztási
oldalakat, majd élesít. Terminál nem kell.

---

## Mit csinál az automatikus build?

A `build.mjs` script (a GitHub Action automatikusan futtatja minden push-nál)
végigolvassa az `articles/*.md` fájlokat, és előállítja:

- **`articles/index.json`** — a tartalomjegyzék, amit az oldal betölt
  (dátum szerint rendezve). **Ezt soha nem kell kézzel szerkeszteni.**
- **`cikk/<azonosito>.html`** — cikkenként egy kis oldal a Facebook/X
  megosztási előnézet-címkékkel (cím, leírás, kép), amely továbbítja az
  olvasót a cikkhez. (A Facebook nem futtat JavaScriptet, ezért kell ez.)

Ezeket nem kell kézzel karbantartani — a build mindig frissen állítja elő őket.

### Helyi build (opcionális)
Ha élesítés előtt helyben szeretnéd megnézni:

```bash
node build.mjs       # újragenerálja articles/index.json + cikk/*.html
```

Futtatáshoz [Node.js](https://nodejs.org) (v18+) kell, a projekt gyökeréből indítsd.

---

## Amit kézzel szerkesztesz

Csak egyetlen tartalmi fájl nem cikkspecifikus:

- **`articles/_meta.json`** — a „Legolvasottabb” lista (cikk-azonosítók) és a
  felül futó hírsáv (ticker) szövegei. Ezt módosítsd, ha ezeket cserélnéd.

---

## Telepítés GitHub Pages-re (egyszeri beállítás)

1. Töltsd fel a projektet egy GitHub repóba.
2. A repóban: **Settings → Pages → Build and deployment → Source →** válaszd a
   **„GitHub Actions”** lehetőséget (ne a „Deploy from a branch”-et).
3. Push a `main` ágra → az oldal automatikusan épül és élesedik.
   - Ha az alapértelmezett ágad `master`, írd át a `.github/workflows/deploy.yml`
     fájlban a `branches: [main]` sort `branches: [master]`-re.

> A `.github` mappa rejtett (ponttal kezdődik), ezért a fájlböngészőben gyakran
> nem látszik — de a Git rendesen kezeli és feltölti.

---

## Hozzáférés / ki írhat cikket

A publikálás = fájl commitolása a repóba. Tehát **az írhat, akit a repó
közreműködőjeként (collaborator) hozzáadsz** — más nem. Nincs külön jelszó vagy
bejelentkezés a weboldalon, így nincs is mit feltörni: a hozzáférést maga a
GitHub kezeli. Új szerző hozzáadása: **Settings → Collaborators**.

---

## Borítóképek

- Helyük: `images/` vagy `articles/images/`.
- Hivatkozás a `img:` mezőben **gyökértől számított** útvonallal
  (pl. `articles/images/borito.jpg`).
- Ajánlott méret: **2400×1350** (16:9), a fő motívum középen — a kép több
  méretben is megjelenik (cikkfej, címlap, kártyák).
- Formátum: JPEG vagy WebP, ~80% minőség, lehetőleg 300 KB alatt.
- A megosztási előnézet képe automatikusan ez a borítókép lesz; ha egy cikknek
  nincs valódi képe, a logó jelenik meg helyette.

---

## Megosztás (Facebook / X)

Minden cikk alján ott a megosztó gomb. A linkek a `cikk/<azonosito>.html`
oldalra mutatnak, amely a megfelelő előnézet-címkéket tartalmazza.

Ha élesítés után rossz/üres előnézet jelenik meg a Facebookon (gyorsítótár
miatt), illeszd be a linket a
[Facebook Sharing Debuggerbe](https://developers.facebook.com/tools/debug/), és
nyomd meg a „Scrape Again” gombot.

---

## Ha új címen lesz az oldal

A `SITE_BASE` érték jelenleg: `https://mor-lang.dev/FakeSite/`.
Ha máshová költözik az oldal, **két helyen** kell átírni (záró perjellel együtt):

- `content.jsx`
- `build.mjs`

---

## Fájlszerkezet

```
index.html            – a weboldal
styles.css            – stílusok
content.jsx           – tartalombetöltő + segédfüggvények
theme.jsx             – színek / betűtípusok
components.jsx        – közös UI-elemek
app.jsx               – oldal-logika, útválasztás
tweaks-panel.jsx      – „Tweaks” panel
namedays.js           – magyar névnaptár
images/               – logó (logo.svg, logo-dark.svg) + borítóképek
articles/
  *.md                – a cikkek (ezeket írod)
  _meta.json          – legolvasottabb + ticker (kézzel)
  index.json          – AUTOMATIKUSAN generált tartalomjegyzék
cikk/                 – AUTOMATIKUSAN generált megosztási oldalak
build.mjs             – a build script
.github/workflows/
  deploy.yml          – a GitHub Action (build + élesítés)
```
