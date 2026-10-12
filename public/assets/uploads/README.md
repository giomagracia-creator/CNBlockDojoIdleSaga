# Pixel uploads — drop new art here

This is the inbox for **new** Block Dojo pixel art. Grok looks here first.

Do **not** overwrite files under `public/assets/heroes`, `enemies`, `items`, `bg`, `fx`, or `ui`. Those are the vendored Pixel Frog set the live game already loads.

## Where to put a file

| Kind | Folder | In-game URL |
| --- | --- | --- |
| Unsorted / not sure | `inbox/` | `/assets/uploads/inbox/your-file.png` |
| Students / heroes | `heroes/` | `/assets/uploads/heroes/your-file.png` |
| Monsters | `enemies/` | `/assets/uploads/enemies/your-file.png` |
| Fruit, crates, flags | `items/` | `/assets/uploads/items/your-file.png` |
| Coin shop prizes | `shop/` | `/assets/uploads/shop/your-file.png` |
| Buttons, HUD, menus | `ui/` | `/assets/uploads/ui/your-file.png` |
| Route backdrops, tiles | `bg/` | `/assets/uploads/bg/your-file.png` |
| Dust, shadow, confetti | `fx/` | `/assets/uploads/fx/your-file.png` |

Vite serves this tree as `/assets/uploads/...`. After you drop a PNG, tell Grok to wire it in `src/game/assets.ts` (and the shop/catalog if it is a prize).

## Naming

Use kebab-case. For sprite sheets, put the frame size in the name:

```
ninja-frog-run-32x32.png
grandmaster-brand-32x32.png
green-grove-bg.png
```

PNG, pixel art, nearest-neighbor (no blur). Prefer transparent backgrounds.

## After you upload

1. Drop the file in the matching folder (or `inbox/` if you are unsure).
2. Add one row to `INDEX.md`.
3. Ask Grok to hook it into the game.
