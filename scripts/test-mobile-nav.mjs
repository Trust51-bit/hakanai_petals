import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9223;
const userDataDir = "/private/tmp/hakanai-nav-test";
const url = "http://localhost:4173/index.html";

await rm(userDataDir, { recursive: true, force: true });

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--disable-background-networking",
  "--disable-component-update",
  "--disable-sync",
  "--disable-extensions",
  "--disable-crash-reporter",
  "--disable-breakpad",
  "--no-first-run",
  "--no-default-browser-check",
  `--user-data-dir=${userDataDir}`,
  `--remote-debugging-port=${port}`,
  "about:blank",
], { stdio: "ignore" });

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(endpoint, options = {}) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${endpoint}`, options);
      if (response.ok) return response.json();
    } catch {
      await wait(100);
    }
  }

  throw new Error(`Chrome DevTools endpoint not available: ${endpoint}`);
}

let socket;
let nextId = 1;
const pending = new Map();

function send(method, params = {}) {
  const id = nextId;
  nextId += 1;
  socket.send(JSON.stringify({ id, method, params }));

  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
  });
}

function evaluate(expression) {
  return send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  }).then((message) => message.result.result.value);
}

try {
  const pageTarget = await getJson(`/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
  const { webSocketDebuggerUrl } = pageTarget;
  socket = new WebSocket(webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);

    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message);
      return;
    }

  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  await wait(800);

  const before = await evaluate(`(() => {
    const toggle = document.querySelector("[data-nav-toggle]");
    const menu = document.querySelector("[data-nav-menu]");
    return {
      toggleDisplay: getComputedStyle(toggle).display,
      menuDisplay: getComputedStyle(menu).display,
      expanded: toggle.getAttribute("aria-expanded"),
      dataOpen: menu.dataset.open,
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      viewport: window.innerWidth
    };
  })()`);

  await evaluate(`document.querySelector("[data-nav-toggle]").click()`);
  await wait(250);

  const after = await evaluate(`(() => {
    const toggle = document.querySelector("[data-nav-toggle]");
    const menu = document.querySelector("[data-nav-menu]");
    return {
      toggleDisplay: getComputedStyle(toggle).display,
      menuDisplay: getComputedStyle(menu).display,
      expanded: toggle.getAttribute("aria-expanded"),
      dataOpen: menu.dataset.open,
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      viewport: window.innerWidth
    };
  })()`);

  console.log(JSON.stringify({ before, after }, null, 2));
} finally {
  if (socket) socket.close();
  chrome.kill("SIGTERM");
}
