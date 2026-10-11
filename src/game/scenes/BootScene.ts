import Phaser from "phaser";
import { IMAGES, SHEETS, registerAnims } from "../assets.ts";
import { VIEW_H, VIEW_W } from "../catalog.ts";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload(): void {
    this.add.rectangle(VIEW_W / 2, VIEW_H / 2, 120, 8, 0x2b2435);
    const fill = this.add.rectangle(VIEW_W / 2 - 58, VIEW_H / 2, 4, 4, 0xf2c14e);
    fill.setOrigin(0, 0.5);
    this.add
      .text(VIEW_W / 2, VIEW_H / 2 - 18, "BLOCK DOJO", {
        fontFamily: "Thaleah, monospace",
        fontSize: "10px",
        color: "#f4efe4",
      })
      .setOrigin(0.5);
    this.load.on("progress", (value: number) => {
      fill.width = Math.max(4, 116 * value);
    });

    for (const sheet of SHEETS) {
      this.load.spritesheet(sheet.key, sheet.url, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    }
    for (const img of IMAGES) {
      this.load.image(img.key, img.url);
    }
  }

  create(): void {
    registerAnims(this);
    this.scene.start("dojo");
  }
}
