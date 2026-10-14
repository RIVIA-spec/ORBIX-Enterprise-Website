import { describe, expect, it } from 'vitest';
import { getOffPlanRows, getSummaryStats } from './propertyDetailsDisplay';
import { buildPropertyJsonLd, documentIdFromSlug, getPropertySeoMetadata, idFromSlug, isPropertyIndexable, propertyPath, propertySlug } from './seo';
import type { Property } from '../types/models';

describe('detail route ID resolution', () => {
  const documentId = 'fkrcoxdz3m0avfqvjgt1';

  it('reads only the final document ID from a property SEO slug', () => {
    expect(documentIdFromSlug(`rif-damascus-sale-farm-${documentId}`)).toBe(documentId);
  });

  it('reads only the final document ID from a hotel SEO slug', () => {
    expect(documentIdFromSlug(`homs-hotel-${documentId}`)).toBe(documentId);
  });

  it('keeps an id-only legacy route unchanged', () => {
    expect(idFromSlug(documentId)).toBe(documentId);
  });

  it('does not mistake a malformed slug suffix for a Firestore document ID', () => {
    expect(documentIdFromSlug('homs-rent-apartment-not-an-id')).toBe('');
    expect(idFromSlug('legacy-document-id')).toBe('legacy-document-id');
  });
});

describe('property SEO metadata', () => {
  const baseProperty = (overrides: Partial<Property> & Record<string, unknown>): Property =>
    ({
      id: 'AbCdEfGhIjKlMnOpQr12',
      title: 'Rivia Heights',
      city: 'Homs',
      property_type: 'Apartment',
      status: 'published',
      approved: true,
      isVisible: true,
      currency: 'USD',
      area: '120',
      bedrooms: '3',
      images: ['https://example.com/one.jpg'],
      ...overrides,
    }) as Property;

  it('generates sale metadata', () => {
    const metadata = getPropertySeoMetadata(baseProperty({ offerType: 'sale', salePrice: '250000' }));
    expect(metadata.title).toBe('Rivia Heights | Orbix');
    expect(metadata.description).toContain('Apartment');
    expect(metadata.description).toContain('للبيع');
    expect(metadata.description).toContain('Homs');
    expect(metadata.description).toContain('120');
    expect(metadata.description).toContain('250000 USD');
    expect(metadata.description).toContain('3 غرف نوم');
  });

  it('generates rent metadata', () => {
    const metadata = getPropertySeoMetadata(baseProperty({ offerType: 'rent', monthly_price: '900' }));
    expect(metadata.title).toBe('Rivia Heights | Orbix');
    expect(metadata.description).toContain('للإيجار');
    expect(metadata.description).toContain('900 USD');
  });

  it('generates off-plan metadata', () => {
    const metadata = getPropertySeoMetadata(baseProperty({ offerType: 'offPlan', pricing: { startingPrice: '150000', currency: 'USD' } }));
    expect(metadata.title).toBe('Rivia Heights | Orbix');
    expect(metadata.description).toContain('على المخطط');
    expect(metadata.description).toContain('بسعر يبدأ من 150000 USD');
  });

  it('marks unpublished properties as noindex candidates', () => {
    expect(isPropertyIndexable(baseProperty({ status: 'published', approved: true, isVisible: true }))).toBe(true);
    expect(isPropertyIndexable(baseProperty({ status: 'pending', approved: false, isVisible: true }))).toBe(false);
    expect(isPropertyIndexable(baseProperty({ status: 'rejected', approved: true, isVisible: true }))).toBe(false);
    expect(isPropertyIndexable(baseProperty({ status: 'published', approved: true, isVisible: false }))).toBe(false);
    expect(isPropertyIndexable(baseProperty({ status: 'deleted', approved: true, isVisible: true }))).toBe(false);
  });

  it('uses the canonical property path and preserves Firestore ID casing', () => {
    const property = baseProperty({ city: 'Homs', offerType: 'sale', property_type: 'Villa' });
    expect(propertySlug(property).endsWith('-AbCdEfGhIjKlMnOpQr12')).toBe(true);
    expect(propertyPath(property)).toBe('/property/homs-sale-villa-AbCdEfGhIjKlMnOpQr12');
  });

  it('keeps resolving the same ID after title and city edits', () => {
    const original = propertySlug(baseProperty({ city: 'Homs', offerType: 'sale', property_type: 'Villa' }));
    const edited = propertySlug(baseProperty({ title: 'Changed title', city: 'Damascus', offerType: 'sale', property_type: 'Villa' }));
    expect(idFromSlug(original)).toBe('AbCdEfGhIjKlMnOpQr12');
    expect(idFromSlug(edited)).toBe('AbCdEfGhIjKlMnOpQr12');
  });

  it('generates property JSON-LD with offer fields', () => {
    const jsonLd = buildPropertyJsonLd(baseProperty({ offerType: 'off-plan', pricing: { startingPrice: '150000', currency: 'USD' }, address: 'Main Street' }));
    expect(jsonLd['@type']).toBe('RealEstateListing');
    expect(jsonLd.name).toBe('Rivia Heights');
    expect(jsonLd.offerType).toBe('offPlan');
    expect(jsonLd.propertyType).toBe('Apartment');
    expect(jsonLd.image).toEqual(['https://example.com/one.jpg']);
    expect(jsonLd.address).toMatchObject({ addressLocality: 'Homs', streetAddress: 'Main Street' });
    expect(jsonLd.offers).toMatchObject({ startingPrice: '150000', priceCurrency: 'USD', availability: 'https://schema.org/InStock' });
  });

  it('includes off-plan project fields in JSON-LD', () => {
    const jsonLd = buildPropertyJsonLd(baseProperty({
      offerType: 'new-project',
      pricing: { startingPrice: '150000', currency: 'USD' },
      projectInfo: {
        developerName: 'RIVIA Development',
        expectedDeliveryDate: '2027-06-01',
        constructionProgress: '45',
        downPayment: '30000',
        paymentPlan: '40/60',
        projectStatus: 'Under Construction',
        numberOfBuildings: '3',
        totalUnits: '120',
      },
    }));
    expect(jsonLd).toMatchObject({
      offerType: 'offPlan',
      developerName: 'RIVIA Development',
      expectedDeliveryDate: '2027-06-01',
      constructionProgress: '45',
      downPayment: '30000',
      paymentPlan: '40/60',
      projectStatus: 'Under Construction',
      numberOfBuildings: '3',
      totalUnits: '120',
    });
  });

  it('builds off-plan visitor rows only for populated fields', () => {
    const rows = getOffPlanRows(baseProperty({
      offerType: 'offPlan',
      pricing: { startingPrice: '150000', currency: 'USD' },
      projectInfo: {
        developerName: 'RIVIA Development',
        expectedDeliveryDate: '2027-06-01',
        constructionProgress: '45',
        downPayment: '',
        paymentPlan: '40/60',
      },
    }));
    expect(rows.map((row) => row.key)).toEqual(['startingPrice', 'developerName', 'expectedDeliveryDate', 'constructionProgress', 'paymentPlan']);
  });

  it('does not render blank bedrooms or bathrooms as zero', () => {
    const stats = getSummaryStats(baseProperty({ bedrooms: '', bathrooms: '', area: '120' }));
    expect(stats.join(' ')).not.toContain('0 غرف');
    expect(stats.join(' ')).not.toContain('0 حمامات');
    expect(stats.some((item) => item.includes('120') || item.includes('١٢٠'))).toBe(true);
  });

  it('hides bedrooms and bathrooms for Project property type', () => {
    const stats = getSummaryStats(baseProperty({ property_type: 'Project', bedrooms: '3', bathrooms: '2', area: '120' }));
    expect(stats.join(' ')).not.toContain('غرف');
    expect(stats.join(' ')).not.toContain('حمامات');
    expect(stats).toContain('Project');
  });
});
