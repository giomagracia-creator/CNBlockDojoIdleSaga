import "./style.css";
import { createGame } from "./game/createGame.ts";
import { mountShell } from "./ui/shell.ts";

async function boot(): Promise<void> {
  try {
    await document.fonts.load("16px Thaleah");
  } catch {
    /* font fallback is already stacked */
  }
  const host = document.getElementById("game");
  if (!host) throw new Error("Missing #game");
  const game = createGame(host);
  mountShell(game);
}

void boot();
