import { FormEvent, useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { getFeatureList, saveFeatureList } from '../../services/featureService';

export function FeaturesPage() {
  const [features, setFeatures] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFeatureList().then(setFeatures).catch((err) => setError(getFirebaseErrorMessage(err, 'تعذر تحميل البيانات.'))).finally(() => setLoading(false));
  }, []);

  const persist = async (next: string[]) => {
    try {
      await saveFeatureList(next);
      setFeatures(next);
      setTitle('');
      setEditingIndex(null);
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر حفظ البيانات بسبب صلاحيات قاعدة البيانات.'));
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next = [...features];
    if (editingIndex == null) next.push(title);
    else next[editingIndex] = title;
    await persist(next.filter(Boolean));
  };

  if (loading) return <LoadingState label="جاري تحميل الميزات" />;

  return (
    <div>
      <div className="page-heading compact"><h1>إدارة الميزات</h1></div>
      {error && <EmptyState title="تعذر تنفيذ العملية" description={error} />}
      <Card className="form-section">
        <form className="inline-form" onSubmit={submit}>
          <Input label="الميزة" value={title} onChange={(event) => setTitle(event.target.value)} required />
          <Button type="submit">{editingIndex == null ? 'إضافة' : 'حفظ'}</Button>
        </form>
      </Card>
      <div className="features-list">
        {features.map((feature, index) => (
          <span key={`${feature}-${index}`}>
            {feature}
            <button type="button" onClick={() => { setEditingIndex(index); setTitle(feature); }}>تعديل</button>
            <button type="button" onClick={() => persist(features.filter((_, itemIndex) => itemIndex !== index))}>حذف</button>
          </span>
        ))}
      </div>
    </div>
  );
}
