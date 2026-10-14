import { useEffect } from 'react';
import { absoluteUrl, SITE_URL } from '../../lib/seo';

type SEOProps = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  lang?: 'ar' | 'en';
};

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, key); document.head.appendChild(element); }
  element.content = content;
}

/** Client-side head layer. Its props can be rendered directly by a future SSR implementation. */
export function SEO({ title, description, path = '/', image, type = 'website', noIndex = false, jsonLd, lang = 'ar' }: SEOProps) {
  useEffect(() => {
    const url = absoluteUrl(path);
    document.title = title;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[property="og:type"]', 'property', 'og:type', type);
    setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'Orbix');
    setMeta('meta[property="og:locale"]', 'property', 'og:locale', lang === 'ar' ? 'ar_SA' : 'en_US');
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    if (image) { setMeta('meta[property="og:image"]', 'property', 'og:image', image); setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image); }
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = url;
    setMeta('meta[name="robots"]', 'name', 'robots', noIndex ? 'noindex,nofollow' : 'index,follow');
    const scriptId = 'orbix-seo-jsonld';
    document.getElementById(scriptId)?.remove();
    if (jsonLd) { const script = document.createElement('script'); script.id = scriptId; script.type = 'application/ld+json'; script.text = JSON.stringify(jsonLd); document.head.appendChild(script); }
    return () => document.getElementById(scriptId)?.remove();
  }, [title, description, path, image, type, noIndex, jsonLd, lang]);
  return null;
}

export const organizationSchema = { '@context': 'https://schema.org', '@type': 'Organization', name: 'RIVIA', url: SITE_URL };
