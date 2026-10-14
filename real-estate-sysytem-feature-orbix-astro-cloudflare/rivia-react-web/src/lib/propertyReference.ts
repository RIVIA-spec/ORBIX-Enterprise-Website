import type { Property } from '../types/models';

export function getPropertyReference(property: Partial<Property> | null | undefined): string {
  if (!property) return '';
  const explicit = property.propertyCode || property.referenceId || property.listingId || property.code;
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim();
  const id = typeof property.id === 'string' ? property.id.trim() : '';
  return id ? `RIVIA-${id.slice(0, 6).toUpperCase()}` : '';
}

export function getFullPropertyId(property: Partial<Property> | null | undefined): string {
  return typeof property?.id === 'string' ? property.id : '';
}
