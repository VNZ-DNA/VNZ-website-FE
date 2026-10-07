// Screenshot a single element (by CSS selector) via CDP.
// Usage: node scripts/shot-el.mjs <pageWsUrl> <pageUrl> <selector> <outPath> [width] [height]
import { writeFileSync } from "node:fs";
const [, , wsUrl, pageUrl, selector, outPath, w = "1440", h = "900"] = process.argv;
const width = Number(w), height = Number(h);
const ws = new WebSocket(wsUrl);
let id = 0; const pending = new Map(); const events = []; const waiters = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id != null && pending.has(m.id)) { const { resolve, reject } = pending.get(m.id); pending.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); }
  else if (m.method) { events.push(m.method); for (const wt of waiters.splice(0)) wt(m.method); }
});
const send = (method, params = {}) => new Promise((resolve, reject) => { const mid = ++id; pending.set(mid, { resolve, reject }); ws.send(JSON.stringify({ id: mid, method, params })); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = (method, t = 8000) => events.includes(method) ? Promise.resolve() : new Promise((res, rej) => { const to = setTimeout(() => rej(new Error("timeout " + method)), t); waiters.push((mm) => mm === method && (clearTimeout(to), res())); });
await new Promise((res) => ws.addEventListener("open", res));
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 2, mobile: false });
await send("Page.navigate", { url: pageUrl });
await waitFor("Page.loadEventFired").catch(() => {});
await sleep(1400);
const { result } = await send("Runtime.evaluate", {
  awaitPromise: true, returnByValue: true,
  expression: `(async () => {
    const H = document.body.scrollHeight;
    for (let y = 0; y <= H; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); }
    const el = document.querySelector(${JSON.stringify(selector)});
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY, left = r.left + window.scrollX;
    window.scrollTo(0, top - 40);
    await new Promise(r => setTimeout(r, 400));
    return { top, left, width: r.width, height: r.height };
  })()`,
});
await sleep(1600);
const r = result.value;
const { data } = await send("Page.captureScreenshot", {
  format: "png", captureBeyondViewport: true,
  clip: { x: Math.max(0, r.left - 20), y: r.top - 20, width: Math.min(width, r.width + 40), height: r.height + 40, scale: 1 },
});
writeFileSync(outPath, Buffer.from(data, "base64"));
console.log(`saved ${outPath}`);
ws.close(); process.exit(0);
