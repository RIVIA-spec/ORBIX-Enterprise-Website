import { useMemo, useState } from 'react';
import { LocationPicker } from '../../components/map/LocationPicker';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DetailsDrawer } from '../../components/ui/DetailsDrawer';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { usePropertyRequests } from '../../hooks/usePropertyRequests';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { formatDate, imageFromList } from '../../lib/formatters';
import { extractPropertyCoordinates } from '../../services/mapService';
import { approvePropertyRequest, rejectPropertyRequest } from '../../services/propertyRequestService';
import { extractTourScenes } from '../../services/tourService';
import type { PropertyRequest } from '../../types/models';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export function PendingPropertiesPage() {
  const { user } = useAuth();
  const { requests, loading, error, reload } = usePropertyRequests();
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PropertyRequest | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [approveAsFeatured, setApproveAsFeatured] = useState(false);
  const [featuredDays, setFeaturedDays] = useState('');
  const [featuredOrder, setFeaturedOrder] = useState('');
  const [featuredNote, setFeaturedNote] = useState('');

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus = status === 'all' || request.status === status;
      const source = [request.title, request.city, request.ownerId, request.contact_name, request.contact_number]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesStatus && (!needle || source.includes(needle));
    });
  }, [requests, search, status]);

  const resetFeaturedControls = () => {
    setApproveAsFeatured(false);
    setFeaturedDays('');
    setFeaturedOrder('');
    setFeaturedNote('');
  };

  const approve = async (request: PropertyRequest, useFeaturedOptions = false) => {
    if (!user) return;
    setActionError(null);
    try {
      await approvePropertyRequest(request, user.uid, {
        featured: useFeaturedOptions && approveAsFeatured,
        featuredDays: useFeaturedOptions ? featuredDays : '',
        featuredOrder: useFeaturedOptions ? featuredOrder : '',
        featuredNote: useFeaturedOptions ? featuredNote : '',
      });
      await reload();
      setSelected(null);
      resetFeaturedControls();
    } catch (err) {
      setActionError(getFirebaseErrorMessage(err, 'تعذر تنفيذ العملية بسبب صلاحيات قاعدة البيانات.'));
    }
  };

  const reject = async (request: PropertyRequest) => {
    if (!user) return;
    const reason = window.prompt('سبب الرفض') || '';
    if (!reason.trim()) return;
    setActionError(null);
    try {
      await rejectPropertyRequest(request.id, user.uid, reason);
      await reload();
      setSelected(null);
      resetFeaturedControls();
    } catch (err) {
      setActionError(getFirebaseErrorMessage(err, 'تعذر تنفيذ العملية بسبب صلاحيات قاعدة البيانات.'));
    }
  };

  if (loading) return <LoadingState label="جاري تحميل طلبات العقارات" />;

  const selectedScenes = selected ? extractTourScenes(selected.panorama_tour) : [];
  const selectedCoordinates = selected ? extractPropertyCoordinates(selected) : null;

  return (
    <div>
      <div className="page-heading compact">
        <h1>إدارة طلبات العقارات</h1>
        <p>فلترة ومراجعة وقبول أو رفض طلبات النشر.</p>
      </div>

      {(error || actionError) && <EmptyState title="تعذر تنفيذ العملية" description={error || actionError || undefined} />}

      <div className="filter-bar">
        <Input label="بحث" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="العنوان، المدينة، المالك..." />
        <Select
          label="الحالة"
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          options={[
            { value: 'pending', label: 'معلقة' },
            { value: 'approved', label: 'مقبولة' },
            { value: 'rejected', label: 'مرفوضة' },
            { value: 'all', label: 'الكل' },
          ]}
        />
      </div>

      <div className="stack-list">
        {filtered.map((request) => {
          const sceneCount = extractTourScenes(request.panorama_tour).length;
          return (
            <Card key={request.id} className="list-card">
              <img src={imageFromList(request.mainImage, request.images)} alt="" />
              <div>
                <h3>{request.title || 'طلب عقار'}</h3>
                <p>{request.city || 'مدينة غير محددة'} · {request.contact_name || request.ownerId || 'مالك غير محدد'}</p>
                <p className="muted">{formatDate(request.created_at || request.createdAt)}</p>
                <p className="muted">{sceneCount > 0 ? `الجولة الافتراضية: ${sceneCount} مشاهد` : 'لا توجد جولة افتراضية مرفقة.'}</p>
              </div>
              <StatusBadge status={request.status || 'pending'} />
              <div className="inline-actions">
                <Button variant="outline" onClick={() => setSelected(request)}>التفاصيل</Button>
                {request.status === 'pending' && <Button variant="outline" onClick={() => approve(request)}>قبول</Button>}
                {request.status === 'pending' && <Button variant="danger" onClick={() => reject(request)}>رفض</Button>}
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && !error && <EmptyState title="لا توجد طلبات مطابقة" />}
      </div>

      <DetailsDrawer
        open={Boolean(selected)}
        title="تفاصيل طلب العقار"
        onClose={() => {
          setSelected(null);
          resetFeaturedControls();
        }}
      >
        {selected && (
          <>
            <div className="mini-gallery">
              {[selected.mainImage, ...(selected.images || [])].filter(Boolean).map((image) => (
                <img key={image} src={image} alt="" />
              ))}
            </div>

            <section className="request-location-review">
              <h3>موقع العقار على الخريطة</h3>
              {selectedCoordinates ? (
                <>
                  <p className="selected-coordinate-chip">
                    الإحداثيات المحددة: {selectedCoordinates.lat.toFixed(6)} ، {selectedCoordinates.lng.toFixed(6)}
                  </p>
                  <LocationPicker
                    readOnly
                    height={240}
                    value={{
                      latitude: selectedCoordinates.lat,
                      longitude: selectedCoordinates.lng,
                      lat: selectedCoordinates.lat,
                      lng: selectedCoordinates.lng,
                      address: selected.address,
                      city: selected.city,
                      country: selected.country,
                      countryCode: selected.countryCode,
                    }}
                    onChange={() => undefined}
                  />
                </>
              ) : (
                <div className="notice">لم يقم المستخدم بتحديد موقع العقار على الخريطة.</div>
              )}
            </section>

            <section className="request-tour-review">
              <h3>الجولة الافتراضية / صور 360</h3>
              {selectedScenes.length > 0 ? (
                <>
                  <p className="muted">عدد المشاهد: {selectedScenes.length}</p>
                  <div className="mini-gallery">
                    {selectedScenes.map((scene, index) => {
                      const image = scene.url || scene.path || scene.image || '';
                      return image ? <img key={`${image}-${index}`} src={image} alt={scene.name || `مشهد ${index + 1}`} /> : null;
                    })}
                  </div>
                  <div className="placeholder-list">
                    {selectedScenes.map((scene, index) => (
                      <span key={`${scene.name || scene.roomName || index}`}>{scene.roomLabel || scene.roomName || scene.name || `مشهد ${index + 1}`}</span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="notice">لا توجد جولة افتراضية مرفقة.</div>
              )}
            </section>

            <dl className="details-grid">
              {Object.entries(selected)
                .filter(([key]) => !['panorama_tour', 'panoramaTour', 'panoramaTours'].includes(key))
                .map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{Array.isArray(value) ? value.join('، ') : typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '')}</dd>
                  </div>
                ))}
            </dl>

            {selected.status === 'pending' && (
              <section className="admin-feature-form">
                <label className="feature-row">
                  <input type="checkbox" checked={approveAsFeatured} onChange={(event) => setApproveAsFeatured(event.target.checked)} />
                  <span>نشر كعقار مميز</span>
                </label>
                {approveAsFeatured && (
                  <div className="filter-bar">
                    <Input label="مدة التمييز بالأيام" type="number" value={featuredDays} onChange={(event) => setFeaturedDays(event.target.value)} />
                    <Input label="ترتيب الظهور" type="number" value={featuredOrder} onChange={(event) => setFeaturedOrder(event.target.value)} />
                    <Input label="ملاحظة التمييز" value={featuredNote} onChange={(event) => setFeaturedNote(event.target.value)} />
                  </div>
                )}
                <div className="inline-actions">
                  <Button variant="outline" onClick={() => approve(selected, true)}>قبول الطلب</Button>
                  <Button variant="danger" onClick={() => reject(selected)}>رفض الطلب</Button>
                </div>
              </section>
            )}
          </>
        )}
      </DetailsDrawer>
    </div>
  );
}
