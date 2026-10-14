import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { PropertyFilters } from '../../services/propertyService';

type Option = { value: string; label: string };

type MapFiltersPanelProps = {
  filters: PropertyFilters;
  cityOptions: Option[];
  categoryOptions: Option[];
  onChange: (field: keyof PropertyFilters, value: string) => void;
  onReset: () => void;
};

export function MapFiltersPanel({ filters, cityOptions, categoryOptions, onChange, onReset }: MapFiltersPanelProps) {
  return (
    <div className="map-filters-panel">
      <div className="filter-bar map-filter-bar">
        <Input label="بحث" value={filters.text || ''} onChange={(event) => onChange('text', event.target.value)} placeholder="المدينة، العنوان، النوع..." />
        <Select label="المدينة" value={filters.city || ''} onChange={(event) => onChange('city', event.target.value)} options={cityOptions} />
        <Select label="النوع" value={filters.property_type || ''} onChange={(event) => onChange('property_type', event.target.value)} options={[{ value: '', label: 'كل الأنواع' }, { value: 'إيجار', label: 'إيجار' }, { value: 'بيع', label: 'بيع' }]} />
        <Select label="التصنيف" value={filters.category || ''} onChange={(event) => onChange('category', event.target.value)} options={categoryOptions} />
        <Input label="أقل سعر" value={filters.minPrice || ''} onChange={(event) => onChange('minPrice', event.target.value)} />
        <Input label="أعلى سعر" value={filters.maxPrice || ''} onChange={(event) => onChange('maxPrice', event.target.value)} />
        <Input label="غرف النوم" value={filters.bedrooms || ''} onChange={(event) => onChange('bedrooms', event.target.value)} />
        <Select label="مميز" value={filters.featured || ''} onChange={(event) => onChange('featured', event.target.value)} options={[{ value: '', label: 'الكل' }, { value: 'true', label: 'مميز فقط' }]} />
      </div>
      <div className="map-filter-actions">
        <Button type="button" variant="outline" onClick={onReset}>
          إعادة التصفية
        </Button>
      </div>
    </div>
  );
}

