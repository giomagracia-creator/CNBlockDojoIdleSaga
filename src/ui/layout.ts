const ASPECT = 16 / 9;

/** Lock a computer/TV 16:9 stage. Never collapse into a phone strip. */
export function fitComputerFrame(game?: { scale: { refresh: () => void } }): void {
  const frame = document.getElementById("frame");
  if (!frame) return;

  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const landscape = vw >= vh;

  let width: number;
  let height: number;
  if (landscape) {
    width = vw;
    height = Math.round(width / ASPECT);
    if (height > vh) {
      height = vh;
      width = Math.round(height * ASPECT);
    }
  } else {
    width = vw;
    height = vh;
  }

  frame.style.width = `${width}px`;
  frame.style.height = `${height}px`;
  game?.scale.refresh();
}
