// Screenshot a single section (by #id) at a given viewport via CDP.
// Usage: node scripts/shot-section.mjs <wsUrl> <pageUrl> <sectionId> <outPath> [width] [height] [mobile]
import { writeFileSync } from "node:fs";

const [, , wsUrl, pageUrl, sectionId, outPath, w = "1440", h = "900", mobile = "false"] =
  process.argv;
const width = Number(w);
const height = Number(h);

const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();
const events = [];
const waiters = [];

ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id != null && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  } else if (msg.method) {
    events.push(msg.method);
    for (const wt of waiters.splice(0)) wt(msg.method);
  }
});
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function waitFor(method, timeout = 8000) {
  if (events.includes(method)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout " + method)), timeout);
    waiters.push((m) => m === method && (clearTimeout(t), resolve()));
  });
}

await new Promise((res) => ws.addEventListener("open", res));
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: 2,
  mobile: mobile === "true",
});
await send("Page.navigate", { url: pageUrl });
await waitFor("Page.loadEventFired").catch(() => {});
await sleep(1400);

// Scroll the whole doc to fire reveals, then settle on the section top.
const { result } = await send("Runtime.evaluate", {
  awaitPromise: true,
  returnByValue: true,
  expression: `(async () => {
    const H = document.body.scrollHeight;
    for (let y = 0; y <= H; y += 400) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 90));
    }
    const el = document.getElementById(${JSON.stringify(sectionId)});
    const top = el ? el.getBoundingClientRect().top + window.scrollY : 0;
    const height = el ? el.scrollHeight : document.body.scrollHeight;
    window.scrollTo(0, top);
    await new Promise(r => setTimeout(r, 300));
    return { top, height };
  })()`,
});
await sleep(1600); // stat-bar transitions

const { top, height: secH } = result.value;
const { data } = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
  clip: { x: 0, y: top, width, height: Math.ceil(secH), scale: 1 },
});
writeFileSync(outPath, Buffer.from(data, "base64"));
console.log(`saved ${outPath} (${width}x${Math.ceil(secH)} css px, top=${Math.round(top)})`);
ws.close();
process.exit(0);
