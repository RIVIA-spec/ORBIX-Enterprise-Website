import { useEffect, useMemo, useState } from 'react';
import { AdminAppHeader } from '../../components/admin/AdminAppHeader';
import { CookieConsentPanel } from '../../components/layout/CookieConsentBanner';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useAuth } from '../../hooks/useAuth';
import { hasCookieSettingsAccess } from '../../lib/adminAccess';
import {
  defaultCookieConsentSettings,
  getCookieConsentSettings,
  HAS_ANALYTICS_PROVIDER,
  HAS_MARKETING_PROVIDER,
  saveCookieConsentSettings,
  type CookieConsentSettings,
} from '../../services/cookieConsentSettingsService';

type BooleanField = 'enabled' | 'analyticsEnabled' | 'marketingEnabled' | 'requireRenewedConsent';
type ToastState = { tone: 'success' | 'error'; text: string } | null;

function formatAdminDate(value?: string) {
  if (!value) return 'غير محدد';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('ar-SA');
}

function formatSettingsUpdatedAt(settings: CookieConsentSettings) {
  const timestamp = settings.updatedAt;
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleString('ar-SA');
  }
  return 'غير محدد';
}

function validateSettings(settings: CookieConsentSettings) {
  const requiredFields = [
    settings.titleAr,
    settings.descriptionAr,
    settings.acceptAllLabelAr,
    settings.rejectOptionalLabelAr,
    settings.policyLinkLabelAr,
    settings.policyLastUpdated,
  ];
  return requiredFields.every((value) => value.trim());
}

export function CookieSettingsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [form, setForm] = useState<CookieConsentSettings>(defaultCookieConsentSettings);
  const [savedForm, setSavedForm] = useState<CookieConsentSettings>(defaultCookieConsentSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const optionalCategoryEnabled = form.analyticsEnabled || form.marketingEnabled;
  const isValid = useMemo(() => validateSettings(form), [form]);
  const canManageCookieSettings = hasCookieSettingsAccess(profile);

  useEffect(() => {
    getCookieConsentSettings()
      .then((settings) => {
        setForm(settings);
        setSavedForm(settings);
      })
      .catch((error) => {
        setToast({ tone: 'error', text: 'تعذر تحميل إعدادات ملفات تعريف الارتباط. تم عرض القيم الافتراضية مؤقتًا.' });
        if (import.meta.env.DEV) console.warn('[cookie settings] load failed', error);
      })
      .finally(() => setLoading(false));
  }, []);

  const setField = <K extends keyof CookieConsentSettings>(key: K, value: CookieConsentSettings[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleField = (key: BooleanField) => {
    if (key === 'analyticsEnabled' && !HAS_ANALYTICS_PROVIDER) return;
    if (key === 'marketingEnabled' && !HAS_MARKETING_PROVIDER) return;
    setForm((current) => ({ ...current, [key]: !current[key] }));
  };

  const resetToSaved = () => {
    setForm(savedForm);
    setToast({ tone: 'success', text: 'تم إلغاء التعديلات غير المحفوظة.' });
  };

  const restoreDefaults = () => {
    setForm((current) => ({
      ...current,
      titleAr: defaultCookieConsentSettings.titleAr,
      descriptionAr: defaultCookieConsentSettings.descriptionAr,
      acceptAllLabelAr: defaultCookieConsentSettings.acceptAllLabelAr,
      rejectOptionalLabelAr: defaultCookieConsentSettings.rejectOptionalLabelAr,
      policyLinkLabelAr: defaultCookieConsentSettings.policyLinkLabelAr,
      policyLastUpdated: defaultCookieConsentSettings.policyLastUpdated,
    }));
    setToast({ tone: 'success', text: 'تمت استعادة النصوص الافتراضية. اضغط حفظ لتطبيقها.' });
  };

  const save = async () => {
    if (saving) return;
    if (!canManageCookieSettings) {
      setToast({ tone: 'error', text: 'لا تملك صلاحية تعديل إعدادات ملفات تعريف الارتباط.' });
      return;
    }
    if (!isValid) {
      setToast({ tone: 'error', text: 'يرجى تعبئة العنوان والوصف وأزرار النافذة وتاريخ السياسة قبل الحفظ.' });
      return;
    }

    let nextSettings: CookieConsentSettings = {
      ...form,
      essentialEnabled: true,
      analyticsEnabled: HAS_ANALYTICS_PROVIDER ? form.analyticsEnabled : false,
      marketingEnabled: HAS_MARKETING_PROVIDER ? form.marketingEnabled : false,
    };
    if (form.requireRenewedConsent) {
      const confirmed = window.confirm(
        'سيؤدي هذا الإجراء إلى ظهور نافذة ملفات تعريف الارتباط مرة أخرى لجميع المستخدمين الذين حفظوا موافقتهم على إصدار أقدم.',
      );
      if (!confirmed) return;
      nextSettings = { ...nextSettings, version: form.version + 1, requireRenewedConsent: false };
    }

    setSaving(true);
    setToast(null);
    try {
      await saveCookieConsentSettings(nextSettings, user?.uid || '');
      const persisted = { ...nextSettings, updatedBy: user?.uid || nextSettings.updatedBy };
      setForm(persisted);
      setSavedForm(persisted);
      setToast({ tone: 'success', text: 'تم حفظ إعدادات ملفات تعريف الارتباط بنجاح.' });
    } catch (error) {
      setToast({ tone: 'error', text: 'تعذر حفظ الإعدادات من هذا الحساب. تحقق من صلاحيات Firestore الخاصة بالإدارة.' });
      if (import.meta.env.DEV) console.warn('[cookie settings] save failed', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-app-page cookie-settings-page">
      <AdminAppHeader title="إعدادات ملفات تعريف الارتباط" />
      <div className="admin-mobile-content">
        {authLoading ? <div className="admin-app-loading">جاري التحقق من الصلاحيات...</div> : null}
        {!authLoading && !canManageCookieSettings ? (
          <Card className="auth-card">
            <h1>لا تملك صلاحية الوصول إلى إعدادات ملفات تعريف الارتباط.</h1>
            <p className="muted">هذه الصفحة متاحة فقط للمدير أو مالك التطبيق.</p>
          </Card>
        ) : null}
        {toast && <p className={toast.tone === 'success' ? 'admin-inline-message' : 'admin-inline-warning'} role="status">{toast.text}</p>}
        {!authLoading && canManageCookieSettings && loading ? (
          <div className="admin-app-loading">جاري تحميل الإعدادات...</div>
        ) : null}
        {!authLoading && canManageCookieSettings && !loading ? (
          <>
            <section className="admin-form-card cookie-settings-card">
              <div className="cookie-settings-card-heading">
                <h2>حالة البانر</h2>
                <span className={form.enabled ? 'badge badge-green' : 'badge badge-gray'}>{form.enabled ? 'مفعلة' : 'متوقفة'}</span>
              </div>
              <div className="cookie-settings-status-grid">
                <div><span>إصدار الموافقة</span><strong>{form.version}</strong></div>
                <div><span>تاريخ آخر تعديل</span><strong>{formatSettingsUpdatedAt(form)}</strong></div>
                <div><span>آخر مدير عدّل الإعدادات</span><strong dir="ltr">{form.updatedBy || 'غير محدد'}</strong></div>
              </div>
              <div className="cookie-settings-grid">
                <label className="cookie-settings-toggle">
                  <input type="checkbox" checked={form.enabled} onChange={() => toggleField('enabled')} />
                  <span>
                    <strong>تفعيل أو تعطيل نافذة الكوكيز</strong>
                    <small>عند الإيقاف لن تظهر نافذة ملفات تعريف الارتباط للمستخدمين.</small>
                  </span>
                </label>
                <label className="cookie-settings-toggle">
                  <input type="checkbox" checked={form.requireRenewedConsent} onChange={() => toggleField('requireRenewedConsent')} />
                  <span>
                    <strong>طلب الموافقة من المستخدمين مرة أخرى</strong>
                    <small>عند الحفظ سيرتفع رقم الإصدار بمقدار 1 وتصبح الموافقات الأقدم غير مطابقة.</small>
                  </span>
                </label>
              </div>
            </section>

            <section className="admin-form-card cookie-settings-card">
              <h2>النصوص</h2>
              <label>
                عنوان النافذة
                <input value={form.titleAr} onChange={(event) => setField('titleAr', event.target.value)} />
              </label>
              <label>
                وصف النافذة
                <textarea value={form.descriptionAr} onChange={(event) => setField('descriptionAr', event.target.value)} rows={5} />
              </label>
              <div className="cookie-settings-grid three">
                <label>
                  نص زر قبول الكل
                  <input value={form.acceptAllLabelAr} onChange={(event) => setField('acceptAllLabelAr', event.target.value)} />
                </label>
                <label>
                  نص زر رفض غير الضروري
                  <input value={form.rejectOptionalLabelAr} onChange={(event) => setField('rejectOptionalLabelAr', event.target.value)} />
                </label>
                <label>
                  نص رابط قراءة السياسة
                  <input value={form.policyLinkLabelAr} onChange={(event) => setField('policyLinkLabelAr', event.target.value)} />
                </label>
              </div>
              <label>
                تاريخ آخر تحديث للسياسة
                <input dir="ltr" type="date" value={form.policyLastUpdated} onChange={(event) => setField('policyLastUpdated', event.target.value)} />
              </label>
            </section>

            <section className="admin-form-card cookie-settings-card">
              <h2>الفئات</h2>
              <p className="muted">تفعيل أي فئة هنا يعني فقط أنها أصبحت متاحة في واجهة الموافقة، ولا يضيف أو يشغل أي خدمة تتبع تلقائيًا.</p>
              {optionalCategoryEnabled && (
                <p className="admin-inline-warning">
                  تم تفعيل هذه الفئة في إعدادات الموافقة، لكن لا توجد حاليًا أداة تحليل أو تسويق متصلة بالمشروع. لن يتم جمع بيانات إضافية حتى
                  تتم إضافة مزود تقني وتطبيق منطق الموافقة عليه.
                </p>
              )}
              <div className="cookie-settings-grid">
                <label className="cookie-settings-toggle is-fixed">
                  <input type="checkbox" checked readOnly aria-readonly="true" />
                  <span>
                    <strong>الملفات الضرورية</strong>
                    <small>مطلوبة لتسجيل الدخول والجلسة والأمان وحفظ تفضيلات المستخدم الأساسية.</small>
                  </span>
                </label>
                <label className="cookie-settings-toggle">
                  <input type="checkbox" checked={HAS_ANALYTICS_PROVIDER && form.analyticsEnabled} disabled={!HAS_ANALYTICS_PROVIDER} onChange={() => toggleField('analyticsEnabled')} />
                  <span>
                    <strong>الملفات التحليلية</strong>
                    <small>متوقفة افتراضيًا. الحالة: لا يوجد مزود متصل.</small>
                  </span>
                </label>
                <label className="cookie-settings-toggle">
                  <input type="checkbox" checked={HAS_MARKETING_PROVIDER && form.marketingEnabled} disabled={!HAS_MARKETING_PROVIDER} onChange={() => toggleField('marketingEnabled')} />
                  <span>
                    <strong>الملفات التسويقية</strong>
                    <small>متوقفة افتراضيًا. الحالة: لا يوجد مزود متصل.</small>
                  </span>
                </label>
              </div>
              <div className="admin-phone-row">
                <label>
                  اسم مزود التحليل
                  <input value={form.analyticsProviderName} disabled={!HAS_ANALYTICS_PROVIDER} onChange={(event) => setField('analyticsProviderName', event.target.value)} placeholder="اختياري" />
                </label>
                <label>
                  اسم مزود التسويق
                  <input value={form.marketingProviderName} disabled={!HAS_MARKETING_PROVIDER} onChange={(event) => setField('marketingProviderName', event.target.value)} placeholder="اختياري" />
                </label>
              </div>
            </section>

            <section className="admin-form-card cookie-settings-card">
              <h2>إعدادات العرض</h2>
              <Select
                label="موضع البانر"
                value={form.bannerPosition}
                onChange={(event) => setField('bannerPosition', event.target.value as CookieConsentSettings['bannerPosition'])}
                options={[
                  { value: 'bottom-right', label: 'أسفل اليمين' },
                  { value: 'bottom-center', label: 'أسفل المنتصف' },
                ]}
              />
              <div className="cookie-settings-preview-shell" aria-label="معاينة مباشرة للبانر">
                <CookieConsentPanel settings={form} preview onAccept={() => undefined} onReject={() => undefined} />
              </div>
            </section>

            <div className="cookie-settings-actions">
              <Button type="button" onClick={() => void save()} loading={saving} disabled={saving || !isValid}>
                حفظ التغييرات
              </Button>
              <Button type="button" variant="outline" onClick={resetToSaved} disabled={saving}>
                إلغاء التعديلات
              </Button>
              <Button type="button" variant="ghost" onClick={restoreDefaults} disabled={saving}>
                استعادة النصوص الافتراضية
              </Button>
              <Button type="button" variant="secondary" onClick={() => setPreviewOpen(true)} disabled={saving}>
                معاينة البانر
              </Button>
            </div>
          </>
        ) : null}
      </div>
      {previewOpen && (
        <div className="cookie-settings-preview-modal" role="dialog" aria-modal="true" aria-label="معاينة البانر">
          <button type="button" className="cookie-settings-preview-backdrop" aria-label="إغلاق المعاينة" onClick={() => setPreviewOpen(false)} />
          <div className="cookie-settings-preview-frame">
            <CookieConsentPanel settings={form} preview onAccept={() => undefined} onReject={() => undefined} />
            <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)}>
              إغلاق المعاينة
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
