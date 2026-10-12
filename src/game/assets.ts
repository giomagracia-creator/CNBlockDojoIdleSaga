import Phaser from "phaser";
import type { HeroId } from "./catalog.ts";

type Sheet = {
  key: string;
  url: string;
  frameWidth: number;
  frameHeight: number;
};

export const SHEETS: Sheet[] = [
  { key: "mask-idle", url: "/assets/heroes/mask/idle.png", frameWidth: 32, frameHeight: 32 },
  { key: "mask-run", url: "/assets/heroes/mask/run.png", frameWidth: 32, frameHeight: 32 },
  { key: "mask-jump", url: "/assets/heroes/mask/jump.png", frameWidth: 32, frameHeight: 32 },
  { key: "mask-fall", url: "/assets/heroes/mask/fall.png", frameWidth: 32, frameHeight: 32 },
  { key: "mask-hit", url: "/assets/heroes/mask/hit.png", frameWidth: 32, frameHeight: 32 },
  { key: "mask-spin", url: "/assets/heroes/mask/spin.png", frameWidth: 32, frameHeight: 32 },
  { key: "frog-idle", url: "/assets/heroes/frog/idle.png", frameWidth: 32, frameHeight: 32 },
  { key: "frog-run", url: "/assets/heroes/frog/run.png", frameWidth: 32, frameHeight: 32 },
  { key: "frog-jump", url: "/assets/heroes/frog/jump.png", frameWidth: 32, frameHeight: 32 },
  { key: "frog-fall", url: "/assets/heroes/frog/fall.png", frameWidth: 32, frameHeight: 32 },
  { key: "frog-hit", url: "/assets/heroes/frog/hit.png", frameWidth: 32, frameHeight: 32 },
  { key: "frog-spin", url: "/assets/heroes/frog/spin.png", frameWidth: 32, frameHeight: 32 },
  { key: "pink-idle", url: "/assets/heroes/pink/idle.png", frameWidth: 32, frameHeight: 32 },
  { key: "pink-run", url: "/assets/heroes/pink/run.png", frameWidth: 32, frameHeight: 32 },
  { key: "pink-jump", url: "/assets/heroes/pink/jump.png", frameWidth: 32, frameHeight: 32 },
  { key: "pink-fall", url: "/assets/heroes/pink/fall.png", frameWidth: 32, frameHeight: 32 },
  { key: "pink-hit", url: "/assets/heroes/pink/hit.png", frameWidth: 32, frameHeight: 32 },
  { key: "pink-spin", url: "/assets/heroes/pink/spin.png", frameWidth: 32, frameHeight: 32 },
  { key: "hero-appear", url: "/assets/heroes/appear.png", frameWidth: 96, frameHeight: 96 },
  { key: "hero-vanish", url: "/assets/heroes/vanish.png", frameWidth: 96, frameHeight: 96 },
  { key: "slime-run", url: "/assets/enemies/slime/run.png", frameWidth: 44, frameHeight: 30 },
  { key: "slime-hit", url: "/assets/enemies/slime/hit.png", frameWidth: 44, frameHeight: 30 },
  { key: "mushroom-idle", url: "/assets/enemies/mushroom/idle.png", frameWidth: 32, frameHeight: 32 },
  { key: "mushroom-run", url: "/assets/enemies/mushroom/run.png", frameWidth: 32, frameHeight: 32 },
  { key: "mushroom-hit", url: "/assets/enemies/mushroom/hit.png", frameWidth: 32, frameHeight: 32 },
  { key: "plant-idle", url: "/assets/enemies/plant/idle.png", frameWidth: 44, frameHeight: 42 },
  { key: "plant-attack", url: "/assets/enemies/plant/attack.png", frameWidth: 44, frameHeight: 42 },
  { key: "plant-hit", url: "/assets/enemies/plant/hit.png", frameWidth: 44, frameHeight: 42 },
  { key: "pig-idle", url: "/assets/enemies/pig/idle.png", frameWidth: 36, frameHeight: 30 },
  { key: "pig-run", url: "/assets/enemies/pig/run.png", frameWidth: 36, frameHeight: 30 },
  { key: "pig-hit", url: "/assets/enemies/pig/hit.png", frameWidth: 36, frameHeight: 30 },
  { key: "bunny-idle", url: "/assets/enemies/bunny/idle.png", frameWidth: 34, frameHeight: 44 },
  { key: "bunny-run", url: "/assets/enemies/bunny/run.png", frameWidth: 34, frameHeight: 44 },
  { key: "bunny-hit", url: "/assets/enemies/bunny/hit.png", frameWidth: 34, frameHeight: 44 },
  { key: "radish-idle", url: "/assets/enemies/radish/idle.png", frameWidth: 30, frameHeight: 38 },
  { key: "radish-run", url: "/assets/enemies/radish/run.png", frameWidth: 30, frameHeight: 38 },
  { key: "radish-hit", url: "/assets/enemies/radish/hit.png", frameWidth: 30, frameHeight: 38 },
  { key: "snail-idle", url: "/assets/enemies/snail/idle.png", frameWidth: 38, frameHeight: 24 },
  { key: "snail-walk", url: "/assets/enemies/snail/walk.png", frameWidth: 38, frameHeight: 24 },
  { key: "snail-hit", url: "/assets/enemies/snail/hit.png", frameWidth: 38, frameHeight: 24 },
  { key: "trunk-idle", url: "/assets/enemies/trunk/idle.png", frameWidth: 64, frameHeight: 32 },
  { key: "trunk-run", url: "/assets/enemies/trunk/run.png", frameWidth: 64, frameHeight: 32 },
  { key: "trunk-attack", url: "/assets/enemies/trunk/attack.png", frameWidth: 64, frameHeight: 32 },
  { key: "trunk-hit", url: "/assets/enemies/trunk/hit.png", frameWidth: 64, frameHeight: 32 },
  { key: "rock-idle", url: "/assets/enemies/rock/idle.png", frameWidth: 38, frameHeight: 34 },
  { key: "rock-run", url: "/assets/enemies/rock/run.png", frameWidth: 38, frameHeight: 34 },
  { key: "fruit-apple", url: "/assets/items/fruits/apple.png", frameWidth: 32, frameHeight: 32 },
  { key: "fruit-bananas", url: "/assets/items/fruits/bananas.png", frameWidth: 32, frameHeight: 32 },
  { key: "fruit-cherries", url: "/assets/items/fruits/cherries.png", frameWidth: 32, frameHeight: 32 },
  { key: "fruit-kiwi", url: "/assets/items/fruits/kiwi.png", frameWidth: 32, frameHeight: 32 },
  { key: "fruit-melon", url: "/assets/items/fruits/melon.png", frameWidth: 32, frameHeight: 32 },
  { key: "fruit-orange", url: "/assets/items/fruits/orange.png", frameWidth: 32, frameHeight: 32 },
  { key: "fruit-pineapple", url: "/assets/items/fruits/pineapple.png", frameWidth: 32, frameHeight: 32 },
  { key: "fruit-strawberry", url: "/assets/items/fruits/strawberry.png", frameWidth: 32, frameHeight: 32 },
  { key: "fruit-collected", url: "/assets/items/fruits/collected.png", frameWidth: 32, frameHeight: 32 },
  { key: "box1-hit", url: "/assets/items/box1/hit.png", frameWidth: 28, frameHeight: 24 },
  { key: "box1-break", url: "/assets/items/box1/break.png", frameWidth: 28, frameHeight: 24 },
  { key: "box2-hit", url: "/assets/items/box2/hit.png", frameWidth: 28, frameHeight: 24 },
  { key: "box2-break", url: "/assets/items/box2/break.png", frameWidth: 28, frameHeight: 24 },
  { key: "box3-hit", url: "/assets/items/box3/hit.png", frameWidth: 28, frameHeight: 24 },
  { key: "box3-break", url: "/assets/items/box3/break.png", frameWidth: 28, frameHeight: 24 },
  { key: "flag-move", url: "/assets/items/flags/start-move.png", frameWidth: 64, frameHeight: 64 },
  { key: "flag-idle", url: "/assets/items/flags/flag.png", frameWidth: 64, frameHeight: 64 },
  { key: "fx-confetti", url: "/assets/fx/confetti.png", frameWidth: 16, frameHeight: 16 },
  { key: "terrain", url: "/assets/bg/terrain.png", frameWidth: 16, frameHeight: 16 },
];

export const IMAGES: { key: string; url: string }[] = [
  { key: "bg-green", url: "/assets/bg/green.png" },
  { key: "bg-pink", url: "/assets/bg/pink.png" },
  { key: "bg-brown", url: "/assets/bg/brown.png" },
  { key: "box1-idle", url: "/assets/items/box1/idle.png" },
  { key: "box2-idle", url: "/assets/items/box2/idle.png" },
  { key: "box3-idle", url: "/assets/items/box3/idle.png" },
  { key: "plant-bullet", url: "/assets/enemies/plant/bullet.png" },
  { key: "trunk-bullet", url: "/assets/enemies/trunk/bullet.png" },
  { key: "fx-dust", url: "/assets/fx/dust.png" },
  { key: "fx-shadow", url: "/assets/fx/shadow.png" },
  { key: "trophy", url: "/assets/items/flags/trophy.png" },
  { key: "rock-hit", url: "/assets/enemies/rock/hit.png" },
  { key: "shop-dojo-belt", url: "/assets/uploads/shop/dojo-belt.png" },
];

export function heroAnim(id: HeroId, action: "idle" | "run" | "jump" | "fall" | "hit" | "spin"): string {
  return `${id}-${action}`;
}

export function registerAnims(scene: Phaser.Scene): void {
  for (const sheet of SHEETS) {
    const tex = scene.textures.get(sheet.key);
    if (!tex) continue;
    const frames = Math.max(1, Math.floor(tex.getSourceImage().width / sheet.frameWidth));
    if (scene.anims.exists(sheet.key)) continue;
    scene.anims.create({
      key: sheet.key,
      frames: scene.anims.generateFrameNumbers(sheet.key, { start: 0, end: frames - 1 }),
      frameRate: 20,
      repeat: sheet.key.includes("hit") || sheet.key.includes("break") || sheet.key.includes("appear") || sheet.key.includes("vanish") || sheet.key.includes("collected") || sheet.key.includes("attack") || sheet.key.includes("spin")
        ? 0
        : -1,
    });
  }
}
