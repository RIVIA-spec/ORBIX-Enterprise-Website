import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ImageUploader } from '../../components/ui/ImageUploader';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { createAd, deleteAd, getAds, updateAd } from '../../services/adsService';
import { uploadAdImage } from '../../services/storageService';
import type { Ad } from '../../types/models';

export function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [order, setOrder] = useState('0');
  const [file, setFile] = useState<File | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      setAds(await getAds());
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر تحميل الإعلانات'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return ads
      .filter((ad) => !needle || [ad.title, ad.link].filter(Boolean).join(' ').toLowerCase().includes(needle))
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  }, [ads, search]);

  const beginEdit = (ad: Ad) => {
    setEditing(ad);
    setTitle(ad.title || '');
    setLink(ad.link || '');
    setOrder(String(ad.order || 0));
  };

  const resetForm = () => {
    setEditing(null);
    setTitle('');
    setLink('');
    setOrder('0');
    setFile(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      let imageUrl = editing?.imageUrl || '';
      if (file) {
        try {
          imageUrl = await uploadAdImage(file);
        } catch (err) {
          setError(getFirebaseErrorMessage(err, 'تعذر رفع صورة الإعلان بسبب صلاحيات التخزين.'));
          return;
        }
      }
      if (editing) {
        await updateAd(editing.id, { title, link, order: Number(order) || 0, imageUrl });
      } else {
        await createAd({ title, link, order: Number(order) || 0, imageUrl, isActive: true });
      }
      resetForm();
      await reload();
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر حفظ الإعلان حاليًا. تحقق من صلاحيات حسابك وحاول مجددًا.'));
    }
  };

  if (loading) return <LoadingState label="جاري تحميل الإعلانات" />;

  return (
    <div>
      <div className="page-heading compact"><h1>إدارة الإعلانات</h1></div>
      {error && <EmptyState title="تعذر تنفيذ العملية" description={error} />}
      <Card className="form-section">
        <form className="form-grid" onSubmit={submit}>
          <Input label="بحث" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Input label="العنوان" value={title} onChange={(event) => setTitle(event.target.value)} required />
          <Input label="الرابط" value={link} onChange={(event) => setLink(event.target.value)} />
          <Input label="الترتيب" value={order} onChange={(event) => setOrder(event.target.value)} />
          <ImageUploader label="صورة الإعلان" onChange={(files) => setFile(files[0] || null)} />
          <div className="inline-actions">
            <Button type="submit">{editing ? 'حفظ التعديل' : 'إضافة إعلان'}</Button>
            {editing && <Button type="button" variant="ghost" onClick={resetForm}>إلغاء</Button>}
          </div>
        </form>
      </Card>
      <div className="cards-grid">
        {filtered.map((ad) => (
          <Card key={ad.id} className="admin-card">
            {ad.imageUrl && <img src={ad.imageUrl} alt={ad.title || ''} />}
            <h3>{ad.title || 'إعلان'}</h3>
            <p>{ad.link || 'بدون رابط'} · ترتيب {ad.order || 0}</p>
            <div className="inline-actions">
              <Button variant="outline" onClick={() => beginEdit(ad)}>تعديل</Button>
              <Button variant="outline" onClick={() => updateAd(ad.id, { isActive: !ad.isActive }).then(reload).catch((err) => setError(getFirebaseErrorMessage(err)))}>{ad.isActive ? 'إيقاف' : 'تفعيل'}</Button>
              <Button variant="danger" onClick={() => deleteAd(ad.id).then(reload).catch((err) => setError(getFirebaseErrorMessage(err)))}>حذف</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
