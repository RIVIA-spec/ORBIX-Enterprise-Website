import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HotelCard } from '../../components/cards/HotelCard';
import { Button } from '../../components/ui/Button';
import { DetailsDrawer } from '../../components/ui/DetailsDrawer';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  createHotel,
  getHotelTitle,
  hideHotel,
  listHotelRoomTypes,
  listHotelsForAdmin,
  showHotel,
  softDeleteHotel,
  toggleHotelFeatured,
  updateHotel,
} from '../../services/hotelService';
import type { Hotel, HotelRoomType } from '../../types/models';

type HotelForm = {
  hotel_name: string;
  description: string;
  country: string;
  city: string;
  address: string;
  contact_name: string;
  contact_number: string;
  status: string;
  isVisible: string;
  isFeatured: string;
  stars: string;
  rating: string;
  pricePerNight: string;
  currency: string;
  availableRooms: string;
  roomsCount: string;
};

const emptyForm: HotelForm = {
  hotel_name: '',
  description: '',
  country: 'SYRIA',
  city: '',
  address: '',
  contact_name: '',
  contact_number: '',
  status: 'approved',
  isVisible: 'true',
  isFeatured: 'false',
  stars: '',
  rating: '',
  pricePerNight: '',
  currency: '',
  availableRooms: '',
  roomsCount: '',
};

const countryOptions = [
  { value: 'SYRIA', label: 'سوريا' },
  { value: 'LEBANON', label: 'لبنان' },
  { value: 'TURKEY', label: 'تركيا' },
  { value: 'JORDAN', label: 'الأردن' },
];

function formFromHotel(hotel: Hotel): HotelForm {
  return {
    hotel_name: hotel.hotel_name || hotel.name || hotel.title || '',
    description: hotel.description || '',
    country: hotel.country || hotel.countryCode || 'SYRIA',
    city: hotel.city || '',
    address: hotel.address || '',
    contact_name: hotel.contact_name || hotel.contactName || '',
    contact_number: hotel.contact_number || hotel.phone || '',
    status: hotel.status || 'approved',
    isVisible: hotel.isVisible === false ? 'false' : 'true',
    isFeatured: hotel.isFeatured || hotel.featured || hotel.isDistinct ? 'true' : 'false',
    stars: String(hotel.stars || ''),
    rating: String(hotel.rating || ''),
    pricePerNight: String(hotel.pricePerNight || hotel.nightlyPrice || hotel.price_per_night || hotel.price || ''),
    currency: hotel.currency || '',
    availableRooms: String(hotel.availableRooms || ''),
    roomsCount: String(hotel.roomsCount || ''),
  };
}

function payloadFromForm(form: HotelForm): Partial<Hotel> {
  return {
    hotel_name: form.hotel_name.trim(),
    name: form.hotel_name.trim(),
    title: form.hotel_name.trim(),
    description: form.description.trim(),
    country: form.country,
    city: form.city.trim(),
    address: form.address.trim(),
    contact_name: form.contact_name.trim(),
    contactName: form.contact_name.trim(),
    contact_number: form.contact_number.trim(),
    phone: form.contact_number.trim(),
    status: form.status,
    isVisible: form.isVisible === 'true',
    isApproved: form.status === 'approved',
    isFeatured: form.isFeatured === 'true',
    featured: form.isFeatured === 'true',
    isDistinct: form.isFeatured === 'true',
    stars: form.stars,
    rating: form.rating,
    pricePerNight: form.pricePerNight,
    nightlyPrice: form.pricePerNight,
    price_per_night: form.pricePerNight,
    currency: form.currency.trim(),
    availableRooms: form.availableRooms,
    roomsCount: form.roomsCount,
  };
}

export function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selected, setSelected] = useState<Hotel | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<HotelRoomType[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Hotel | null>(null);
  const [form, setForm] = useState<HotelForm>(emptyForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState('all');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      setHotels(await listHotelsForAdmin());
    } catch {
      setError('تعذر تحميل الفنادق بسبب صلاحيات قاعدة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return hotels.filter((hotel) => {
      const source = [hotel.hotel_name, hotel.name, hotel.title, hotel.city, hotel.address, hotel.country].filter(Boolean).join(' ').toLowerCase();
      const visibleOk = visibility === 'all' || (visibility === 'visible' ? hotel.isVisible !== false : hotel.isVisible === false);
      const statusOk = status === 'all' || hotel.status === status;
      return visibleOk && statusOk && (!needle || source.includes(needle));
    });
  }, [hotels, search, status, visibility]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFiles([]);
    setFormOpen(true);
  };

  const openEdit = (hotel: Hotel) => {
    setEditing(hotel);
    setForm(formFromHotel(hotel));
    setImageFiles([]);
    setFormOpen(true);
  };

  const openDetails = async (hotel: Hotel) => {
    setSelected(hotel);
    setSelectedRooms([]);
    try {
      setSelectedRooms(await listHotelRoomTypes(hotel.id));
    } catch {
      setSelectedRooms([]);
    }
  };

  const updateForm = (field: keyof HotelForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveHotel = async () => {
    setError(null);
    setSaving(true);
    try {
      if (editing) {
        await updateHotel(editing.id, payloadFromForm(form), imageFiles);
      } else {
        await createHotel(payloadFromForm(form), imageFiles);
      }
      setFormOpen(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ الفندق بسبب صلاحيات قاعدة البيانات.');
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ الفندق بسبب صلاحيات قاعدة البيانات.');
    }
  };

  if (loading) return <LoadingState label="جاري تحميل الفنادق" />;

  return (
    <div>
      <div className="section-header">
        <div className="page-heading compact"><h1>إدارة الفنادق</h1></div>
        <Button type="button" onClick={openCreate}>إضافة فندق</Button>
      </div>

      {error && <EmptyState title="تعذر تنفيذ العملية" description={error} />}

      {formOpen && (
        <div className="form-stack wide">
          <div className="card form-section">
            <div className="form-section-heading">
              <h2>{editing ? 'تعديل الفندق' : 'إضافة فندق'}</h2>
              <p>أدخل بيانات الفندق كما ستظهر للمستخدمين في الموقع.</p>
            </div>
            <div className="form-grid">
              <Input label="اسم الفندق" value={form.hotel_name} onChange={(event) => updateForm('hotel_name', event.target.value)} />
              <Select label="الدولة" value={form.country} onChange={(event) => updateForm('country', event.target.value)} options={countryOptions} />
              <Input label="المدينة" value={form.city} onChange={(event) => updateForm('city', event.target.value)} />
              <Input label="العنوان" value={form.address} onChange={(event) => updateForm('address', event.target.value)} />
              <Input label="اسم جهة الاتصال" value={form.contact_name} onChange={(event) => updateForm('contact_name', event.target.value)} />
              <Input label="رقم التواصل" value={form.contact_number} onChange={(event) => updateForm('contact_number', event.target.value)} />
              <Select label="الحالة" value={form.status} onChange={(event) => updateForm('status', event.target.value)} options={[{ value: 'approved', label: 'مقبول' }, { value: 'pending', label: 'معلق' }, { value: 'rejected', label: 'مرفوض' }, { value: 'deleted', label: 'مؤرشف' }]} />
              <Select label="الظهور" value={form.isVisible} onChange={(event) => updateForm('isVisible', event.target.value)} options={[{ value: 'true', label: 'ظاهر' }, { value: 'false', label: 'مخفي' }]} />
              <Select label="مميز" value={form.isFeatured} onChange={(event) => updateForm('isFeatured', event.target.value)} options={[{ value: 'false', label: 'غير مميز' }, { value: 'true', label: 'مميز' }]} />
              <Input label="النجوم" value={form.stars} onChange={(event) => updateForm('stars', event.target.value)} />
              <Input label="التقييم" value={form.rating} onChange={(event) => updateForm('rating', event.target.value)} />
              <Input label="السعر لليلة" value={form.pricePerNight} onChange={(event) => updateForm('pricePerNight', event.target.value)} />
              <Input label="العملة" value={form.currency} onChange={(event) => updateForm('currency', event.target.value)} />
              <Input label="الغرف المتاحة" value={form.availableRooms} onChange={(event) => updateForm('availableRooms', event.target.value)} />
              <Input label="عدد الغرف" value={form.roomsCount} onChange={(event) => updateForm('roomsCount', event.target.value)} />
              <label className="field full-span">
                <span className="field-label">الوصف</span>
                <span className="input-shell textarea-shell">
                  <textarea value={form.description} onChange={(event) => updateForm('description', event.target.value)} />
                </span>
              </label>
              <label className="field full-span">
                <span className="field-label">الصور</span>
                <span className="input-shell">
                  <input type="file" multiple accept="image/*" onChange={(event) => setImageFiles(Array.from(event.target.files || []))} />
                </span>
                <span className="field-helper">يتم الرفع إلى hotels/{'{hotelId}'}/images/{'{fileName}'}.</span>
              </label>
            </div>
            <div className="inline-actions">
              <Button type="button" onClick={saveHotel} loading={saving}>حفظ الفندق</Button>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>إلغاء</Button>
            </div>
          </div>
        </div>
      )}

      <div className="filter-bar">
        <Input label="بحث" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select label="الظهور" value={visibility} onChange={(event) => setVisibility(event.target.value)} options={[{ value: 'all', label: 'الكل' }, { value: 'visible', label: 'ظاهر' }, { value: 'hidden', label: 'مخفي' }]} />
        <Select label="الحالة" value={status} onChange={(event) => setStatus(event.target.value)} options={[{ value: 'all', label: 'الكل' }, { value: 'approved', label: 'مقبول' }, { value: 'pending', label: 'معلق' }, { value: 'rejected', label: 'مرفوض' }, { value: 'deleted', label: 'مؤرشف' }]} />
      </div>

      <div className="cards-grid">
        {filtered.map((hotel) => (
          <div key={hotel.id} className="admin-hotel-wrap">
            <HotelCard hotel={hotel} />
            <div className="inline-actions admin-card-actions">
              <StatusBadge status={hotel.isVisible === false ? 'hidden' : 'visible'} />
              <Button as={Link} to={`/hotels/${hotel.id}`} variant="outline">التفاصيل</Button>
              <Button variant="outline" onClick={() => openDetails(hotel)}>بيانات</Button>
              <Button variant="ghost" onClick={() => openEdit(hotel)}>تعديل</Button>
              <Button variant="ghost" onClick={() => runAction(() => (hotel.isVisible === false ? showHotel(hotel.id) : hideHotel(hotel.id)))}>{hotel.isVisible === false ? 'إظهار' : 'إخفاء'}</Button>
              <Button variant="ghost" onClick={() => runAction(() => toggleHotelFeatured(hotel.id, !(hotel.isFeatured || hotel.featured || hotel.isDistinct)))}>{hotel.isFeatured || hotel.featured || hotel.isDistinct ? 'إزالة التمييز' : 'تمييز'}</Button>
              <Button variant="danger" onClick={() => runAction(() => softDeleteHotel(hotel.id))}>أرشفة</Button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && !error && <EmptyState title="لا توجد فنادق مطابقة" />}

      <DetailsDrawer open={Boolean(selected)} title="تفاصيل الفندق" onClose={() => setSelected(null)}>
        {selected && (
          <div className="drawer-body">
            <dl className="details-grid">
              <div><dt>الاسم</dt><dd>{getHotelTitle(selected)}</dd></div>
              <div><dt>الدولة</dt><dd>{selected.country || ''}</dd></div>
              <div><dt>جهة الاتصال</dt><dd>{selected.contact_name || ''}</dd></div>
              <div><dt>رقم التواصل</dt><dd>{selected.contact_number || selected.phone || ''}</dd></div>
            </dl>
            <h3>أنواع الغرف</h3>
            {selectedRooms.length === 0 ? <p className="muted">لا توجد أنواع غرف أو تعذر تحميلها.</p> : (
              <div className="stack-list">
                {selectedRooms.map((room) => (
                  <div key={room.id} className="map-result-item">
                    <strong>{room.name || room.title || 'غرفة بدون اسم'}</strong>
                    <span className="muted">المتاح: {room.available_count ?? room.availableCount ?? 'غير محدد'}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="field-helper">إدارة أنواع الغرف التفصيلية تبقى للمرحلة التالية، والقراءة الحالية من hotels/{'{hotelId}'}/room_types.</p>
          </div>
        )}
      </DetailsDrawer>
    </div>
  );
}
