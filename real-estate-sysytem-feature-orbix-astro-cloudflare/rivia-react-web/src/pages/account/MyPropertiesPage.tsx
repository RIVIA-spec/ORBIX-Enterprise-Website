import { PropertyCard } from '../../components/cards/PropertyCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useMyProperties } from '../../hooks/useMyProperties';
import { formatDate, imageFromList } from '../../lib/formatters';

export function MyPropertiesPage() {
  const { properties, requests, loading, error } = useMyProperties();
  const pending = requests.filter((item) => item.status === 'pending');
  const rejected = requests.filter((item) => item.status === 'rejected');

  if (loading) return <LoadingState label="جاري تحميل عقاراتي" />;

  return (
    <div>
      <div className="page-heading compact">
        <span className="eyebrow">عقاراتي</span>
        <h1>العقارات والطلبات</h1>
        <p>إدارة العقارات التي أضفتها ومتابعة طلبات النشر والتعديل.</p>
      </div>
      {error && <EmptyState title="تعذر تحميل عقاراتي" description={error} />}

      <h2 className="subheading">العقارات المعتمدة</h2>
      {properties.length === 0 ? (
        <EmptyState title="لا توجد عقارات منشورة" />
      ) : (
        <>
          <div className="owner-promotion-note">
            <Button type="button" variant="outline" disabled>
              تمييز العقار
            </Button>
            <span className="muted">ميزة مدفوعة ستتوفر قريبا. تواصل مع الإدارة حاليا.</span>
          </div>
          <div className="cards-grid">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </>
      )}

      <h2 className="subheading">طلبات قيد المراجعة</h2>
      <div className="stack-list">
        {pending.map((request) => (
          <Card key={request.id} className="list-card">
            <img src={imageFromList(request.mainImage, request.images)} alt="" />
            <div>
              <h3>{request.title || 'طلب عقار'}</h3>
              <p>{request.city || 'مدينة غير محددة'} · {formatDate(request.created_at)}</p>
            </div>
            <StatusBadge status={request.status || 'pending'} />
            <PromotionPlaceholder />
          </Card>
        ))}
        {pending.length === 0 && <EmptyState title="لا توجد طلبات معلقة" />}
      </div>

      <h2 className="subheading">طلبات مرفوضة</h2>
      <div className="stack-list">
        {rejected.map((request) => (
          <Card key={request.id} className="list-card">
            <img src={imageFromList(request.mainImage, request.images)} alt="" />
            <div>
              <h3>{request.title || 'طلب عقار'}</h3>
              <p>{request.rejectionReason || 'لم يتم إدخال سبب الرفض'}</p>
            </div>
            <StatusBadge status="rejected" />
            <PromotionPlaceholder />
          </Card>
        ))}
        {rejected.length === 0 && <EmptyState title="لا توجد طلبات مرفوضة" />}
      </div>
    </div>
  );
}

function PromotionPlaceholder() {
  return (
    <div className="promotion-placeholder">
      <Button type="button" variant="outline" disabled>
        تمييز العقار
      </Button>
      <span className="muted">ميزة مدفوعة ستتوفر قريبا. تواصل مع الإدارة حاليا.</span>
    </div>
  );
}
