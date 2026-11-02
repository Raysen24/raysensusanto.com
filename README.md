# Raysen Susanto - Portfolio

Single-page portfolio built with Vite + React + TypeScript.

## Run locally

    npm install
    npm run dev

## Build for deployment

    npm run build

The static site is emitted to `dist/` and can be dropped onto Vercel, Netlify,
GitHub Pages or any static host.

## Editing content

All copy lives in `src/data/cv.ts`. Impact statements there are intentionally
qualitative (no figures), and the only public contact is LinkedIn; the CV is not
served. Replace `public/raysen.png` to change the portrait (a head-and-shoulders
photo on a plain light backdrop works best; the figure is rendered faceless).

## Theme

Monochrome, with dark and light variants. The sun/moon button in the nav toggles
it; the choice is remembered and defaults to the visitor's system preference.
Both palettes live in `src/theme.ts` and `src/styles.css` (`:root` tokens).

### Experience photos

Drop images into `public/photos/` named `<slug>-1.jpg`, `<slug>-2.jpg`, `<slug>-3.jpg`
(slugs: `spx`, `kitesense`, `dana`, `binus`). Slots fill in automatically; empty
slots show a labelled placeholder. See `public/photos/README.md`.

## Motion

- `src/components/ParticleDrift.tsx` - WebGL particle field, fixed behind the whole page (Originkit).
- `src/components/ParticlePortrait.tsx` - the photo rendered as a glowing WebGL point cloud
  that assembles on load, parallaxes with the pointer and scatters away from the cursor.
- `src/lib/lizard.ts` + `src/components/Lizard.tsx` - procedural creature that
  follows the cursor site-wide. Toggle it with the "Creature" switch in the nav.
- `src/viz/*` - one small interactive canvas animation per experience and project
  (`lastMile`, `qualityGate`, `labSession`, `workflow`, `videoScan`, `pinFusion`,
  `heatGrid`, `yoloTray`, `ticketQueue`). Assign them in `cv.ts` via the `viz`
  field and give each a `brand` colour; `src/components/Viz.tsx` runs them only
  while on screen.

## Photo slots

Each experience in `cv.ts` has `photoSlots` (currently SPX 2, Kitesense 1,
DANA 2, Binus 1). Files are read from `public/photos/<slug>-<n>.jpg`.
