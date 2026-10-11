# Block Dojo

A watch-only side-scrolling auto-battle and auto-farm game. Your student runs an endless route, smashes training blocks, picks fruit, and stomps Pixel Frog creatures. You never steer. You only spend loot from the drawer menus.

The stage never stops. A knockdown is just a knockdown — nobody dies.

## Play locally

```bash
npm install
npm run dev
```

Then open [http://127.0.0.1:4721](http://127.0.0.1:4721). Press **Watch** once so the browser will allow sound.

## How it works

- **Watch** — Mask Dude (or a later student) auto-runs the current route.
- **Farm** — fruit snacks and wooden training blocks.
- **Fight** — auto-stomps. Plants and trunks shoot back.
- **Workshop / Heroes / Routes / Sound** — the only things you click. Drawers cover the lower third; the mat keeps moving.
- Progress saves in `localStorage`. A short offline snack of gold and apples waits if you leave.

Routes in this slice: Green Grove, Pink Orchard, Brown Hollow. Students: Mask Dude, Ninja Frog, Pink Man.

## Assets

- Pixel Adventure 1 & 2 by [Pixel Frog](https://pixelfrog-assets.itch.io/) — CC0, vendored via [moonbitlang/pixel-adventure.mbt](https://github.com/moonbitlang/pixel-adventure.mbt)
- Thaleah Fat by Rick Hoppmann
- Music and hits are generated in the browser (Web Audio)

See `GAME_DESIGN.md` for the locked design and `NOTICE` for license text.
