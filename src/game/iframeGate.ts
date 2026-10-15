/** Direct Vercel visits stay behind the TV iframe. Local and embedded play are open. */
export function shouldGateIframe(): boolean {
  const host = location.hostname;
  const local = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  if (local) return false;

  const params = new URLSearchParams(location.search);
  if (params.has("tv") || params.has("direct")) return false;

  let embedded = false;
  try {
    embedded = window.self !== window.top;
  } catch {
    embedded = true;
  }
  if (embedded) return false;

  return host.endsWith(".vercel.app") || host === "vercel.app";
}

export function mountIframeGate(): boolean {
  if (!shouldGateIframe()) return false;
  const gate = document.getElementById("iframe-gate");
  if (gate) gate.hidden = false;
  const app = document.getElementById("app");
  if (app) app.hidden = true;
  return true;
}
