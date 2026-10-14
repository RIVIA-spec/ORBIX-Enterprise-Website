import { FormEvent, useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../../services/categoryService';
import type { Category } from '../../types/models';

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [editing, setEditing] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      setCategories(await getCategories());
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر تحميل التصنيفات'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (editing) await updateCategory(editing.id, title);
      else await createCategory(title);
      setTitle('');
      setEditing(null);
      await reload();
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر حفظ التصنيف حاليًا. تحقق من صلاحيات حسابك وحاول مجددًا.'));
    }
  };

  if (loading) return <LoadingState label="جاري تحميل التصنيفات" />;

  return (
    <div>
      <div className="page-heading compact"><h1>إدارة التصنيفات</h1></div>
      {error && <EmptyState title="تعذر تنفيذ العملية" description={error} />}
      <Card className="form-section">
        <form className="inline-form" onSubmit={submit}>
          <Input label="اسم التصنيف" value={title} onChange={(event) => setTitle(event.target.value)} required />
          <Button type="submit">{editing ? 'حفظ' : 'إضافة'}</Button>
        </form>
      </Card>
      <div className="cards-grid">
        {categories.map((category) => (
          <Card key={category.id} className="admin-card">
            <h3>{category.title || category.id}</h3>
            <div className="inline-actions">
              <Button variant="outline" onClick={() => { setEditing(category); setTitle(category.title || ''); }}>تعديل</Button>
              <Button variant="danger" onClick={() => deleteCategory(category.id).then(reload).catch((err) => setError(getFirebaseErrorMessage(err)))}>حذف</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
