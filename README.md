# Block Dojo

A watch-only side-scrolling adventure RPG. Your student runs an endless route, smashes training blocks, eats fruit, and stomps Pixel Frog creatures. You never steer. Fruit heals. Crates pay coins. Kills grant experience. Level-ups open tribute chests.

Menus are a floating scroll over the live stage. Queue changes, then press **APPLY** so nothing is lost. The stage never stops. A knockdown is just a knockdown.

## Play locally

```bash
npm install
npm run dev
```

Then open [http://127.0.0.1:4721](http://127.0.0.1:4721). Press **Watch** once so the browser will allow sound.

The **pumpkin patch** is the Dojo TV stage: a class of 16 harvests, mines, and ducks meteors. Sensei steers them at [http://127.0.0.1:4721/sensei](http://127.0.0.1:4721/sensei). On Vercel the game only plays inside the TV iframe unless you add `?tv=1`.

## How it works

- **Watch** — Mask Dude (or a later student) auto-runs the current route.
- **Fruit** — heals HP.
- **Crates** — drop coins.
- **Monsters** — grant XP. Level-ups play a fanfare and open a loot chest.
- **Scroll** — big floating card (~75% of the stage). Queue workshop arts, shop gear, heroes, routes, and sound, then **APPLY**.
- **Shop** — 30 coin items, best at the top. Scroll the whole catalog. Buy a tier only when you reach that level. **CONFIRM BUY** writes the purchase to your save. The shop shows your wallet coins and XP.
- **Screen** — locked 16:9 computer/TV. Turn off phone device mode if the window looks like a skinny vertical pane.
- Progress saves in `localStorage`.

Routes in this slice: Green Grove, Pink Orchard, Brown Hollow. Students: Mask Dude, Ninja Frog, Pink Man.

## Assets

- Pixel Adventure 1 & 2 by [Pixel Frog](https://pixelfrog-assets.itch.io/) — CC0, vendored via [moonbitlang/pixel-adventure.mbt](https://github.com/moonbitlang/pixel-adventure.mbt)
- Thaleah Fat by Rick Hoppmann
- Music and hits are generated in the browser (Web Audio)

**Drop new pixel art in `public/assets/uploads/`.** That is the folder Grok scans. Put unsorted files in `inbox/`, or use `heroes/`, `enemies/`, `items/`, `shop/`, `ui/`, `bg/`, `fx/`. List each file in `public/assets/uploads/INDEX.md`. Do not overwrite the vendored Pixel Frog folders.

See `GAME_DESIGN.md` for the locked design and `NOTICE` for license text.
