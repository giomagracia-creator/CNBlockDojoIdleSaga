import Phaser from "phaser";
import { VIEW_H, VIEW_W } from "./catalog.ts";
import { BootScene } from "./scenes/BootScene.ts";
import { DojoScene } from "./scenes/DojoScene.ts";
import { FarmScene } from "./scenes/FarmScene.ts";

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: VIEW_W,
    height: VIEW_H,
    backgroundColor: "#120c18",
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    banner: false,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      expandParent: false,
      fullscreenTarget: parent,
    },
    scene: [BootScene, FarmScene, DojoScene],
  });
}
