// Full-page screenshot via Chrome DevTools Protocol (Edge/Chromium).
// Usage: node scripts/shot.mjs <wsDebuggerUrl> <pageUrl> <outPath> [width] [height]
import { writeFileSync } from "node:fs";

const [, , wsUrl, pageUrl, outPath, w = "1440", h = "900"] = process.argv;
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
    waiters.push((m) => {
      if (m === method) {
        clearTimeout(t);
        resolve();
      }
    });
  });
}

await new Promise((res) => ws.addEventListener("open", res));

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: 2,
  mobile: false,
});
await send("Page.navigate", { url: pageUrl });
await waitFor("Page.loadEventFired").catch(() => {});
await sleep(1400); // fonts + initial paint

// Scroll through the document to trigger IntersectionObserver reveals,
// then return to the top. is-visible persists once set.
await send("Runtime.evaluate", {
  awaitPromise: true,
  expression: `(async () => {
    const H = document.body.scrollHeight;
    for (let y = 0; y <= H; y += 500) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 200));
  })()`,
});
await sleep(1500); // let stat-bar width transitions finish

const { cssContentSize } = await send("Page.getLayoutMetrics");
const fullH = Math.ceil(cssContentSize.height);
const fullW = Math.ceil(cssContentSize.width);

const { data } = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
  clip: { x: 0, y: 0, width: fullW, height: fullH, scale: 1 },
});

writeFileSync(outPath, Buffer.from(data, "base64"));
console.log(`saved ${outPath} (${fullW}x${fullH} css px)`);
ws.close();
process.exit(0);
