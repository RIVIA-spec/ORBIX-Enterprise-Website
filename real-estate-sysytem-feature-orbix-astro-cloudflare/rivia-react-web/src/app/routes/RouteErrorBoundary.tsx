import { Link, useRouteError } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : 'حدث خطأ أثناء تحميل الصفحة.';

  return (
    <section className="container section">
      <Card className="auth-card">
        <span className="eyebrow">خطأ في الصفحة</span>
        <h1>تعذر فتح هذه الصفحة</h1>
        <p className="muted">{message}</p>
        <div className="hero-actions">
          <Button as={Link} to="/">
            العودة للرئيسية
          </Button>
        </div>
      </Card>
    </section>
  );
}

