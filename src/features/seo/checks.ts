import type { ChecklistResult } from '../../types';

export function runSeoChecks(doc: Document = document): ChecklistResult[] {
  const title = doc.querySelector('title')?.textContent?.trim() ?? '';
  return [
    titleCheck(title),
    metaDescriptionCheck(doc),
    h1Check(doc),
    headingsHierarchyCheck(doc),
    altCheck(doc),
    canonicalCheck(doc),
    ogCheck(doc),
    twitterCheck(doc),
    jsonLdCheck(doc),
    htmlLangCheck(doc),
  ];
}

function titleCheck(title: string): ChecklistResult {
  if (!title) {
    return { id: 'title', label: 'Title tag', status: 'fail', hint: 'Add a <title> tag.' };
  }
  if (title.length > 60) {
    return {
      id: 'title',
      label: 'Title length',
      status: 'warn',
      value: `${title.length} chars`,
      hint: 'Keep titles under 60 characters to avoid truncation in SERPs.',
    };
  }
  return { id: 'title', label: 'Title tag', status: 'pass', value: `"${title}" (${title.length})` };
}

function metaDescriptionCheck(doc: Document): ChecklistResult {
  const meta = doc.querySelector<HTMLMetaElement>('meta[name="description"]');
  const content = meta?.content?.trim() ?? '';
  if (!content) {
    return {
      id: 'description',
      label: 'Meta description',
      status: 'fail',
      hint: 'Add <meta name="description" content="..."> in <head>.',
    };
  }
  if (content.length > 160) {
    return {
      id: 'description',
      label: 'Description length',
      status: 'warn',
      value: `${content.length} chars`,
      hint: 'Keep description under 160 characters.',
    };
  }
  return {
    id: 'description',
    label: 'Meta description',
    status: 'pass',
    value: `${content.length} chars`,
  };
}

function h1Check(doc: Document): ChecklistResult {
  const h1s = doc.querySelectorAll('h1');
  if (h1s.length === 0) {
    return { id: 'h1', label: 'H1 tag', status: 'fail', hint: 'Every page should have one <h1>.' };
  }
  if (h1s.length > 1) {
    return {
      id: 'h1',
      label: 'Multiple H1s',
      status: 'warn',
      value: `${h1s.length} H1 tags`,
      hint: 'Use a single <h1> per page for clearer hierarchy.',
    };
  }
  return {
    id: 'h1',
    label: 'H1 tag',
    status: 'pass',
    value: `"${h1s[0]?.textContent?.trim().slice(0, 80) ?? ''}"`,
  };
}

function headingsHierarchyCheck(doc: Document): ChecklistResult {
  const headings = Array.from(
    doc.querySelectorAll<HTMLHeadingElement>('h1, h2, h3, h4, h5, h6'),
  );
  let prev = 0;
  for (const h of headings) {
    const level = Number(h.tagName.charAt(1));
    if (prev !== 0 && level > prev + 1) {
      return {
        id: 'headings',
        label: 'Heading hierarchy',
        status: 'warn',
        hint: `Skipped from H${prev} to H${level}. Avoid jumping levels.`,
      };
    }
    prev = level;
  }
  return { id: 'headings', label: 'Heading hierarchy', status: 'pass' };
}

function altCheck(doc: Document): ChecklistResult {
  const imgs = Array.from(doc.querySelectorAll<HTMLImageElement>('img'));
  const missing = imgs.filter((img) => !img.hasAttribute('alt'));
  if (missing.length === 0) {
    return {
      id: 'alt',
      label: 'Image alt attributes',
      status: imgs.length === 0 ? 'info' : 'pass',
      value: `${imgs.length} images`,
    };
  }
  return {
    id: 'alt',
    label: 'Image alt attributes',
    status: 'fail',
    value: `${missing.length}/${imgs.length} missing alt`,
    hint: 'Every <img> needs alt. Use alt="" for decorative images.',
  };
}

function canonicalCheck(doc: Document): ChecklistResult {
  const link = doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    return {
      id: 'canonical',
      label: 'Canonical URL',
      status: 'warn',
      hint: 'Add <link rel="canonical" href="..."> to prevent duplicate content.',
    };
  }
  return { id: 'canonical', label: 'Canonical URL', status: 'pass', value: link.href };
}

function ogCheck(doc: Document): ChecklistResult {
  const required = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
  const missing = required.filter((k) => !doc.querySelector(`meta[property="${k}"]`));
  if (missing.length === 0) {
    return { id: 'og', label: 'Open Graph tags', status: 'pass', value: 'All present' };
  }
  return {
    id: 'og',
    label: 'Open Graph tags',
    status: missing.length >= 3 ? 'fail' : 'warn',
    value: `Missing: ${missing.join(', ')}`,
    hint: 'Required for rich previews on social platforms.',
  };
}

function twitterCheck(doc: Document): ChecklistResult {
  const required = ['twitter:card', 'twitter:title', 'twitter:image'];
  const missing = required.filter((k) => !doc.querySelector(`meta[name="${k}"]`));
  if (missing.length === 0) {
    return { id: 'twitter', label: 'Twitter Cards', status: 'pass', value: 'All present' };
  }
  return {
    id: 'twitter',
    label: 'Twitter Cards',
    status: missing.length === required.length ? 'fail' : 'warn',
    value: `Missing: ${missing.join(', ')}`,
  };
}

function jsonLdCheck(doc: Document): ChecklistResult {
  const blocks = Array.from(
    doc.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'),
  );
  if (blocks.length === 0) {
    return {
      id: 'jsonld',
      label: 'JSON-LD structured data',
      status: 'warn',
      hint: 'Add JSON-LD for rich snippets (Article, Product, FAQ, etc).',
    };
  }
  const types: string[] = [];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block.textContent ?? '{}') as { '@type'?: unknown };
      const t = parsed['@type'];
      if (typeof t === 'string') types.push(t);
      else if (Array.isArray(t)) types.push(...t.filter((x): x is string => typeof x === 'string'));
    } catch {
      return {
        id: 'jsonld',
        label: 'JSON-LD structured data',
        status: 'fail',
        hint: 'A JSON-LD block has invalid JSON.',
      };
    }
  }
  return {
    id: 'jsonld',
    label: 'JSON-LD structured data',
    status: 'pass',
    value: types.length > 0 ? types.join(', ') : `${blocks.length} block(s)`,
  };
}

function htmlLangCheck(doc: Document): ChecklistResult {
  const lang = doc.documentElement.getAttribute('lang');
  if (!lang) {
    return {
      id: 'html-lang',
      label: 'HTML lang attribute',
      status: 'warn',
      hint: 'Set <html lang="..."> for accessibility and SEO.',
    };
  }
  return { id: 'html-lang', label: 'HTML lang attribute', status: 'pass', value: lang };
}
