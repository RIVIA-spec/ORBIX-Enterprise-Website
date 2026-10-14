import { useEffect, useMemo, useState } from 'react';
import { AdminAppHeader } from '../../components/admin/AdminAppHeader';
import { listPropertiesForVisibility, togglePropertyVisibility } from '../../services/adminWorkflowService';
import type { Property } from '../../types/models';

export function PropertiesVisibilityPage() {
  const [items, setItems] = useState<Property[]>([]); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true); const [message, setMessage] = useState('');
  useEffect(() => { listPropertiesForVisibility().then(setItems).catch(() => setMessage('تعذر تحميل العقارات بسبب صلاحيات قاعدة البيانات.')).finally(() => setLoading(false)); }, []);
  const visible = useMemo(() => { const q = search.toLowerCase().trim(); return items.filter((item) => !q || `${item.title || item.name} ${item.id}`.toLowerCase().includes(q)); }, [items, search]);
  const toggle = async (item: Property) => { try { await togglePropertyVisibility(item); setItems((current) => current.map((value) => value.id === item.id ? { ...value, isVisible: value.isVisible === false } : value)); } catch { setMessage('تعذر تغيير ظهور العقار بسبب صلاحيات قاعدة البيانات.'); } };
  return <div className="admin-app-page"><AdminAppHeader title="إخفاء / إظهار العقارات" /><div className="admin-mobile-content"><input className="admin-search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن عقار..." />{message && <p className="admin-inline-warning">{message}</p>}{loading ? <div className="admin-app-loading">جاري التحميل...</div> : visible.map((item) => <article className="admin-simple-list-card" key={item.id}><div><h2>{item.title || item.name || 'عقار بدون عنوان'}</h2><p>{item.city || item.address || item.id}</p></div><button className={item.isVisible === false ? 'admin-outline-blue' : 'admin-outline-red'} onClick={() => void toggle(item)}>{item.isVisible === false ? 'إظهار' : 'إخفاء'}</button></article>)}</div></div>;
}
