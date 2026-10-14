import { FormEvent, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ImageUploader } from '../../components/ui/ImageUploader';
import { LoadingState } from '../../components/ui/LoadingState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { useVerification } from '../../hooks/useVerification';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { uploadVerificationImage } from '../../services/storageService';
import { submitVerification } from '../../services/verificationService';

export function VerificationPage() {
  const { user, profile } = useAuth();
  const { verification, loading, error, reload } = useVerification();
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !front || !back) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const [frontIdUrl, backIdUrl] = await Promise.all([
        uploadVerificationImage(user.uid, 'front', front),
        uploadVerificationImage(user.uid, 'back', back),
      ]);
      await submitVerification({ userId: user.uid, frontIdUrl, backIdUrl });
      await reload();
    } catch (err) {
      setSubmitError(getFirebaseErrorMessage(err, 'تعذر إرسال طلب التحقق حاليًا. تأكد من البيانات وحاول لاحقًا.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState label="جاري تحميل حالة التحقق" />;

  return (
    <div>
      <div className="page-heading compact">
        <span className="eyebrow">التحقق من الهوية</span>
        <h1>توثيق الحساب</h1>
        <p>أكد بريدك الإلكتروني وأكمل بيانات الهوية للاستفادة من جميع خدمات الحساب.</p>
      </div>
      {error && <EmptyState title="تعذر تحميل التحقق" description={error} />}
      <Card className="profile-card">
        <h2>الحالة الحالية</h2>
        <div className="info-list">
          <div><dt>البريد الإلكتروني</dt><dd><StatusBadge status={user?.emailVerified ? 'email verified' : 'email not verified'} /></dd></div>
          <div><dt>توثيق الهوية</dt><dd><StatusBadge status={verification?.status || (profile?.isVerified ? 'approved' : 'not submitted')} /></dd></div>
        </div>
        {(verification?.rejectedReason || verification?.rejectionReason) && (
          <div className="form-error">{String(verification.rejectedReason || verification.rejectionReason || '')}</div>
        )}
      </Card>

      <form className="form-stack wide" onSubmit={handleSubmit}>
        <Card className="form-section">
          <h2>رفع المستندات</h2>
          <ImageUploader label="صورة الهوية من الأمام" onChange={(files) => setFront(files[0] || null)} />
          <ImageUploader label="صورة الهوية من الخلف" onChange={(files) => setBack(files[0] || null)} />
          {submitError && <div className="form-error">{submitError}</div>}
          <Button type="submit" disabled={submitting || !front || !back}>{submitting ? 'جاري الإرسال...' : 'إرسال التحقق'}</Button>
        </Card>
      </form>
    </div>
  );
}
