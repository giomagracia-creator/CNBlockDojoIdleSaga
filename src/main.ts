import "./style.css";
import { createGame } from "./game/createGame.ts";
import { mountIframeGate } from "./game/iframeGate.ts";
import { fitComputerFrame } from "./ui/layout.ts";
import { mountShell } from "./ui/shell.ts";

async function boot(): Promise<void> {
  try {
    await document.fonts.load("16px Thaleah");
  } catch {
    /* font fallback is already stacked */
  }
  if (mountIframeGate()) return;
  fitComputerFrame();
  const host = document.getElementById("game");
  if (!host) throw new Error("Missing #game");
  const game = createGame(host);
  mountShell(game);
}

void boot();
