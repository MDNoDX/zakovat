"use client";

// A small, dependency-free HTML sanitizer for rich-text content produced by
// the Tiptap editor (or imported from a backup file). No DOMPurify here on
// purpose — this sandbox has no npm registry access, so a hand-rolled,
// allowlist-based sanitizer is used instead. It runs client-side only (all
// call sites are "use client" components) via the browser's own HTML parser
// (a <template> element), so there's no risk of the parser itself executing
// scripts — <template> content is inert until explicitly inserted.

const ALLOWED_TAGS = new Set([
  "B", "STRONG", "I", "EM", "U", "S", "P", "BR", "SPAN",
  "UL", "OL", "LI", "A",
]);

const GLOBAL_SAFE_STYLE_PROPS: Record<string, RegExp> = {
  color: /^#[0-9a-fA-F]{3,8}$|^rgba?\([\d.,\s%]+\)$/,
  "text-align": /^(left|center|right|justify)$/,
  "font-size": /^[\d.]+(em|px|rem|%)$/,
};

const SAFE_URL = /^(https?:|mailto:)/i;

function sanitizeStyleValue(style: string): string {
  return style
    .split(";")
    .map((decl) => decl.trim())
    .filter(Boolean)
    .map((decl) => {
      const idx = decl.indexOf(":");
      if (idx === -1) return null;
      const prop = decl.slice(0, idx).trim().toLowerCase();
      const value = decl.slice(idx + 1).trim();
      const pattern = GLOBAL_SAFE_STYLE_PROPS[prop];
      if (!pattern || !pattern.test(value)) return null;
      return `${prop}: ${value}`;
    })
    .filter((v): v is string => Boolean(v))
    .join("; ");
}

function sanitizeElement(el: Element) {
  const tag = el.tagName;

  if (!ALLOWED_TAGS.has(tag)) {
    // Fully drop inherently dangerous containers (and their content);
    // everything else gets "unwrapped" — replaced by its own children —
    // so legitimate text/inline content inside an unknown wrapper survives.
    if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "svg"].includes(tag)) {
      el.remove();
      return;
    }
    const parent = el.parentNode;
    if (parent) {
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    }
    return;
  }

  // Strip every attribute except an explicit per-tag allowlist.
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    if (tag === "A" && name === "href") {
      if (!SAFE_URL.test(attr.value.trim())) el.removeAttribute(attr.name);
      continue;
    }
    if (name === "style") {
      const cleaned = sanitizeStyleValue(attr.value);
      if (cleaned) el.setAttribute("style", cleaned);
      else el.removeAttribute("style");
      continue;
    }
    el.removeAttribute(attr.name);
  }

  if (tag === "A") {
    el.setAttribute("rel", "noopener noreferrer nofollow");
    el.setAttribute("target", "_blank");
  }

  // Recurse into children (copy to array first since unwrapping mutates the tree).
  for (const child of Array.from(el.children)) {
    sanitizeElement(child);
  }
}

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  if (typeof window === "undefined" || typeof document === "undefined") {
    // Server-side render pass (shouldn't normally happen for these
    // client-only components, but fail safe with plain text if it does).
    return "";
  }
  const template = document.createElement("template");
  template.innerHTML = html;
  for (const child of Array.from(template.content.children)) {
    sanitizeElement(child);
  }
  return template.innerHTML;
}
