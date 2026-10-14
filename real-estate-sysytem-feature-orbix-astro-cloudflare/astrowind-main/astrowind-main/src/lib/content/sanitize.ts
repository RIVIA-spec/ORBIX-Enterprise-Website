import { parseFragment, serialize, type DefaultTreeAdapterMap } from 'parse5';

interface HtmlAttribute {
  name: string;
  value: string;
}

interface HtmlNode {
  nodeName: string;
  tagName?: string;
  attrs?: HtmlAttribute[];
  childNodes?: HtmlNode[];
}

const allowedTags = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'em',
  'figcaption',
  'figure',
  'h2',
  'h3',
  'h4',
  'hr',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
]);
const discardedTags = new Set(['embed', 'iframe', 'link', 'meta', 'object', 'script', 'style', 'template']);
const globalAttributes = new Set(['dir', 'lang', 'title']);
const tagAttributes: Record<string, Set<string>> = {
  a: new Set(['aria-label', 'href', 'rel', 'target']),
  img: new Set(['alt', 'decoding', 'height', 'loading', 'src', 'width']),
  ol: new Set(['start']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
};

const safeUrl = (value: string, image = false) => {
  const url = value.trim();
  if (!url) return false;
  if (url.startsWith('/') || url.startsWith('#')) return true;
  return image ? /^https?:\/\//i.test(url) : /^(?:https?:\/\/|mailto:|tel:)/i.test(url);
};

function cleanChildren(parent: HtmlNode) {
  if (!parent.childNodes) return;

  const cleaned: HtmlNode[] = [];
  for (const node of parent.childNodes) {
    if (!node.tagName) {
      cleaned.push(node);
      continue;
    }

    const tag = node.tagName.toLowerCase();
    if (discardedTags.has(tag)) continue;

    cleanChildren(node);
    if (!allowedTags.has(tag)) {
      cleaned.push(...(node.childNodes || []));
      continue;
    }

    const allowedAttributes = tagAttributes[tag] || new Set<string>();
    node.attrs = (node.attrs || []).filter((attribute) => {
      const name = attribute.name.toLowerCase();
      if (!globalAttributes.has(name) && !allowedAttributes.has(name)) return false;
      if (name === 'href') return safeUrl(attribute.value);
      if (name === 'src') return safeUrl(attribute.value, true);
      if (name === 'target') return attribute.value === '_blank';
      return !name.startsWith('on');
    });

    if (tag === 'a' && node.attrs.some((attribute) => attribute.name === 'target')) {
      node.attrs = node.attrs.filter((attribute) => attribute.name !== 'rel');
      node.attrs.push({ name: 'rel', value: 'noopener noreferrer' });
    }
    if (tag === 'img') {
      if (!node.attrs.some((attribute) => attribute.name === 'loading'))
        node.attrs.push({ name: 'loading', value: 'lazy' });
      if (!node.attrs.some((attribute) => attribute.name === 'decoding'))
        node.attrs.push({ name: 'decoding', value: 'async' });
    }

    cleaned.push(node);
  }
  parent.childNodes = cleaned;
}

export function sanitizeCmsHtml(html?: string): string {
  if (!html) return '';
  const fragment = parseFragment(html) as unknown as HtmlNode;
  cleanChildren(fragment);
  return serialize(fragment as unknown as DefaultTreeAdapterMap['documentFragment']);
}

export function escapeCmsText(value?: string): string {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function safeCmsUrl(value?: string, fallback = '#'): string {
  const url = String(value || '').trim();
  if (url.startsWith('/')) {
    // Keep the published app route canonical while accepting the legacy CMS slug.
    return url === '/apps' || url.startsWith('/apps/') ? `/app${url.slice('/apps'.length)}` : url;
  }
  if (url.startsWith('#')) return url;
  return /^(?:https?:\/\/|mailto:|tel:)/i.test(url) ? url : fallback;
}
