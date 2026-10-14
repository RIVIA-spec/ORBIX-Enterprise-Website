import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PropertyCard } from '../../components/cards/PropertyCard';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { Select } from '../../components/ui/Select';
import { useFavorites } from '../../hooks/useFavorites';
import { useProperties } from '../../hooks/useProperties';
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
  STATUS_OPTIONS,
  getCitiesByCountry,
  isDefaultFilterValue,
  mapAreaRangeToFilter,
  mapPriceRangeToFilter,
} from '../../lib/propertyOptions';
import { filterProperties, isActiveFeaturedProperty, isHotelFilterSelected, type PropertyFilters } from '../../services/propertyService';

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
  visibility: '',
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

export function PropertiesPage() {
  const [filters, setFilters] = useState<DrawerFilters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<DrawerFilters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { properties, diagnostics, loading, error } = useProperties(96);
  const { favoriteSet, toggle } = useFavorites();

  const appliedFilters = useMemo(() => toFilterPayload(filters), [filters]);
  const filtered = useMemo(() => filterProperties(properties, appliedFilters), [appliedFilters, properties]);
  const featuredCount = useMemo(() => properties.filter(isActiveFeaturedProperty).length, [properties]);
  const hotelFilterSelected = isHotelFilterSelected(appliedFilters);
  const featuredOnlySelected = filters.featured === 'featuredOnly' || filters.featured === 'true';
  const activeFiltersCount = useMemo(() => countActiveFilters(filters), [filters]);
  const drawerCities = useMemo(() => getCitiesByCountry(draftFilters.countryCode || draftFilters.country), [draftFilters.country, draftFilters.countryCode]);

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

  useEffect(() => {
    if (!filtersOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeFilters();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filtersOpen]);

  return (
    <section className="container section">
      <div className="page-heading">
        <span className="eyebrow">العقارات</span>
        <h1>تصفح العقارات المتاحة</h1>
        <p>تصفح العقارات المتاحة بسهولة وابحث حسب المدينة أو النوع أو السعر.</p>
        <div className="hero-actions">
          <Button as={Link} to="/map" variant="secondary">عرض الخريطة</Button>
        </div>
      </div>

      <div className="properties-filter-toolbar">
        <div className="properties-search">
          <Input label="بحث" value={filters.text || ''} onChange={(event) => updateSearch(event.target.value)} placeholder="العنوان، المنطقة، كلمة مفتاحية..." />
        </div>
        <div className="properties-filter-actions">
          <Button type="button" variant={activeFiltersCount > 0 ? 'primary' : 'outline'} onClick={openFilters} className="filter-toggle-button">
            {activeFiltersCount > 0 ? `الفلاتر (${activeFiltersCount})` : 'الفلاتر'}
          </Button>
          {activeFiltersCount > 0 && <Button type="button" variant="ghost" onClick={resetFilters}>إعادة ضبط</Button>}
          <span className="results-count">{filtered.length} عقارات</span>
        </div>
      </div>

      {filtersOpen && (
        <div className="filter-drawer-layer" role="presentation">
          <button type="button" className="filter-drawer-overlay" aria-label="إغلاق الفلاتر" onClick={closeFilters} />
          <aside className="filter-drawer" aria-label="فلاتر العقارات">
            <div className="filter-drawer-header">
              <div>
                <h2>الفلاتر</h2>
                <p>اختر القيم من القوائم لتصفية النتائج.</p>
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
                <Select label="الحالة" value={draftFilters.status || ''} onChange={(event) => updateDraft('status', event.target.value)} options={optionItems(STATUS_OPTIONS, 'كل الحالات')} />
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

      {import.meta.env.DEV && import.meta.env.VITE_SHOW_DEBUG_COUNTS === 'true' && (
        <div className="notice">
          loadedPropertiesCount: {diagnostics?.loadedCount ?? properties.length} · visiblePropertiesCount: {diagnostics?.visibleCount ?? properties.length} · featuredPropertiesCount: {featuredCount} · filteredPropertiesCount: {filtered.length}
        </div>
      )}
      {loading && <LoadingState label="جاري تحميل العقارات" />}
      {error && <EmptyState title="تعذر تحميل العقارات" description={String(error).includes('permission-denied') ? 'لا يمكنك عرض العقارات حاليًا. يرجى المحاولة لاحقًا أو التواصل مع الدعم.' : error} />}
      {!loading && !error && filtered.length === 0 && (
        <>
          <EmptyState
            title={hotelFilterSelected ? 'الفنادق متاحة في قسم الفنادق.' : featuredOnlySelected ? 'لا توجد عقارات مميزة حاليا.' : properties.length === 0 ? 'لا توجد عقارات متاحة حاليًا.' : 'لا توجد نتائج مطابقة للبحث الحالي.'}
            description={properties.length === 0 ? diagnostics?.propertyRequestsNote || 'لا توجد عقارات متاحة حاليًا. يمكنك العودة لاحقًا أو تعديل خيارات البحث.' : 'يمكنك إعادة ضبط الفلاتر لعرض العقارات المتاحة.'}
          />
          <div className="inline-actions">
            {hotelFilterSelected ? <Button as={Link} to="/hotels" variant="outline">عرض الفنادق</Button> : <Button type="button" variant="outline" onClick={resetFilters}>إعادة ضبط الفلاتر</Button>}
          </div>
        </>
      )}

      <div className="cards-grid">
        {filtered.map((property) => (
          <PropertyCard key={property.id} property={property} isFavorite={favoriteSet.has(property.id)} onToggleFavorite={toggle} />
        ))}
      </div>
    </section>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
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
