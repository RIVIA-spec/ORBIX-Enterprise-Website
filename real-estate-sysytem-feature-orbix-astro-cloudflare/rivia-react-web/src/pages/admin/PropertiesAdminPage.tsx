import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { formatDate, getLocationLabel, getPropertyPrice, imageFromList } from '../../lib/formatters';
import {
  getAdminProperties,
  isPropertyFeatured,
  markPropertyFeatured,
  removePropertyFeatured,
  type FeaturedPropertyInput,
} from '../../services/propertyService';
import type { Property } from '../../types/models';

type FeaturedFilter = 'all' | 'featured' | 'normal' | 'hidden';

const emptyFeaturedInput: FeaturedPropertyInput = {
  featuredUntil: '',
  featuredOrder: '',
  featuredPlan: '',
  featuredNote: '',
};

export function PropertiesAdminPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FeaturedFilter>('all');
  const [forms, setForms] = useState<Record<string, FeaturedPropertyInput>>({});

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      setProperties(await getAdminProperties());
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر تحميل العقارات بسبب صلاحيات قاعدة البيانات.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return properties.filter((property) => {
      const featured = isPropertyFeatured(property);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'featured' && featured) ||
        (filter === 'normal' && !featured && property.isVisible !== false) ||
        (filter === 'hidden' && property.isVisible === false);
      const source = [property.title, property.name, property.city, property.ownerId, getLocationLabel(property)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesFilter && (!needle || source.includes(needle));
    });
  }, [filter, properties, search]);

  const updateForm = (propertyId: string, field: keyof FeaturedPropertyInput, value: string) => {
    setForms((current) => ({
      ...current,
      [propertyId]: {
        ...(current[propertyId] || emptyFeaturedInput),
        [field]: value,
      },
    }));
  };

  const markFeatured = async (propertyId: string) => {
    if (!user) return;
    setSavingId(propertyId);
    setError(null);
    try {
      await markPropertyFeatured(propertyId, user.uid, forms[propertyId] || emptyFeaturedInput);
      await reload();
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر تحديث حالة التمييز بسبب صلاحيات قاعدة البيانات.'));
    } finally {
      setSavingId(null);
    }
  };

  const removeFeatured = async (propertyId: string) => {
    setSavingId(propertyId);
    setError(null);
    try {
      await removePropertyFeatured(propertyId);
      await reload();
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر تحديث حالة التمييز بسبب صلاحيات قاعدة البيانات.'));
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <LoadingState label="جاري تحميل العقارات" />;

  return (
    <div>
      <div className="page-heading compact">
        <span className="eyebrow">إدارة العقارات</span>
        <h1>العقارات المميزة والمدفوعة</h1>
        <p>تحكم يدوي بتمييز العقارات وترتيب ظهورها دون إضافة بوابة دفع حاليا.</p>
      </div>

      {error && <EmptyState title="تعذر تنفيذ العملية" description={error} />}

      <div className="filter-bar">
        <Input label="بحث" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="العنوان، المدينة، المالك..." />
        <Select
          label="الفلتر"
          value={filter}
          onChange={(event) => setFilter(event.target.value as FeaturedFilter)}
          options={[
            { value: 'all', label: 'الكل' },
            { value: 'featured', label: 'مميزة' },
            { value: 'normal', label: 'عادية' },
            { value: 'hidden', label: 'مخفية' },
          ]}
        />
      </div>

      {import.meta.env.DEV && (
        <div className="notice">
          featuredCount: {properties.filter(isPropertyFeatured).length} · normalCount: {properties.filter((property) => !isPropertyFeatured(property)).length}
        </div>
      )}

      <div className="stack-list">
        {filtered.map((property) => {
          const featured = isPropertyFeatured(property);
          const form = forms[property.id] || emptyFeaturedInput;
          return (
            <Card key={property.id} className="list-card admin-property-card">
              <img src={imageFromList(property.mainImage || property.imageUrl, property.images)} alt="" />
              <div>
                <h3>{property.title || property.name || 'عقار بدون عنوان'}</h3>
                <p>{property.city || getLocationLabel(property) || 'موقع غير محدد'} · {getPropertyPrice(property) || 'سعر غير محدد'}</p>
                <p className="muted">آخر تحديث: {formatDate(property.updatedAt || property.created_at || property.createdAt)}</p>
                <div className="inline-actions">
                  <StatusBadge status={featured ? 'إعلان مميز' : 'عادي'} tone={featured ? 'amber' : 'gray'} />
                  {property.isVisible === false && <StatusBadge status="مخفي" tone="red" />}
                  {property.promotionStatus && <StatusBadge status={property.promotionStatus} />}
                </div>
              </div>

              <div className="admin-feature-form">
                <Input label="ينتهي في" type="date" value={form.featuredUntil || ''} onChange={(event) => updateForm(property.id, 'featuredUntil', event.target.value)} />
                <Input label="ترتيب الظهور" type="number" value={form.featuredOrder || ''} onChange={(event) => updateForm(property.id, 'featuredOrder', event.target.value)} />
                <Input label="الخطة" value={form.featuredPlan || ''} onChange={(event) => updateForm(property.id, 'featuredPlan', event.target.value)} placeholder="manual / paid offline" />
                <Input label="ملاحظة" value={form.featuredNote || ''} onChange={(event) => updateForm(property.id, 'featuredNote', event.target.value)} />
                <div className="inline-actions">
                  <Button type="button" loading={savingId === property.id} onClick={() => markFeatured(property.id)}>
                    تمييز العقار
                  </Button>
                  <Button type="button" variant="outline" loading={savingId === property.id} onClick={() => removeFeatured(property.id)}>
                    إزالة التمييز
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && <EmptyState title="لا توجد عقارات مطابقة" />}
      </div>
    </div>
  );
}
