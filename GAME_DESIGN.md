# Block Dojo — Game Design

A watch-only side-scrolling auto-battle / auto-farm idle game.

You never steer, jump, or attack. A dojo student runs an endless route, smashes training blocks, harvests fruit, and stomps Pixel Frog creatures on their own. You only touch **menu overlays**: pick a hero, pick a route, spend loot on upgrades, and tweak sound. The stage never stops.

Visual language comes from [Pixel Frog Pixel Adventure 1 + 2](https://github.com/moonbitlang/pixel-adventure.mbt) (CC0). Audio is an in-engine chiptune + SFX suite (the Pixel Frog tree is graphics only).

---

## Locked calls

| Decision | Call |
| --- | --- |
| Title | **Block Dojo** |
| Death | **Never die.** Empty HP is a knockdown, then they get up and keep running. |
| Attention | **Sit and watch.** The side-scroller is the toy. Menus are a floating scroll with APPLY. |
| Loot | Fruit heals HP. Crates pay coins. Monsters grant XP and level-up chests. |
| Mix | **50/50** farm and fight. Blocks/fruit and monster packs share the route. |

---

## Why this game

The Pixel Adventure pack is a cute platformer kit: four heroes, twenty enemies, crates, fruit, terrain, flags, and chunky menu buttons. It has **no attack animations**. Classic Pixel Adventure combat is a **stomp**. “Block” is the crate. “Dojo” is the training hall.

- The student auto-runs right, hops onto enemies and training blocks, and keeps going.
- Crates are the dojo’s wooden posts. Fruit is the snack drop.
- Biome backgrounds are training grounds, not mine shafts you recall from.
- You are the sensei at the edge of the mat — you watch, then spend.

The pleasure is **watching a tiny pixel movie that gets juicier as numbers go up**.

---

## Core loop

```
Title (stage already running underneath)
   └─ Play (unlocks audio, hides title)
         └─ Endless auto-run on the current route
               ├─ Touch fruit  → collect (farm)
               ├─ Touch crate  → smash, loot (farm)
               ├─ Touch enemy  → auto-stomp / auto-trade hits (battle)
               ├─ Knockdown    → hit flash, tumble, get up, keep going
               └─ Stripe flag  → confetti + bonus, route continues
         └─ Drawer menus never pause the sim
               └─ Spend gold / fruit on upgrades, heroes, routes
```

No WASD. No click-to-attack. Overlay buttons only open drawers.

Chunks ahead of the camera alternate **farm** and **fight** so half the watch time is blocks/fruit and half is combat.

---

## What the player actually clicks

| Surface | Pixel Adventure chrome | What you do |
| --- | --- | --- |
| Title | Play, Settings | Dismiss the card. The dojo is already moving. |
| Dock | Settings, Levels, Play-style icons | Workshop, Heroes, Routes, Settings |
| Heroes | character idle sheets | Unlock / select Mask Dude, Ninja Frog, Pink Man |
| Routes | level number tiles 01–03 | Switch the live biome. Locked routes stay locked. |
| Workshop | box sprites as panel frames | Buy ATK, HP, interval, crit, magnet, crate pay |
| Settings | Volume, Close | Music / SFX sliders |
| HUD | fruit icons + HP | Read-only. The movie stays on screen. |

Opening a drawer covers the lower third only. The student keeps running above it.

---

## Heroes

None of them have punch/slash frames. Combat language is **auto-stomp** (Jump → Fall onto the target). Hit sheets are for taking a hit or a knockdown. Double Jump is a later splash perk.

| Hero | Role | Feel | Unlock |
| --- | --- | --- | --- |
| **Mask Dude** | Balanced striker | Default. Solid ATK / HP / interval. | Free |
| **Ninja Frog** | Glass farmer | Fast interval, high crit, low HP. Better blocks and fruit. | Gold + bananas |
| **Pink Man** | Tank | High HP, slower hits, shrugs trash packs. | Gold + apples |

Appear / Desappear (96×96) play when a hero is swapped on the live route.

Virtual Guy (fruit toss) stays out of the first slice.

---

## Routes (training grounds)

Each route is **endless**. Camera follows at integer pixel scale. A Start-style flag marks stripe bonuses, not a finish line.

| # | Route | Backdrop | Farm drop | Enemies |
| --- | --- | --- | --- | --- |
| 01 | **Green Grove** | Green | Apple, Kiwi | Slime, Mushroom, Plant |
| 02 | **Pink Orchard** | Pink | Cherry, Strawberry | AngryPig, Bunny, Radish |
| 03 | **Brown Hollow** | Brown | Banana, Orange | Snail, Trunk, Rock1 |

---

## Auto-farm

- **Fruit nodes** — hovering fruit. Run through them. `Collected.png`. Fruit flies to the HUD.
- **Training blocks** — Box1 / Box2 / Box3. Idle → Hit → Break. They are the dojo posts. Richer boxes from Crate Crew.
- Grove leans fruit, Hollow leans block gold, Orchard is mixed.

Currencies: **gold** (kills + blocks) and **eight fruit types**.

---

## Auto-battle

1. Hero runs right (`Run`).
2. First enemy in range: hop (`Jump` / `Fall`).
3. On connect: enemy `Hit`, floating damage, impact SFX, dust.
4. Enemy attacks on its interval. Hero `Hit` if damaged.
5. Enemy HP 0 → pop, gold, chance of biome fruit.
6. If a hit would kill the hero → **knockdown**: HP floors at 1, tumble, i-frames, slow regen, then run again. No camp recall. No fruit wipe.

---

## Menu / HUD aesthetic

- **Thaleah Fat** for titles and numbers.
- Pixel Frog buttons and level tiles.
- Workshop panels framed with crate tiles.
- Pixel-perfect 384×216, integer scaled, nearest-neighbor.
- Dust on landings, confetti on stripes, shadows under actors.

---

## Sound

In-engine Web Audio (square / triangle / noise). One loop per biome. SFX for stomp, block break, fruit, UI, knockdown, stripe. First tap on Play unlocks AudioContext.

---

## Economy (first slice)

| Upgrade | Cost | Effect |
| --- | --- | --- |
| Iron Stomp | gold | +ATK |
| Fruit Cake | apples | +Max HP |
| Quick Feet | gold | −attack interval, +run speed |
| Lucky Peel | cherries | +crit |
| Magnet | kiwi | pickup radius |
| Crate Crew | bananas | more gold per block |

Save in `localStorage`. Short capped offline catch-up.

---

## Tech

Vite + TypeScript + Phaser 3. Pixel Adventure sprites vendored from the MoonBit repo. Stage sim keeps ticking under HTML drawers.

---

## Attribution

- Pixel Adventure 1 & 2 by [Pixel Frog](https://pixelfrog-assets.itch.io/) — CC0
- Vendored via [moonbitlang/pixel-adventure.mbt](https://github.com/moonbitlang/pixel-adventure.mbt)
- Thaleah Fat by Rick Hoppmann
