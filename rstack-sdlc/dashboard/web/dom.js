// Small DOM helpers for views that are built once and then patched in place,
// so CSS loops and running animations survive updates. Text is always set
// through textContent; nothing here parses markup.

// The SVG namespace identifier (a name, not a resource; nothing is fetched).
export const SVG_NS = 'http://www.w3.org/2000/svg';

export function setText(el, text) {
  const value = text === null || text === undefined ? '' : String(text);
  if (el.textContent !== value) el.textContent = value;
}

export function setAttr(el, name, value) {
  if (value === null || value === undefined || value === false) {
    if (el.hasAttribute(name)) el.removeAttribute(name);
    return;
  }
  const v = String(value);
  if (el.getAttribute(name) !== v) el.setAttribute(name, v);
}

export function setVar(el, name, value) {
  const v = String(value);
  if (el.style.getPropertyValue(name) !== v) el.style.setProperty(name, v);
}

export function svg(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) setAttr(el, k, v);
  return el;
}

// Reconciles `parent`'s children with `items` by key: existing children are
// updated in place and kept, new ones created, missing ones removed, and the
// order follows `items`.
export function keyed(parent, items, keyOf, create, update) {
  const existing = new Map();
  for (const child of [...parent.children]) {
    if (child.dataset && child.dataset.key !== undefined) existing.set(child.dataset.key, child);
  }
  const wanted = new Set();
  let cursor = parent.firstElementChild;
  for (const item of items) {
    const key = String(keyOf(item));
    wanted.add(key);
    let el = existing.get(key);
    if (!el) {
      el = create(item);
      el.dataset.key = key;
    }
    update(el, item);
    if (el !== cursor) parent.insertBefore(el, cursor);
    else cursor = cursor.nextElementSibling;
  }
  for (const [key, el] of existing) if (!wanted.has(key)) el.remove();
}
