const ALLOWED_TAGS = new Set([
  'B',
  'BLOCKQUOTE',
  'BR',
  'DIV',
  'EM',
  'H2',
  'H3',
  'I',
  'IMG',
  'LI',
  'OL',
  'P',
  'SPAN',
  'STRONG',
  'U',
  'UL',
]);

function escapeAttribute(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);
}

function isSafeImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  try {
    return ['http:', 'https:'].includes(new URL(trimmed).protocol);
  } catch {
    return false;
  }
}

export function sanitizeRichText(value: string): string {
  if (typeof DOMParser === 'undefined') {
    return value.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[character] || character);
  }

  const document = new DOMParser().parseFromString(value, 'text/html');
  const cleanNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      return text.replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] || character);
    }
    if (!(node instanceof Element)) return '';

    const tag = node.tagName;
    if (!ALLOWED_TAGS.has(tag)) {
      if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'SVG', 'MATH'].includes(tag)) return '';
      return Array.from(node.childNodes, cleanNode).join('');
    }
    if (tag === 'BR') return '<br>';
    if (tag === 'IMG') {
      const src = node.getAttribute('src') || '';
      if (!isSafeImageUrl(src)) return '';
      const alt = escapeAttribute(node.getAttribute('alt') || '');
      return `<img src="${escapeAttribute(src)}" alt="${alt}" class="my-3 max-h-96 max-w-full rounded-xl object-contain">`;
    }
    const children = Array.from(node.childNodes, cleanNode).join('');
    return `<${tag.toLowerCase()}>${children}</${tag.toLowerCase()}>`;
  };

  return Array.from(document.body.childNodes, cleanNode).join('');
}

export function plainTextFromRichText(value: string): string {
  if (typeof DOMParser === 'undefined') return value.replace(/<[^>]*>/g, ' ').trim();
  const document = new DOMParser().parseFromString(sanitizeRichText(value), 'text/html');
  document.querySelectorAll('br').forEach((node) => node.replaceWith('\n'));
  document.querySelectorAll('p,div,li,blockquote,h2,h3').forEach((node) => {
    node.append('\n');
  });
  return (document.body.textContent || '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function richTextFromPlainText(value: string): string {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function includeLegacyImage(value: string, image?: string): string {
  if (!image || value.includes(image)) return value;
  const safeUrl = escapeAttribute(image);
  return `${value}<p><img src="${safeUrl}" alt="Gambar pendukung"></p>`;
}
