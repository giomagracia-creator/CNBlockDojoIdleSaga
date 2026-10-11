# Fruitline — Game Design

A watch-only side-scrolling auto-battle / auto-farm idle game.

You never steer, jump, or attack. The hero runs a looping route, smashes crates, harvests fruit, and fights Pixel Frog creatures on its own. You only touch **menu pages**: pick a hero, pick a route, spend loot on upgrades, and tweak sound.

Visual language comes from [Pixel Frog Pixel Adventure 1 + 2](https://github.com/moonbitlang/pixel-adventure.mbt) (CC0). Audio does not — that repo is graphics only — so we pair it with Kenney CC0 SFX plus a tiny in-engine chiptune.

---

## Why this game

The Pixel Adventure pack is a cute platformer kit: four heroes, twenty enemies, crates, fruit, terrain, flags, and chunky menu buttons. It has **no attack animations**. Classic Pixel Adventure combat is a **stomp**. That maps cleanly onto an idle loop:

- The hero auto-runs right, hops onto enemies, and keeps going.
- Crates are ore nodes. Fruit is the resource drop.
- Biome backgrounds (green / pink / brown / blue / purple / gray / yellow) are the “mine shafts.”
- You play the camp, not the character — same fantasy as an auto-miner, just sideways and punchier.

Working title: **Fruitline**.

---

## Player fantasy

You are the expedition planner. Send Mask Dude (or a later hire) down a colorful route. Watch them farm and fight. When they limp home or clear a flag, spend fruit to make the next run faster and meaner.

The pleasure is **watching a tiny pixel movie that gets juicier as numbers go up**.

---

## Core loop

```
Camp menus
   └─ Start Route
         └─ Auto-run right through a looping side-scroller
               ├─ Touch fruit  → collect (farm)
               ├─ Touch crate  → smash, loot (farm)
               ├─ Touch enemy  → auto-stomp / auto-trade hits (battle)
               └─ Hit End flag → bonus + unlock next route
         └─ Death or retreat → back to Camp with kept gold + most fruit
   └─ Spend currencies on upgrades / hero / party
   └─ Repeat (run keeps ticking while menus are open)
```

No WASD. No click-to-attack. Overlay buttons only open menus.

---

## What the player actually clicks

| Screen | Pixel Adventure chrome | What you do |
| --- | --- | --- |
| Title | Play, Settings, Achievements | Start, volume, view medals |
| Camp | Levels, Play, Back | Home base. Gold / fruit counts. Open submenus. |
| Heroes | character idle sheets | Unlock / select Mask Dude, Ninja Frog, Pink Man, Virtual Guy |
| Routes | level number tiles 01–N | Pick a biome. Locked routes show the lock treatment. |
| Workshop | box sprites as panel frames | Buy ATK, HP, interval, crit, magnet, crate speed |
| Party | extra hero portraits | Hire a follower who auto-attacks behind the lead |
| Settings | Volume, Close | Music / SFX sliders, mute |
| Run HUD | pause via Settings button | Open camp **without stopping the sim**. Watch-only stage. |

During a run the only “gameplay” input is **open a menu**. The stage keeps simulating underneath, like leaving miners running while you upgrade.

---

## Heroes (the four Pixel Adventure characters)

None of them have punch/slash frames. Combat language is **auto-stomp** (Jump → Fall onto the target) plus optional fruit toss. Hit sheets are for taking damage. Double Jump is a purchased spin (small AoE).

| Hero | Role | Feel | Unlock |
| --- | --- | --- | --- |
| **Mask Dude** | Balanced striker | Default. Solid ATK / HP / interval. | Free |
| **Ninja Frog** | Glass farmer | Fast interval, high crit, low HP. Better crate / fruit pickup. | Gold |
| **Pink Man** | Tank | High HP, slower hits, shrugs trash packs. | Gold |
| **Virtual Guy** | Caster | Stands a step back and lobs fruit sprites as projectiles. | Gold + fruit mix |

Appear / Desappear (96×96) play when a hero enters or leaves a route.

---

## Routes (biomes)

Each route is a short looping side-scroller: Start flag → terrain + crates + fruit + 1–2 enemy packs → End trophy. Camera follows the lead hero at integer pixel scale.

Background PNGs from the pack drive the palette. Terrain atlas (`Terrain (16x16).png`) is sliced per biome.

| # | Route | Backdrop | Farm drop | Enemies (first slice / later) |
| --- | --- | --- | --- | --- |
| 01 | **Green Grove** | Green | Apple, Kiwi | Slime, Mushroom, Plant |
| 02 | **Pink Orchard** | Pink | Cherry, Strawberry | AngryPig, Bunny, Radish |
| 03 | **Brown Hollow** | Brown | Banana, Orange | Snail, Trunk, Rock1 — the “mine” |
| 04 | Blue Cliffs | Blue | Melon | BlueBird, Bee, Bat |
| 05 | Purple Haunt | Purple | Pineapple | Ghost, Skull |
| 06 | Gray Foundry | Gray | mixed rare | Saw / Fire as hazards, Rock Head boss |
| 07 | Yellow Dunes | Yellow | mixed rare | Rino, Chameleon, Turtle |

**First shippable slice: routes 01–03**, Mask Dude + one unlockable hero, Workshop, Settings, sound, local save.

Hazards (spikes, saws, fire) are later-route flavor, not something the player dodges. The hero pathfinds around them or eats a chip of damage if under-upgraded.

---

## Auto-farm

This is the mining layer.

- **Fruit nodes** — hovering fruit sprites (Apple, Banana, Cherries, Kiwi, Melon, Orange, Pineapple, Strawberry). Hero walks through them. Play `Collected.png`. Fruit flies to the HUD.
- **Crates** — Box1 / Box2 / Box3. Idle → Hit → Break. They are ore veins. Respawn on a timer (upgrade: faster respawn / richer boxes).
- **Biome specialty** — Grove leans fruit, Hollow leans crate gold, Orchard is mixed.

Currencies:

- **Gold** — monster kills + crate bonus. Workshop soft currency.
- **Fruit types** — eight resources. Hero unlocks and some upgrades cost a specific mix (Ninja Frog wants bananas, Virtual Guy wants a rainbow).
- **Trophy dust** (later) — End-flag prestige for a permanent multiplier.

---

## Auto-battle

Turn-less, interval based, fully animated.

1. Hero runs right (`Run`).
2. First enemy in range: hop (`Jump` / `Fall`) or fruit-toss (Virtual Guy).
3. On connect: enemy plays `Hit`, floating damage, impact SFX, dust particle.
4. Enemy attacks on its own interval. Hero plays `Hit` if damaged. HP bar above the lead.
5. Enemy HP 0 → death pop, gold + chance of that biome’s fruit.
6. If hero HP 0 → Desappear, short camp return, keep gold, lose a slice of unsaved fruit.

Enemy roles mapped onto the actual sheets:

| Role | Who | Behavior |
| --- | --- | --- |
| Trash melee | Slime, Mushroom, Chicken, AngryPig | Walk in, trade hits |
| Armored | Snail, Turtle | Slow, fat HP, shell idle as “block” |
| Ranged | Bee, Plant, Trunk | Use their `Bullet.png` / pieces |
| Flyer | Bat, BlueBird, FatBird, Ghost | Hover; stomp still works |
| Bruiser / mini-boss | Rino, Skull, Rock Head, Spike Head | Charge or slam; End-flag guardian |

No player combo inputs. Purchased perks only:

- Faster attack interval
- Stomp splash (Double Jump spin)
- Fruit magnet
- Lifesteal on fruit pickup
- Second / third party member (they use the other character sheets and auto-stomp slightly behind)

---

## Menu / HUD aesthetic

Stay inside the pack. No generic CSS chrome.

- **Thaleah Fat** for all titles and numbers.
- Pixel Frog buttons: Play, Back, Close, Settings, Volume, Levels, Achievements, Next / Previous.
- Workshop panels framed with crate / box tiles.
- Level tiles 01–03 (later 01–07) as route select.
- Run HUD: gold, fruit icons, hero HP, tiny “watching” badge. Settings button opens camp.
- Transitions use `Other/Transition.png`. Wins sprinkle `Confetti`. Landings spawn `Dust Particle`. Shadows under actors.

Pixel-perfect: native render ~320×180 or 384×216, integer scaled (3× / 4×), nearest-neighbor, no blur.

---

## Sound

The MoonBit / Pixel Frog tree has **zero audio**. We do not ship a silent game.

**SFX (Kenney CC0, vendored):**

- [Interface Sounds](https://kenney.nl/assets/interface-sounds) — menu open, click, confirm, back, upgrade buy, lock deny
- [Impact Sounds](https://www.kenney.nl/assets/impact-sounds) — stomp, crate smash, enemy hit, hero hurt, rock thud

**Custom / generated (in-repo, no extra license):**

- Fruit collect (high little arpeggio)
- Level / route clear (short fanfare)
- Death (descending square)
- Crate break wood + coin
- Hover / magnet whoosh

**Music:** a tiny Web Audio chiptune engine (square + triangle + noise hats), one 8–16 bar loop per biome. Grove is bright, Orchard is bouncy, Hollow is muted and “mine-like.” Settings slider controls it. Music ducks under big SFX.

First user gesture on Title unlocks AudioContext (browser autoplay rule). Volume button on Title starts muted-safe.

---

## Economy (first slice numbers)

Starting: 0 gold, a handful of apples after the first Grove loop so the Workshop is never a brick wall.

| Upgrade | Cost curve | Effect |
| --- | --- | --- |
| Iron Stomp | gold, exponential | +ATK |
| Fruit Cake | fruit mix | +Max HP |
| Quick Feet | gold | −attack interval, slightly +run speed |
| Lucky Peel | cherries | +crit |
| Magnet | kiwi | pickup radius |
| Crate Crew | bananas | faster crate respawn / more gold |

Hero unlocks sit behind a gold wall plus one “identity” fruit. Party slot 2 is a mid-slice goal, not day-one.

Death penalty: keep all gold, keep 70% of fruit on the run. Feels like a miner recalling, not a roguelike wipe.

Save: `localStorage`. Opening the page mid-run resumes the sim and grants a short offline catch-up (capped, so you cannot park for a week and skip the game).

---

## Scenes and tech

**Stack:** Vite + TypeScript + Phaser 3 + Howler (or Phaser sound). Pixel-perfect canvas, uncommon preview port. Not MoonBit — that repo is the **asset source**, not the engine.

**Scenes:** Boot (preload atlas + audio) → Title → Camp → Run (always simulating once started).

**Asset ingest:** vendor a trimmed copy of `pixel_adventure/` from the GitHub tree (heroes, used enemies, fruits, boxes, terrain, backgrounds, menu, particles, font). Keep NOTICE / CC0 credit. Do not vendor unused trap sheets in v1.

**Systems:**

- `Sim` — pure tick: positions, combat, loot, respawns. Menus can stay mounted while Sim runs.
- `View` — Phaser sprites bound to sim entities (32×32 heroes, enemy frame sizes as in filenames, 20 FPS / 50 ms as Pixel Frog specifies).
- `Meta` — currencies, upgrades, unlocks, settings, save/load.

---

## First slice (build this, not a platform)

Must be playable and pretty:

1. Title with music unlock + volume.
2. Camp + Workshop + route select (3 biomes).
3. Mask Dude auto-runs Grove, smashes crates, picks fruit, stomps Slime / Mushroom / Plant.
4. Death / End-flag returns to Camp with loot.
5. Upgrades visibly change the next (and current) run.
6. Unlock Ninja Frog.
7. Full SFX + three biome loops.
8. Pixel-perfect scale, mobile-friendly menus, desktop watch-view.
9. Persistent save. Empty / first-run copy that tells you to press Play and then ignore the stage.
10. README + attribution.

Out of slice (do not scaffold): prestige, 7 biomes, 20 enemies, achievements beyond a stub, multiplayer, chat, accounts, ads.

---

## Feel checklist

- Integer scale, chunky outlines, no filtered pixels.
- Every pickup and hit has a pop, a number, a particle, and a sound.
- Attack cadence is readable at a glance (you should *hear* DPS going up).
- Menus feel like they belong in the same world as the stage.
- You can leave the tab on a run and only open Workshop when you want a decision.

---

## Attribution (ship in README / NOTICE)

- Pixel Adventure 1 & 2 by [Pixel Frog](https://pixelfrog-assets.itch.io/) — CC0
- Vendored via [moonbitlang/pixel-adventure.mbt](https://github.com/moonbitlang/pixel-adventure.mbt)
- Thaleah Fat by Rick Hoppmann — as bundled in that repo
- Kenney Interface Sounds + Impact Sounds — CC0
