// A small driver for the installed Chrome over the DevTools protocol, with
// Node's own WebSocket client and no third-party package. Enough for the
// dashboard's browser checks: navigate, evaluate, click, key presses,
// viewport and media emulation, screenshots, and console capture. Tests skip
// when no Chrome is found.

import { type ChildProcess, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface ConsoleEntry {
  level: string;
  text: string;
}

export interface Page {
  navigate(url: string): Promise<void>;
  evaluate<T>(expression: string): Promise<T>;
  waitFor(expression: string, timeoutMs?: number): Promise<void>;
  click(selector: string): Promise<void>;
  press(key: string): Promise<void>;
  text(selector: string): Promise<string | null>;
  setViewport(width: number, height: number): Promise<void>;
  emulateMedia(features: { colorScheme?: 'light' | 'dark'; reducedMotion?: 'reduce' | 'no-preference' }): Promise<void>;
  screenshot(path: string, fullPage?: boolean): Promise<void>;
  console(): ConsoleEntry[];
  errors(): string[];
  close(): Promise<void>;
}

export interface Browser {
  page(): Promise<Page>;
  close(): Promise<void>;
}

function chromePath(): string | null {
  const env = process.env.CHROME_PATH;
  if (env && existsSync(env)) return env;
  const candidates =
    process.platform === 'win32'
      ? [
          join(process.env['ProgramFiles'] ?? 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
          join(process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
          join(process.env['LOCALAPPDATA'] ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        ]
      : process.platform === 'darwin'
        ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
        : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  return candidates.find((c) => c && existsSync(c)) ?? null;
}

class Cdp {
  private readonly ws: WebSocket;
  private nextId = 1;
  private readonly pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private readonly listeners = new Set<(method: string, params: Record<string, unknown>, sessionId: string | undefined) => void>();

  constructor(ws: WebSocket) {
    this.ws = ws;
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(String(event.data)) as { id?: number; result?: unknown; error?: { message: string }; method?: string; params?: Record<string, unknown>; sessionId?: string };
      if (msg.id !== undefined) {
        const p = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (!p) return;
        if (msg.error) p.reject(new Error(msg.error.message));
        else p.resolve(msg.result);
      } else if (msg.method) {
        for (const l of this.listeners) l(msg.method, msg.params ?? {}, msg.sessionId);
      }
    });
  }

  send<T = Record<string, unknown>>(method: string, params: Record<string, unknown> = {}, sessionId?: string): Promise<T> {
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP ${method} timed out`));
        }
      }, 20_000);
    });
  }

  on(listener: (method: string, params: Record<string, unknown>, sessionId: string | undefined) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  close(): void {
    this.ws.close();
  }
}

export async function launchChrome(): Promise<Browser | null> {
  const exe = chromePath();
  if (!exe) return null;
  const profile = mkdtempSync(join(tmpdir(), 'rstack-chrome-'));
  const child: ChildProcess = spawn(exe, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars', '--disable-extensions', '--window-size=1440,900', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
  const wsUrl = await new Promise<string>((resolve, reject) => {
    let text = '';
    const timer = setTimeout(() => reject(new Error('Chrome did not announce its DevTools endpoint')), 15_000);
    child.stderr?.on('data', (d: Buffer) => {
      text += d.toString();
      const m = /DevTools listening on (ws:\/\/\S+)/.exec(text);
      if (m) {
        clearTimeout(timer);
        resolve(m[1] as string);
      }
    });
    child.on('exit', () => {
      clearTimeout(timer);
      reject(new Error('Chrome exited before listening'));
    });
  });
  const ws = new WebSocket(wsUrl);
  await new Promise<void>((resolve, reject) => {
    ws.addEventListener('open', () => resolve(), { once: true });
    ws.addEventListener('error', () => reject(new Error('could not connect to Chrome')), { once: true });
  });
  const cdp = new Cdp(ws);

  async function page(): Promise<Page> {
    const { targetId } = await cdp.send<{ targetId: string }>('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
    const consoleEntries: ConsoleEntry[] = [];
    const errors: string[] = [];
    const off = cdp.on((method, params, sid) => {
      if (sid !== sessionId) return;
      if (method === 'Runtime.consoleAPICalled') {
        const args = (params.args as { value?: unknown; description?: string }[]) ?? [];
        consoleEntries.push({ level: String(params.type), text: args.map((a) => (a.value !== undefined ? String(a.value) : (a.description ?? ''))).join(' ') });
      }
      if (method === 'Runtime.exceptionThrown') {
        const details = params.exceptionDetails as { text?: string; exception?: { description?: string } };
        errors.push(details.exception?.description ?? details.text ?? 'exception');
      }
    });
    const evaluate = async <T>(expression: string): Promise<T> => {
      const r = await cdp.send<{ result: { value?: T; description?: string }; exceptionDetails?: { text?: string; exception?: { description?: string } } }>('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text ?? 'evaluation failed');
      return r.result.value as T;
    };
    const waitFor = async (expression: string, timeoutMs = 5000): Promise<void> => {
      const deadline = Date.now() + timeoutMs;
      for (;;) {
        if (await evaluate<boolean>(`Boolean(${expression})`)) return;
        if (Date.now() > deadline) throw new Error(`timed out waiting for: ${expression}`);
        await new Promise((r) => setTimeout(r, 60));
      }
    };
    return {
      async navigate(url) {
        const loaded = new Promise<void>((resolve) => {
          const stop = cdp.on((method, _params, sid) => {
            if (sid === sessionId && method === 'Page.loadEventFired') {
              stop();
              resolve();
            }
          });
        });
        await cdp.send('Page.navigate', { url }, sessionId);
        await Promise.race([loaded, new Promise((r) => setTimeout(r, 10_000))]);
      },
      evaluate,
      waitFor,
      async click(selector) {
        const box = await evaluate<{ x: number; y: number } | null>(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
        if (!box) throw new Error(`no element matches ${selector}`);
        for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
          await cdp.send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 }, sessionId);
        }
      },
      async press(key) {
        const keys: Record<string, { key: string; code: string; windowsVirtualKeyCode: number }> = {
          Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 },
          Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 },
          ArrowRight: { key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 },
          ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 },
          Escape: { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 },
          Space: { key: ' ', code: 'Space', windowsVirtualKeyCode: 32 },
        };
        const k = keys[key];
        if (!k) throw new Error(`unsupported key ${key}`);
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', ...k }, sessionId);
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...k }, sessionId);
      },
      text: (selector) => evaluate<string | null>(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); return el ? el.textContent : null; })()`),
      async setViewport(width, height) {
        await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);
      },
      async emulateMedia(features) {
        const list: { name: string; value: string }[] = [];
        if (features.colorScheme) list.push({ name: 'prefers-color-scheme', value: features.colorScheme });
        if (features.reducedMotion) list.push({ name: 'prefers-reduced-motion', value: features.reducedMotion });
        await cdp.send('Emulation.setEmulatedMedia', { features: list }, sessionId);
      },
      async screenshot(path, fullPage = false) {
        const params: Record<string, unknown> = { format: 'png', captureBeyondViewport: fullPage };
        if (fullPage) {
          const size = await evaluate<{ w: number; h: number }>('({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight })');
          params.clip = { x: 0, y: 0, width: size.w, height: size.h, scale: 1 };
        }
        const { data } = await cdp.send<{ data: string }>('Page.captureScreenshot', params, sessionId);
        writeFileSync(path, Buffer.from(data, 'base64'));
      },
      console: () => consoleEntries,
      errors: () => errors,
      async close() {
        off();
        await cdp.send('Target.closeTarget', { targetId }).catch(() => undefined);
      },
    };
  }

  // Closing never throws: a caller's remaining cleanup must run whatever Chrome did.
  return {
    page,
    async close() {
      try {
        await Promise.race([cdp.send('Browser.close'), new Promise((r) => setTimeout(r, 3000))]);
      } catch {
        // already closing
      }
      cdp.close();
      try {
        child.kill();
      } catch {
        // already gone
      }
      // The profile directory is released only when Chrome has exited; try for a while, then leave it.
      for (let i = 0; i < 20; i++) {
        try {
          rmSync(profile, { recursive: true, force: true });
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 250));
        }
      }
    },
  };
}
