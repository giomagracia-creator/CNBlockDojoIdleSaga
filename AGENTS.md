# Agent notes — Block Dojo

## New pixel art

User-generated pixel assets go in **`public/assets/uploads/`**. That is the folder Grok must find and use.

- Inbox and type folders: `inbox/`, `heroes/`, `enemies/`, `items/`, `shop/`, `ui/`, `bg/`, `fx/`
- Catalog of drops: `public/assets/uploads/INDEX.md`
- How to name and wire files: `public/assets/uploads/README.md`
- Live game still loads vendored Pixel Frog art from `public/assets/{heroes,enemies,items,bg,fx,ui}/` via `src/game/assets.ts`
- Do not overwrite the vendored Pixel Frog files. Copy or reference uploads, then register them in `src/game/assets.ts` (URL `/assets/uploads/...`)
