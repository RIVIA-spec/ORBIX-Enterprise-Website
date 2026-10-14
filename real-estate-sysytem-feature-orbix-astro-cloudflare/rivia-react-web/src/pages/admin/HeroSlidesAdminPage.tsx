import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ImageUploader } from '../../components/ui/ImageUploader';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import {
  createHeroSlide,
  deleteHeroSlide,
  listAllHeroSlidesForAdmin,
  toggleHeroSlideActive,
  updateHeroSlide,
} from '../../services/heroSlideService';
import type { HeroSlide } from '../../types/models';

type FormState = {
  title: string;
  subtitle: string;
  badge: string;
  linkLabel: string;
  linkUrl: string;
  order: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  title: '',
  subtitle: '',
  badge: '',
  linkLabel: '',
  linkUrl: '',
  order: '0',
  isActive: true,
};

export function HeroSlidesAdminPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeCount = useMemo(() => slides.filter((slide) => slide.isActive).length, [slides]);

  const reload = async () => {
    setLoading(true);
    try {
      setSlides(await listAllHeroSlidesForAdmin());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل سلايدر الرئيسية.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFile(null);
  };

  const beginEdit = (slide: HeroSlide) => {
    setEditing(slide);
    setForm({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      badge: slide.badge || '',
      linkLabel: slide.linkLabel || '',
      linkUrl: slide.linkUrl || '',
      order: String(slide.order ?? 0),
      isActive: slide.isActive === true,
    });
    setFile(null);
    setError(null);
    setSuccess(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!editing && !file) {
        setError('يرجى اختيار صورة لسلايدر الرئيسية.');
        return;
      }

      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        badge: form.badge.trim(),
        linkLabel: form.linkLabel.trim(),
        linkUrl: form.linkUrl.trim(),
        order: Number(form.order) || 0,
        isActive: form.isActive,
      };

      if (editing) {
        await updateHeroSlide(editing.id, payload, file || undefined);
        setSuccess('تم تحديث الشريحة بنجاح.');
      } else {
        await createHeroSlide(payload, file || undefined);
        setSuccess('تمت إضافة الشريحة بنجاح.');
      }

      resetForm();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ صور الهيرو بسبب صلاحيات قاعدة البيانات.');
    } finally {
      setSaving(false);
    }
  };

  const removeSlide = async (slide: HeroSlide) => {
    if (!window.confirm('هل تريد حذف هذه الشريحة؟')) return;
    setError(null);
    setSuccess(null);
    try {
      await deleteHeroSlide(slide.id);
      setSuccess('تم حذف الشريحة.');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ صور الهيرو بسبب صلاحيات قاعدة البيانات.');
    }
  };

  const toggleSlide = async (slide: HeroSlide) => {
    setError(null);
    setSuccess(null);
    try {
      await toggleHeroSlideActive(slide.id, slide.isActive !== true);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ صور الهيرو بسبب صلاحيات قاعدة البيانات.');
    }
  };

  if (loading) return <LoadingState label="جاري تحميل سلايدر الرئيسية" />;

  return (
    <div className="hero-slides-admin">
      <div className="page-heading compact">
        <h1>سلايدر الرئيسية</h1>
        <p>إدارة صور الهيرو التي تظهر في الصفحة الرئيسية. تظهر الشرائح المفعلة فقط للزوار.</p>
      </div>

      {error ? <EmptyState title="تعذر تنفيذ العملية" description={error} /> : null}
      {success ? <div className="form-success">{success}</div> : null}

      <Card className="hero-slide-form-card">
        <form className="hero-slide-form" onSubmit={submit}>
          <div className="form-section-heading">
            <h2>{editing ? 'تعديل شريحة' : 'إضافة شريحة جديدة'}</h2>
            <p>{activeCount} شريحة مفعلة حاليا.</p>
          </div>

          <div className="form-grid">
            <Input label="العنوان" value={form.title} onChange={(event) => setField('title', event.target.value)} />
            <Input label="الشارة" value={form.badge} onChange={(event) => setField('badge', event.target.value)} />
            <Input label="نص الرابط" value={form.linkLabel} onChange={(event) => setField('linkLabel', event.target.value)} />
            <Input label="الرابط" value={form.linkUrl} onChange={(event) => setField('linkUrl', event.target.value)} />
            <Input label="الترتيب" type="number" value={form.order} onChange={(event) => setField('order', event.target.value)} />
            <label className="field hero-slide-active-field">
              <span className="field-label">الظهور</span>
              <span className="hero-slide-checkbox">
                <input type="checkbox" checked={form.isActive} onChange={(event) => setField('isActive', event.target.checked)} />
                مفعلة على الصفحة الرئيسية
              </span>
            </label>
            <label className="field hero-slide-textarea">
              <span className="field-label">الوصف</span>
              <span className="input-shell textarea-shell">
                <textarea value={form.subtitle} onChange={(event) => setField('subtitle', event.target.value)} rows={4} />
              </span>
            </label>
            <ImageUploader label={editing ? 'استبدال الصورة' : 'صورة السلايدر'} onChange={(files) => setFile(files[0] || null)} />
          </div>

          {file ? <div className="upload-preview-note">الصورة المختارة: {file.name}</div> : null}
          {editing?.imageUrl ? (
            <div className="hero-slide-current-preview">
              <img src={editing.imageUrl} alt={editing.title || 'الشريحة الحالية'} />
              <span>الصورة الحالية</span>
            </div>
          ) : null}

          <div className="inline-actions">
            <Button type="submit" loading={saving}>
              {editing ? 'حفظ التعديل' : 'إضافة الشريحة'}
            </Button>
            {editing ? (
              <Button type="button" variant="ghost" onClick={resetForm}>
                إلغاء
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <div className="hero-slide-list">
        {slides.length === 0 ? (
          <EmptyState title="لا توجد شرائح بعد" description="أضف أول صورة لتظهر في هيرو الصفحة الرئيسية." />
        ) : (
          slides.map((slide) => (
            <Card key={slide.id} className="hero-slide-admin-card">
              <div className="hero-slide-admin-preview">
                {slide.imageUrl ? <img src={slide.imageUrl} alt={slide.title || 'شريحة'} /> : <span>بدون صورة</span>}
              </div>
              <div className="hero-slide-admin-body">
                <div className="compact-row">
                  <div>
                    <h3>{slide.title || 'شريحة بدون عنوان'}</h3>
                    <p>{slide.subtitle || 'بدون وصف'}</p>
                  </div>
                  <span className={`badge ${slide.isActive ? 'badge-green' : 'badge-gray'}`}>
                    {slide.isActive ? 'مفعلة' : 'متوقفة'}
                  </span>
                </div>
                <div className="hero-slide-meta">
                  <span>ترتيب {slide.order ?? 0}</span>
                  {slide.badge ? <span>{slide.badge}</span> : null}
                  {slide.linkUrl ? <span>{slide.linkUrl}</span> : null}
                </div>
                <div className="inline-actions">
                  <Button variant="outline" onClick={() => beginEdit(slide)}>
                    تعديل
                  </Button>
                  <Button variant="outline" onClick={() => toggleSlide(slide)}>
                    {slide.isActive ? 'إيقاف' : 'تفعيل'}
                  </Button>
                  <Button variant="danger" onClick={() => removeSlide(slide)}>
                    حذف
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
