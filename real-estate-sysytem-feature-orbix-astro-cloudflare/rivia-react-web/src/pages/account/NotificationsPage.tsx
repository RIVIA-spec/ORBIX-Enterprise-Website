import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDate } from '../../lib/formatters';

export function NotificationsPage() {
  const { notifications, loading, error, markRead } = useNotifications();
  if (loading) return <LoadingState label="جاري تحميل الإشعارات" />;

  return (
    <div>
      <div className="page-heading compact">
        <span className="eyebrow">الإشعارات</span>
        <h1>مركز الإشعارات</h1>
      </div>
      {error && <EmptyState title="تعذر تحديث أو تحميل الإشعارات" description={error} />}
      <div className="stack-list">
        {notifications.map((notification) => {
          const read = notification.isRead || notification.read;
          return (
            <Card key={notification.id} className="list-card">
              <div>
                <h3>{notification.title || 'إشعار'}</h3>
                <p>{notification.message || 'بدون رسالة'}</p>
                <p className="muted">{notification.type || 'عام'} · {formatDate(notification.created_at || notification.createdAt)}</p>
              </div>
              <StatusBadge status={read ? 'read' : 'unread'} />
              {!read && <Button variant="outline" onClick={() => markRead(notification.id)}>تعليم كمقروء</Button>}
            </Card>
          );
        })}
        {notifications.length === 0 && !error && <EmptyState title="لا توجد إشعارات" />}
      </div>
    </div>
  );
}

