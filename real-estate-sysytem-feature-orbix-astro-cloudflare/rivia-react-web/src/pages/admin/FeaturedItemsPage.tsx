import { useEffect, useMemo, useState } from 'react';
import { AdminAppHeader } from '../../components/admin/AdminAppHeader';
import { formatNumber } from '../../lib/formatters';
import { listFeaturedAdminItems, toggleDistinctItem, type FeaturedAdminItem } from '../../services/adminWorkflowService';

export function FeaturedItemsPage() {
  const [items, setItems] = useState<FeaturedAdminItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const visible = useMemo(() => { const q = search.trim().toLowerCase(); return items.filter((item) => !q || `${item.id} ${item.title}`.toLowerCase().includes(q)); }, [items, search]);
  const load = async () => { setLoading(true); try { const result = await listFeaturedAdminItems(); setItems(result.items); if (result.warnings.length) setMessage(result.warnings.join(' ')); } catch { setMessage('تعذر تحميل العقارات والفنادق.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const toggle = async (item: FeaturedAdminItem) => { try { await toggleDistinctItem(item); setItems((current) => current.map((value) => value.id === item.id && value.source === item.source ? { ...value, isDistinct: !value.isDistinct } : value)); } catch { setMessage('تعذر تحديث حالة التمييز بسبب صلاحيات قاعدة البيانات.'); } };
  return <div className="admin-app-page"><AdminAppHeader title="إضافة عقار/فندق مميز" /><div className="admin-mobile-content"><input className="admin-search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالمعرف أو العنوان..." />{message && <p className="admin-inline-warning">{message}</p>}{loading ? <div className="admin-app-loading">جاري التحميل...</div> : visible.map((item) => <article className="admin-featured-card" key={`${item.source}-${item.id}`}>{item.image ? <img src={item.image} alt="" /> : <div className="admin-image-fallback">لا توجد صورة</div>}<div><small>{item.type}</small><h2>{item.title}</h2><p>{item.price ? `${formatNumber(item.price)} ${item.currency || ''}` : 'السعر غير محدد'}</p></div><button className={item.isDistinct ? 'is-active' : ''} aria-label={item.isDistinct ? 'إزالة التمييز' : 'تمييز'} onClick={() => void toggle(item)}>★</button></article>)}</div></div>;
}
