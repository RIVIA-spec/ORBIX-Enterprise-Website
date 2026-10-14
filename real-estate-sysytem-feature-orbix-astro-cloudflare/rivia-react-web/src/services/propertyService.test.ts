import { describe, expect, it, vi } from 'vitest';
import type { Property } from '../types/models';

vi.mock('./firebase', () => ({ db: {} }));

import {
  filterProperties,
  isActiveFeaturedProperty,
  normalizeFilterValue,
  sortPropertiesForPublicListing,
  type PropertyFilters,
} from './propertyService';

function property(overrides: Partial<Property> & Pick<Property, 'id'>): Property {
  return {
    title: 'عقار للاختبار',
    city: 'دمشق',
    property_type: 'بيع',
    category: 'شقة',
    price: 100_000,
    bedrooms: 2,
    bathrooms: 1,
    area: 120,
    isVisible: true,
    status: 'approved',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function ids(properties: Property[]) {
  return properties.map((item) => item.id);
}

const defaultFilters: PropertyFilters = {
  text: '',
  city: '',
  type: '',
  category: '',
  status: '',
  featured: '',
  visibility: '',
};

describe('property filtering defaults', () => {
  it('keeps visible properties when filters are empty strings', () => {
    const result = filterProperties(
      [property({ id: 'one', price: 100_000 }), property({ id: 'two', price: 200_000 })],
      defaultFilters,
    );

    expect(ids(result)).toEqual(['two', 'one']);
  });

  it('treats Arabic default labels like empty filter values', () => {
    expect(normalizeFilterValue('الكل')).toBe('');
    expect(normalizeFilterValue('كل المدن')).toBe('');
    expect(normalizeFilterValue('كل الأنواع')).toBe('');
    expect(normalizeFilterValue('كل التصنيفات')).toBe('');
    expect(normalizeFilterValue('كل الحالات')).toBe('');

    const result = filterProperties(
      [property({ id: 'one' }), property({ id: 'two', city: 'حلب', category: 'فيلا' })],
      {
        city: 'كل المدن',
        type: 'كل الأنواع',
        category: 'كل التصنيفات',
        status: 'كل الحالات',
        featured: 'الكل',
        visibility: 'الكل',
      },
    );

    expect(ids(result)).toEqual(['one', 'two']);
  });

  it('does not treat empty numeric filters as zero', () => {
    const result = filterProperties(
      [property({ id: 'one', price: 100_000, bedrooms: 2, bathrooms: 1, area: 90 }), property({ id: 'two', price: 200_000, bedrooms: 3, bathrooms: 2, area: 150 })],
      {
        minPrice: '',
        maxPrice: '',
        bedrooms: '',
        bathrooms: '',
        minArea: '',
      },
    );

    expect(ids(result)).toEqual(['two', 'one']);
  });
});

describe('property numeric filters', () => {
  it('filters by minPrice and maxPrice only when valid numbers are provided', () => {
    const properties = [
      property({ id: 'cheap', price: 75_000 }),
      property({ id: 'middle', price: 125_000 }),
      property({ id: 'expensive', price: 250_000 }),
    ];

    expect(ids(filterProperties(properties, { minPrice: '100000' }))).toEqual(['middle', 'expensive']);
    expect(ids(filterProperties(properties, { maxPrice: '150000' }))).toEqual(['cheap', 'middle']);
  });

  it('filters by bedrooms only when provided', () => {
    const properties = [property({ id: 'two-bed', bedrooms: 2 }), property({ id: 'three-bed', bedrooms: 3 })];

    expect(ids(filterProperties(properties, { bedrooms: '' }))).toEqual(['two-bed', 'three-bed']);
    expect(ids(filterProperties(properties, { bedrooms: '3' }))).toEqual(['three-bed']);
  });
});

describe('featured property filters', () => {
  it('shows all readable properties by default', () => {
    const result = filterProperties(
      [property({ id: 'normal', isFeatured: false }), property({ id: 'featured', isFeatured: true, featuredUntil: '2999-01-01T00:00:00.000Z' })],
      { featured: '' },
    );

    expect(ids(result)).toEqual(['featured', 'normal']);
  });

  it('supports featuredOnly and Arabic featured-only labels', () => {
    const properties = [
      property({ id: 'normal', isFeatured: false }),
      property({ id: 'featured', isFeatured: true, featuredUntil: '2999-01-01T00:00:00.000Z' }),
      property({ id: 'expired', isFeatured: true, featuredUntil: '2000-01-01T00:00:00.000Z' }),
      property({ id: 'cancelled', isFeatured: true, promotionStatus: 'cancelled' }),
    ];

    expect(ids(filterProperties(properties, { featured: 'featuredOnly' }))).toEqual(['featured']);
    expect(ids(filterProperties(properties, { featured: 'مميز فقط' }))).toEqual(['featured']);
  });

  it('does not count expired or cancelled featured flags as active featured', () => {
    expect(isActiveFeaturedProperty(property({ id: 'active', isFeatured: true, featuredUntil: '2999-01-01T00:00:00.000Z' }))).toBe(true);
    expect(isActiveFeaturedProperty(property({ id: 'expired', isFeatured: true, featuredUntil: '2000-01-01T00:00:00.000Z' }))).toBe(false);
    expect(isActiveFeaturedProperty(property({ id: 'cancelled', isFeatured: true, promotionStatus: 'cancelled' }))).toBe(false);
  });
});

describe('visible and deleted property logic', () => {
  it('hides explicitly hidden and deleted properties', () => {
    const result = filterProperties(
      [
        property({ id: 'visible' }),
        property({ id: 'hidden', isVisible: false }),
        property({ id: 'deleted', status: 'deleted' }),
      ],
      {},
    );

    expect(ids(result)).toEqual(['visible']);
  });

  it('does not hide properties just because isVisible or status is missing', () => {
    const result = filterProperties(
      [
        property({ id: 'missing-visible', isVisible: undefined }),
        property({ id: 'missing-status', status: undefined }),
      ],
      {},
    );

    expect(ids(result)).toEqual(['missing-visible', 'missing-status']);
  });
});

describe('property field aliases', () => {
  it('matches title/name, city/location.city, type aliases, and category aliases', () => {
    const properties = [
      property({
        id: 'aliases',
        title: undefined,
        name: 'بيت في المزة',
        city: undefined,
        location: { city: 'دمشق' },
        property_type: undefined,
        propertyType: 'إيجار',
        category: undefined,
        property_category_title: 'منزل',
      }),
    ];

    expect(ids(filterProperties(properties, { text: 'المزة' }))).toEqual(['aliases']);
    expect(ids(filterProperties(properties, { city: 'دمشق' }))).toEqual(['aliases']);
    expect(ids(filterProperties(properties, { type: 'إيجار' }))).toEqual(['aliases']);
    expect(ids(filterProperties(properties, { category: 'منزل' }))).toEqual(['aliases']);
  });

  it('uses price aliases for numeric filtering', () => {
    const properties = [
      property({ id: 'daily', price: undefined, daily_price: 90 }),
      property({ id: 'nightly', price: undefined, nightly_price: 120 }),
      property({ id: 'selling', price: undefined, selling_price: 200_000 }),
      property({ id: 'rent', price: undefined, rentPrice: 500 }),
    ];

    expect(ids(filterProperties(properties, { minPrice: '100' }))).toEqual(['nightly', 'selling', 'rent']);
    expect(ids(filterProperties(properties, { maxPrice: '150' }))).toEqual(['daily', 'nightly']);
  });
});

describe('public property sorting', () => {
  it('places active featured properties before normal properties', () => {
    const result = sortPropertiesForPublicListing([
      property({ id: 'normal-newer', updatedAt: '2026-02-01T00:00:00.000Z' }),
      property({ id: 'featured-older', isFeatured: true, featuredUntil: '2999-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }),
    ]);

    expect(ids(result)).toEqual(['featured-older', 'normal-newer']);
  });

  it('orders featured properties by lower featuredOrder first', () => {
    const result = sortPropertiesForPublicListing([
      property({ id: 'order-two', isFeatured: true, featuredOrder: 2, featuredUntil: '2999-01-01T00:00:00.000Z' }),
      property({ id: 'order-one', isFeatured: true, featuredOrder: 1, featuredUntil: '2999-01-01T00:00:00.000Z' }),
    ]);

    expect(ids(result)).toEqual(['order-one', 'order-two']);
  });

  it('does not sort expired featured properties ahead of active normal properties', () => {
    const result = sortPropertiesForPublicListing([
      property({ id: 'expired-featured', isFeatured: true, featuredUntil: '2000-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }),
      property({ id: 'normal-newer', updatedAt: '2026-01-01T00:00:00.000Z' }),
    ]);

    expect(ids(result)).toEqual(['normal-newer', 'expired-featured']);
  });
});
