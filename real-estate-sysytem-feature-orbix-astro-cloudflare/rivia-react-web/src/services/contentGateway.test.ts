import { describe, expect, it } from 'vitest';
import { normalizeStrapiCollection, normalizeStrapiDocument } from './contentGateway';

describe('contentGateway', () => {
  it('normalizes a Strapi 5 flat document', () => {
    expect(normalizeStrapiDocument({ id: 1, documentId: 'doc-1', title: 'Guide', slug: 'guide' })).toEqual({
      id: 1,
      documentId: 'doc-1',
      title: 'Guide',
      slug: 'guide',
    });
  });

  it('keeps compatibility with a Strapi 4 attributes document', () => {
    expect(normalizeStrapiCollection({ data: [{ id: 2, attributes: { title: 'Service', slug: 'service' } }] })).toEqual([
      { id: 2, title: 'Service', slug: 'service' },
    ]);
  });

  it('returns an empty list for an invalid response', () => {
    expect(normalizeStrapiCollection(null)).toEqual([]);
  });
});
