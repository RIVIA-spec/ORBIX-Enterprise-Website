import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PropertyMap } from '../../components/map/PropertyMap';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { Select } from '../../components/ui/Select';
import {
  AREA_RANGE_OPTIONS,
  BATHROOM_OPTIONS,
  BEDROOM_OPTIONS,
  CATEGORY_OPTIONS,
  COUNTRY_OPTIONS,
  FEATURED_FILTER_OPTIONS,
  FEATURE_OPTIONS,
  LISTING_TYPE_OPTIONS,
  PRICE_RANGE_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  getCitiesByCountry,
  isDefaultFilterValue,
  mapAreaRangeToFilter,
  mapPriceRangeToFilter,
} from '../../lib/propertyOptions';
import { formatNumber, getLocationLabel, getPropertyPrice, imageFromList } from '../../lib/formatters';
import { extractPropertyCoordinates, getMapCenter } from '../../services/mapService';
import { filterProperties, getVisibleProperties, type PropertyFilters } from '../../services/propertyService';
import type { Property } from '../../types/models';

type DrawerFilters = PropertyFilters & {
  priceRange?: string;
  areaRange?: string;
};

const defaultFilters: DrawerFilters = {
  text: '',
  country: '',
  countryCode: '',
  city: '',
  listingType: '',
  type: '',
  property_type: '',
  category: '',
  priceRange: '',
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
  bathrooms: '',
  areaRange: '',
  minArea: '',
  maxArea: '',
  status: '',
  featured: '',
  features: [],
};

function countActiveFilters(filters: DrawerFilters) {
  return Object.entries(filters).filter(([key, value]) => {
    if (key === 'text') return false;
    if (Array.isArray(value)) return value.length > 0;
    return !isDefaultFilterValue(value);
  }).length;
}

function toFilterPayload(filters: DrawerFilters): PropertyFilters {
  const { priceRange: _priceRange, areaRange: _areaRange, ...payload } = filters;
  return payload;
}

function optionItems(values: string[], defaultLabel: string) {
  return [{ value: '', label: defaultLabel }, ...values.map((value) => ({ value, label: value }))];
}

export function PropertyMapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DrawerFilters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<DrawerFilters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(searchParams.get('property') || undefined);
  const mapKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getVisibleProperties(120)
      .then((items) => {
        if (active) setProperties(items);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'تعذر تحميل العقارات للعرض على الخريطة.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const appliedFilters = useMemo(() => toFilterPayload(filters), [filters]);
  const filtered = useMemo(() => filterProperties(properties, appliedFilters), [appliedFilters, properties]);
  const selectedProperty = useMemo(() => filtered.find((property) => property.id === selectedId) || null, [filtered, selectedId]);
  const mapCenter = useMemo(() => getMapCenter(filtered), [filtered]);
  const selectedCoordinates = selectedProperty ? extractPropertyCoordinates(selectedProperty) : null;
  const activeFiltersCount = useMemo(() => countActiveFilters(filters), [filters]);
  const drawerCities = useMemo(() => getCitiesByCountry(draftFilters.countryCode || draftFilters.country), [draftFilters.country, draftFilters.countryCode]);

  useEffect(() => {
    if (!selectedId) return;
    if (filtered.some((property) => property.id === selectedId)) return;
    setSelectedId(undefined);
    setSearchParams((current) => {
      current.delete('property');
      return current;
    });
  }, [filtered, selectedId, setSearchParams]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeFilters();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filtersOpen]);

  const handleSelectProperty = useCallback(
    (propertyId: string) => {
      setSelectedId(propertyId);
      setSearchParams((current) => {
        current.set('property', propertyId);
        return current;
      });
    },
    [setSearchParams],
  );

  const updateSearch = (value: string) => {
    setFilters((current) => ({ ...current, text: value }));
    setDraftFilters((current) => ({ ...current, text: value }));
  };

  const updateDraft = (field: keyof DrawerFilters, value: string) => {
    setDraftFilters((current) => ({ ...current, [field]: value }));
  };

  const updateCountry = (countryCode: string) => {
    const country = COUNTRY_OPTIONS.find((item) => item.code === countryCode);
    setDraftFilters((current) => {
      const nextCities = getCitiesByCountry(countryCode);
      return {
        ...current,
        country: country?.name || '',
        countryCode,
        city: nextCities.includes(current.city || '') ? current.city : '',
      };
    });
  };

  const updatePriceRange = (rangeKey: string) => {
    setDraftFilters((current) => ({ ...current, priceRange: rangeKey, ...mapPriceRangeToFilter(rangeKey) }));
  };

  const updateAreaRange = (rangeKey: string) => {
    setDraftFilters((current) => ({ ...current, areaRange: rangeKey, ...mapAreaRangeToFilter(rangeKey) }));
  };

  const toggleFeature = (feature: string) => {
    setDraftFilters((current) => {
      const features = current.features || [];
      return {
        ...current,
        features: features.includes(feature) ? features.filter((item) => item !== feature) : [...features, feature],
      };
    });
  };

  const openFilters = () => {
    setDraftFilters(filters);
    setFiltersOpen(true);
  };

  const closeFilters = () => setFiltersOpen(false);

  const applyFilters = () => {
    setFilters(draftFilters);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setDraftFilters(defaultFilters);
  };

  return (
    <section className="container section map-page">
      <div className="page-heading compact map-page-heading">
        <span className="eyebrow">الخريطة</span>
        <h1>استكشف العقارات على الخريطة</h1>
        <p>استكشف العقارات على الخريطة واختر الموقع الأنسب لك بسهولة.</p>
      </div>

      <div className="properties-filter-toolbar map-filter-toolbar">
        <div className="properties-search">
          <Input label="بحث" value={filters.text || ''} onChange={(event) => updateSearch(event.target.value)} placeholder="المدينة، العنوان، النوع..." />
        </div>
        <div className="properties-filter-actions">
          <Button type="button" variant={activeFiltersCount > 0 ? 'primary' : 'outline'} onClick={openFilters} className="filter-toggle-button">
            {activeFiltersCount > 0 ? `الفلاتر (${activeFiltersCount})` : 'الفلاتر'}
          </Button>
          {activeFiltersCount > 0 && <Button type="button" variant="ghost" onClick={resetFilters}>إعادة ضبط</Button>}
          <span className="results-count">{filtered.length} عقارات</span>
          <Button as={Link} to="/properties" variant="ghost">العودة إلى القائمة</Button>
        </div>
      </div>

      {filtersOpen && (
        <div className="filter-drawer-layer" role="presentation">
          <button type="button" className="filter-drawer-overlay" aria-label="إغلاق الفلاتر" onClick={closeFilters} />
          <aside className="filter-drawer" aria-label="فلاتر عقارات الخريطة">
            <div className="filter-drawer-header">
              <div>
                <h2>الفلاتر</h2>
                <p>اختر القيم ثم طبق الفلاتر لتحديث الخريطة والقائمة.</p>
              </div>
              <button type="button" className="filter-drawer-close" aria-label="إغلاق الفلاتر" onClick={closeFilters}>×</button>
            </div>

            <div className="filter-drawer-body">
              <FilterGroup title="الموقع">
                <Select label="الدولة" value={draftFilters.countryCode || ''} onChange={(event) => updateCountry(event.target.value)} options={[{ value: '', label: 'كل الدول' }, ...COUNTRY_OPTIONS.map((country) => ({ value: country.code, label: `${country.flag} ${country.name}` }))]} />
                <Select label="المدينة" value={draftFilters.city || ''} onChange={(event) => updateDraft('city', event.target.value)} options={optionItems(drawerCities, 'كل المدن')} />
              </FilterGroup>

              <FilterGroup title="نوع العقار">
                <ChipGroup options={LISTING_TYPE_OPTIONS} value={draftFilters.listingType || ''} onChange={(value) => updateDraft('listingType', value)} />
                <Select label="نوع العقار" value={draftFilters.type || ''} onChange={(event) => updateDraft('type', event.target.value)} options={optionItems(PROPERTY_TYPE_OPTIONS, 'كل الأنواع')} />
                <Select label="التصنيف" value={draftFilters.category || ''} onChange={(event) => updateDraft('category', event.target.value)} options={optionItems(CATEGORY_OPTIONS, 'كل التصنيفات')} />
              </FilterGroup>

              <FilterGroup title="السعر والمساحة">
                <Select label="نطاق السعر" value={draftFilters.priceRange || ''} onChange={(event) => updatePriceRange(event.target.value)} options={[{ value: '', label: 'كل الأسعار' }, ...PRICE_RANGE_OPTIONS.map((range) => ({ value: range.key, label: range.label }))]} />
                <Select label="نطاق المساحة" value={draftFilters.areaRange || ''} onChange={(event) => updateAreaRange(event.target.value)} options={[{ value: '', label: 'كل المساحات' }, ...AREA_RANGE_OPTIONS.map((range) => ({ value: range.key, label: range.label }))]} />
              </FilterGroup>

              <FilterGroup title="الغرف والحمامات">
                <ChipGroup options={BEDROOM_OPTIONS} value={draftFilters.bedrooms || ''} onChange={(value) => updateDraft('bedrooms', value)} />
                <ChipGroup options={BATHROOM_OPTIONS} value={draftFilters.bathrooms || ''} onChange={(value) => updateDraft('bathrooms', value)} />
              </FilterGroup>

              <FilterGroup title="الميزات">
                <div className="filter-chip-grid">
                  {FEATURE_OPTIONS.map((feature) => (
                    <button key={feature} type="button" className={`filter-chip ${(draftFilters.features || []).includes(feature) ? 'active' : ''}`} onClick={() => toggleFeature(feature)}>
                      {feature}
                    </button>
                  ))}
                </div>
              </FilterGroup>

              <FilterGroup title="الظهور">
                <Select label="مميز" value={draftFilters.featured || ''} onChange={(event) => updateDraft('featured', event.target.value)} options={FEATURED_FILTER_OPTIONS} />
              </FilterGroup>
            </div>

            <div className="filter-drawer-footer">
              <Button type="button" onClick={applyFilters} fullWidth>تطبيق الفلاتر</Button>
              <Button type="button" variant="outline" onClick={resetFilters} fullWidth>إعادة ضبط</Button>
            </div>
          </aside>
        </div>
      )}

      {loading && <LoadingState label="جار تحميل العقارات على الخريطة..." />}
      {error && <EmptyState title="تعذر تحميل الخريطة" description={error} />}

      {!loading && !error && (
        <>
          {filtered.length === 0 && (
            <EmptyState title="لا توجد عقارات مطابقة للفلاتر الحالية." description="يمكنك إعادة ضبط الفلاتر لعرض كل العقارات المتاحة." actionLabel="إعادة ضبط الفلاتر" onAction={resetFilters} />
          )}

          <div className="map-page-layout">
            <div className="map-stage">
              <PropertyMap apiKey={mapKey} properties={filtered} selectedPropertyId={selectedProperty?.id} onSelectProperty={handleSelectProperty} />
            </div>

            <aside className="map-side-panel" aria-label="العقارات على الخريطة">
              <div className="map-side-header">
                <div>
                  <h2>العقارات على الخريطة</h2>
                  <p>{filtered.length} عقارات</p>
                </div>
                {selectedCoordinates ? (
                  <span className="map-coordinate-chip">{selectedCoordinates.lat.toFixed(2)} , {selectedCoordinates.lng.toFixed(2)}</span>
                ) : mapCenter ? (
                  <span className="map-coordinate-chip">{mapCenter.lat.toFixed(2)} , {mapCenter.lng.toFixed(2)}</span>
                ) : null}
              </div>

              <SelectedMapPreview property={selectedProperty} />

              <div className="map-results-list">
                <div className="map-results-heading">
                  <strong>قائمة النتائج</strong>
                  <span className="muted">اختر عقارا لتوسيط الخريطة عليه</span>
                </div>
                <div className="map-results-stack">
                  {filtered.slice(0, 30).map((property) => (
                    <MapResultRow
                      key={property.id}
                      property={property}
                      selected={selectedProperty?.id === property.id}
                      onClick={() => handleSelectProperty(property.id)}
                    />
                  ))}
                  {filtered.length === 0 && <p className="muted">لا توجد عقارات مطابقة للفلاتر الحالية.</p>}
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}

function SelectedMapPreview({ property }: { property: Property | null }) {
  if (!property) {
    return (
      <div className="map-selected-preview empty">
        <p>اختر عقارا على الخريطة لعرض التفاصيل.</p>
      </div>
    );
  }

  const image = imageFromList(property.mainImage || property.imageUrl, property.images);
  const title = property.title || property.name || 'عقار بدون عنوان';
  const location = getLocationLabel(property) || 'موقع غير محدد';
  const price = getPropertyPrice(property) || 'السعر غير محدد';

  return (
    <article className="map-selected-preview">
      <div className="map-selected-thumb">
        {image ? <img src={image} alt={title} /> : <span>Orbix</span>}
      </div>
      <div className="map-selected-content">
        <span className="eyebrow">{property.category || property.property_category_title || property.propertyType || property.property_type || 'عقار'}</span>
        <h3>{title}</h3>
        <p>{location}</p>
        <strong>{price}</strong>
        <div className="map-selected-specs">
          {property.bedrooms != null && <span>{formatNumber(property.bedrooms)} غرف</span>}
          {property.bathrooms != null && <span>{formatNumber(property.bathrooms)} حمامات</span>}
          {property.area != null && <span>{formatNumber(property.area)} م²</span>}
        </div>
        <Button as={Link} to={`/properties/${property.id}`} variant="outline" className="map-detail-button">
          عرض التفاصيل
        </Button>
      </div>
    </article>
  );
}

function MapResultRow({ property, selected, onClick }: { property: Property; selected: boolean; onClick: () => void }) {
  const image = imageFromList(property.mainImage || property.imageUrl, property.images);
  const title = property.title || property.name || 'عقار بدون عنوان';
  const price = getPropertyPrice(property);

  return (
    <button type="button" className={`map-result-row ${selected ? 'is-selected' : ''}`} onClick={onClick}>
      <span className="map-result-thumb">{image ? <img src={image} alt="" /> : <b>Orbix</b>}</span>
      <span className="map-result-copy">
        <strong>{title}</strong>
        <small>{property.city || property.address || 'بدون موقع'}</small>
      </span>
      {price && <span className="map-result-price">{price}</span>}
    </button>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="filter-group">
      <h3>{title}</h3>
      <div className="filter-group-fields">{children}</div>
    </section>
  );
}

function ChipGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="filter-chip-row">
      {options.map((option) => (
        <button key={option} type="button" className={`filter-chip ${value === option ? 'active' : ''}`} onClick={() => onChange(value === option ? '' : option)}>
          {option}
        </button>
      ))}
    </div>
  );
}
