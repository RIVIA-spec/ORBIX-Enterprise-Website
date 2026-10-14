import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LocationPicker, type LocationPickerChange } from '../../components/map/LocationPicker';
import { PanoramaUploadSection } from '../../components/tour/PanoramaUploadSection';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CountryDialCodePicker } from '../../components/ui/CountryDialCodePicker';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { ImageUploader } from '../../components/ui/ImageUploader';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { useAuth } from '../../hooks/useAuth';
import { canEditProperty, getPropertyOwnerId } from '../../lib/propertyAccess';
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY, getCountryByCode, getCountryByName, getCountryByPhoneCode } from '../../lib/countries';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { isRentListingType, isSaleListingType } from '../../lib/propertyFlow';
import { LISTING_TYPE_OPTIONS, PROPERTY_TYPE_OPTIONS, getCitiesByCountry } from '../../lib/propertyOptions';
import { createPropertyRequest } from '../../services/propertyRequestService';
import { getPropertyById, hideProperty, softDeleteProperty, updateProperty } from '../../services/propertyService';
import { uploadPanoramaImage, uploadPropertyImage } from '../../services/storageService';
import { buildPanoramaTourPayload, extractTourScenes, getPropertyTour, savePropertyTour, saveRequestTour, type PanoramaPayloadScene } from '../../services/tourService';
import type { Property } from '../../types/models';

type EditableProperty = Pick<Property, 'title' | 'description' | 'property_type' | 'city' | 'country' | 'address' | 'area' | 'bathrooms' | 'bedrooms' | 'contact_name' | 'contact_number'> & {
  countryCode?: string;
  phoneCountryCode?: string;
  country_code?: string;
  rules?: string;
  listing_type?: string;
  daily_price?: string;
  daily_price_currency?: string;
  nightly_price?: string;
  nightly_currency?: string;
  selling_price?: string;
  selling_price_currency?: string;
  latitude?: string;
  longitude?: string;
  lat?: string;
  lng?: string;
};

const countryOptions = COUNTRY_OPTIONS.map((country) => ({
  value: country.code,
  label: `${country.flag} ${country.name} (${country.phoneCode})`,
}));

const typeOptions = [{ value: '', label: 'غير محدد' }, ...PROPERTY_TYPE_OPTIONS.map((value) => ({ value, label: value }))];
const listingTypeOptions = [{ value: '', label: 'اختر نوع العرض' }, ...LISTING_TYPE_OPTIONS.map((value) => ({ value, label: value }))];
const currencyOptions = Array.from(new Set(COUNTRY_OPTIONS.map((country) => country.currency))).map((currency) => ({ value: currency, label: currency }));

const emptyForm: EditableProperty = {
  title: '',
  description: '',
  property_type: '',
  listing_type: '',
  daily_price: '',
  daily_price_currency: DEFAULT_COUNTRY.currency,
  nightly_price: '',
  nightly_currency: DEFAULT_COUNTRY.currency,
  selling_price: '',
  selling_price_currency: DEFAULT_COUNTRY.currency,
  city: '',
  country: '',
  countryCode: '',
  address: '',
  latitude: '',
  longitude: '',
  lat: '',
  lng: '',
  area: '',
  bathrooms: '',
  bedrooms: '',
  contact_name: '',
  phoneCountryCode: '',
  country_code: '',
  contact_number: '',
  rules: '',
};

export function EditPropertyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, isAdmin, isOwner } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [form, setForm] = useState<EditableProperty>(emptyForm);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [panoramaScenes, setPanoramaScenes] = useState<PanoramaPayloadScene[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    Promise.all([getPropertyById(id), getPropertyTour(id).catch(() => null)])
      .then(([item, tour]) => {
        if (!active) return;
        setProperty(item);
        if (item) {
          const existingCountryCode = typeof item.countryCode === 'string' ? item.countryCode : '';
          const existingPhoneCountryCode = typeof item.phoneCountryCode === 'string' ? item.phoneCountryCode : '';
          const country = getCountryByCode(existingCountryCode) || getCountryByName(item.country) || DEFAULT_COUNTRY;
          const location = item.location || {};
          const latitude = item.latitude ?? item.lat ?? location.latitude ?? location.lat ?? '';
          const longitude = item.longitude ?? item.lng ?? location.longitude ?? location.lng ?? '';
          const listingSource = [item.listing_type, item.listingType, item.request_type, item.property_type, item.propertyType, item.type].find(
            (value) => isRentListingType(value) || isSaleListingType(value),
          );
          const listingType = isSaleListingType(listingSource) ? 'بيع' : isRentListingType(listingSource) ? 'إيجار' : '';
          const propertyType = [item.property_type, item.propertyType, item.type, item.category, item.property_category_title].find(
            (value) => Boolean(value) && !isSaleListingType(value) && !isRentListingType(value),
          );
          setForm({
            title: item.title || '',
            description: item.description || '',
            property_type: propertyType == null ? '' : String(propertyType),
            listing_type: listingType,
            daily_price: item.daily_price == null && item.dailyPrice == null ? '' : String(item.daily_price ?? item.dailyPrice),
            daily_price_currency: String(item.daily_price_currency || item.currency || country.currency),
            nightly_price: item.nightly_price == null && item.nightlyPrice == null ? '' : String(item.nightly_price ?? item.nightlyPrice),
            nightly_currency: String(item.nightly_currency || item.currency || country.currency),
            selling_price: item.selling_price == null && item.sellingPrice == null && item.salePrice == null ? '' : String(item.selling_price ?? item.sellingPrice ?? item.salePrice),
            selling_price_currency: String(item.selling_price_currency || item.currency || country.currency),
            city: item.city || '',
            country: item.country || country.name,
            countryCode: existingCountryCode || country.code,
            address: item.address || '',
            latitude: latitude === '' ? '' : String(latitude),
            longitude: longitude === '' ? '' : String(longitude),
            lat: latitude === '' ? '' : String(latitude),
            lng: longitude === '' ? '' : String(longitude),
            area: item.area == null ? '' : String(item.area),
            bathrooms: item.bathrooms == null ? '' : String(item.bathrooms),
            bedrooms: item.bedrooms == null ? '' : String(item.bedrooms),
            contact_name: item.contact_name || item.ownerName || '',
            phoneCountryCode: existingPhoneCountryCode || getCountryByPhoneCode(item.country_code as string | undefined)?.phoneCode || country.phoneCode,
            country_code: String(item.country_code || existingPhoneCountryCode || country.phoneCode),
            contact_number: item.contact_number || item.contactPhone || item.ownerPhone || item.phone || '',
            rules: String(item.rules || ''),
          });
        }
        if (tour) {
          setPanoramaScenes(
            extractTourScenes(tour).map((scene, index) => ({
              ...scene,
              id: scene.id || `existing-${index}`,
              previewUrl: scene.url || scene.path || scene.image,
              order: scene.order ?? index + 1,
            })),
          );
        }
      })
      .catch((err) => setError(getFirebaseErrorMessage(err, 'تعذر تحميل العقار')))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <LoadingState label="جاري تحميل نموذج تعديل العقار" />;
  if (!id || !property) return <EmptyState title="العقار غير موجود" />;

  const canEdit = canEditProperty(user, profile, property);
  if (!canEdit) return <EmptyState title="ليس لديك صلاحية تعديل هذا العقار." actionLabel="العودة لتفاصيل العقار" onAction={() => navigate(`/properties/${id}`)} />;

  const propertyOwnerId = getPropertyOwnerId(property);

  const update = (field: keyof EditableProperty, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleListingTypeChange = (value: string) => {
    setForm((current) => ({
      ...current,
      listing_type: value,
    }));
  };

  const handleLocationChange = (location: LocationPickerChange) => {
    setForm((current) => ({
      ...current,
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      lat: String(location.lat),
      lng: String(location.lng),
      address: location.address || current.address,
      city: location.city || current.city,
      country: location.country || current.country,
      countryCode: location.countryCode || current.countryCode,
    }));
  };

  const handleCountryChange = (countryCode: string) => {
    const country = getCountryByCode(countryCode);
    if (!country) {
      update('countryCode', countryCode);
      return;
    }
    setForm((current) => ({
      ...current,
      country: country.name,
      countryCode: country.code,
      phoneCountryCode: current.phoneCountryCode || country.phoneCode,
      country_code: current.country_code || country.phoneCode,
    }));
  };

  const editCountryOptions =
    form.countryCode && !getCountryByCode(form.countryCode)
      ? [{ value: form.countryCode, label: form.country || form.countryCode }, ...countryOptions]
      : countryOptions;
  const editCityOptions = form.city && !getCitiesByCountry(form.countryCode).includes(form.city) ? [{ value: form.city, label: `قيمة حالية: ${form.city}` }, ...getCitiesByCountry(form.countryCode).map((city) => ({ value: city, label: city }))] : getCitiesByCountry(form.countryCode).map((city) => ({ value: city, label: city }));
  const editTypeOptions = form.property_type && !typeOptions.some((option) => option.value === form.property_type) ? [{ value: form.property_type, label: `قيمة حالية: ${form.property_type}` }, ...typeOptions] : typeOptions;
  const isRentListing = isRentListingType(form.listing_type);
  const isSaleListing = isSaleListingType(form.listing_type);

  const uploadPanoramaScenes = async () => {
    if (panoramaScenes.length === 0) return null;
    const storageOwnerId = propertyOwnerId || user?.uid;
    if (!storageOwnerId) return null;

    const uploadedScenes = await Promise.all(
      panoramaScenes.map(async (scene, index) => {
        if (!scene.file && (scene.url || scene.path)) return scene;
        if (!scene.file) return scene;
        const uploaded = await uploadPanoramaImage(storageOwnerId, scene.file);
        return {
          ...scene,
          url: uploaded.url,
          path: uploaded.path,
          order: scene.order ?? index + 1,
        };
      }),
    );

    return buildPanoramaTourPayload(uploadedScenes);
  };

  const saveDirectOrRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    setWarning(null);
    try {
      const uploadedImages = await Promise.all(newImages.map((file) => uploadPropertyImage(propertyOwnerId || user.uid, file)));
      const nextImages = [...(property.images || []), ...uploadedImages];
      let panoramaTour = null;
      try {
        panoramaTour = await uploadPanoramaScenes();
      } catch {
        setError('تعذر رفع صور الجولة الافتراضية. تحقق من صلاحيات التخزين.');
        return;
      }

      const {
        daily_price,
        daily_price_currency,
        nightly_price,
        nightly_currency,
        selling_price,
        selling_price_currency,
        ...baseForm
      } = form;
      const pricingFields: Partial<Property> = isRentListing
        ? {
            daily_price,
            dailyPrice: daily_price,
            daily_price_currency,
            nightly_price,
            nightlyPrice: nightly_price,
            nightly_currency,
          }
        : isSaleListing
          ? {
              selling_price,
              sellingPrice: selling_price,
              selling_price_currency,
            }
          : {};
      const fields: Partial<Property> = {
        ...baseForm,
        ...pricingFields,
        listing_type: form.listing_type,
        listingType: form.listing_type,
        country: form.country,
        countryCode: form.countryCode,
        latitude: form.latitude,
        longitude: form.longitude,
        lat: form.lat || form.latitude,
        lng: form.lng || form.longitude,
        phoneCountryCode: form.phoneCountryCode,
        country_code: form.country_code || form.phoneCountryCode,
        location: {
          ...(property.location || {}),
          country: form.country,
          countryCode: form.countryCode,
          city: form.city,
          address: form.address,
          latitude: form.latitude,
          longitude: form.longitude,
          lat: form.lat || form.latitude,
          lng: form.lng || form.longitude,
        },
        images: nextImages,
        ...(panoramaTour ? { panorama_tour: panoramaTour, panoramaTour, panoramaTours: panoramaTour } : {}),
      };

      const writeDirect = async () => {
        await updateProperty(id, fields);
        if (panoramaTour) {
          await savePropertyTour(id, panoramaTour).catch(() => {
            setWarning('تم حفظ بيانات الجولة داخل العقار، لكن تعذر تحديث مستند الجولة الفرعي بسبب الصلاحيات.');
          });
        }
      };

      if (isAdmin || isOwner) {
        await writeDirect();
        setSuccess('تم تحديث العقار مباشرة.');
      } else {
        try {
          await writeDirect();
          setSuccess('تم تحديث العقار مباشرة.');
        } catch {
          const { id: _propertyId, ...requestBase } = property;
          const requestRef = await createPropertyRequest({
            ...requestBase,
            ...fields,
            ownerId: user.uid,
            originalPropertyId: id,
            request_type: 'edit',
            status: 'pending',
          });
          if (panoramaTour) {
            await saveRequestTour(requestRef.id, panoramaTour).catch(() => {
              setWarning('تم حفظ بيانات الجولة داخل طلب التعديل، لكن تعذر تحديث مستند الجولة الفرعي بسبب الصلاحيات.');
            });
          }
          setSuccess('تم إرسال طلب تعديل العقار للمراجعة.');
        }
      }
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر حفظ التعديلات حاليًا. تأكد من صلاحياتك أو حاول لاحقًا.'));
    } finally {
      setSaving(false);
    }
  };

  const hide = async () => {
    try {
      await hideProperty(id);
      setSuccess('تم إخفاء العقار.');
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر إخفاء العقار حاليًا. تأكد من صلاحياتك أو حاول لاحقًا.'));
    }
  };

  const remove = async () => {
    try {
      await softDeleteProperty(id);
      setConfirmDelete(false);
      navigate('/my-properties');
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر حذف العقار حاليًا. تأكد من صلاحياتك أو حاول لاحقًا.'));
    }
  };

  return (
    <section className="container section">
      <div className="page-heading">
        <span className="eyebrow">تعديل العقار</span>
        <h1>{property.title || 'عقار بدون عنوان'}</h1>
        <p>سيتم حفظ التعديل مباشرة إذا سمحت الصلاحيات. إذا تعذر ذلك، سيتم إنشاء طلب تعديل للمراجعة.</p>
      </div>
      <ErrorMessage message={error} />
      {warning && <div className="notice">{warning}</div>}
      {success && <div className="form-success">{success}</div>}

      <form className="form-stack wide" onSubmit={saveDirectOrRequest}>
        <div className="form-grid">
          <Input label="العنوان" value={form.title || ''} onChange={(event) => update('title', event.target.value)} />
          <Select label="نوع العقار" value={form.property_type || ''} onChange={(event) => update('property_type', event.target.value)} options={editTypeOptions} />
          <Select label="نوع العرض" value={form.listing_type || ''} onChange={(event) => handleListingTypeChange(event.target.value)} options={listingTypeOptions} />
          <div className="form-grid-full property-pricing-block">
            {isRentListing && (
              <>
                <div className="app-form-row two">
                  <Input label="السعر اليومي" value={form.daily_price || ''} onChange={(event) => update('daily_price', event.target.value)} />
                  <Select label="العملة" value={form.daily_price_currency || ''} onChange={(event) => update('daily_price_currency', event.target.value)} options={currencyOptions} />
                </div>
                <div className="app-form-row two">
                  <Input label="السعر الليلي" value={form.nightly_price || ''} onChange={(event) => update('nightly_price', event.target.value)} />
                  <Select label="العملة" value={form.nightly_currency || ''} onChange={(event) => update('nightly_currency', event.target.value)} options={currencyOptions} />
                </div>
              </>
            )}
            {isSaleListing && (
              <div className="app-form-row two">
                <Input label="سعر البيع" value={form.selling_price || ''} onChange={(event) => update('selling_price', event.target.value)} />
                <Select label="العملة" value={form.selling_price_currency || ''} onChange={(event) => update('selling_price_currency', event.target.value)} options={currencyOptions} />
              </div>
            )}
            {!isRentListing && !isSaleListing && <p className="property-pricing-helper">اختر نوع العرض لعرض حقول السعر المناسبة.</p>}
          </div>
          <Select label="المدينة" value={form.city || ''} onChange={(event) => update('city', event.target.value)} options={[{ value: '', label: 'اختر المدينة' }, ...editCityOptions]} />
          <Select label="الدولة" value={form.countryCode || ''} onChange={(event) => handleCountryChange(event.target.value)} options={editCountryOptions} />
          <Input label="العنوان التفصيلي" value={form.address || ''} onChange={(event) => update('address', event.target.value)} />
          <div className="form-grid-full">
            <button type="button" className={`location-picker-button ${form.latitude && form.longitude ? 'active' : ''}`} onClick={() => setLocationPickerOpen((current) => !current)}>
              {form.latitude && form.longitude ? 'تم تحديد الموقع على الخريطة' : 'اضغط لتحديد الموقع على الخريطة'}
            </button>
            {locationPickerOpen && (
              <LocationPicker
                value={{
                  latitude: form.latitude,
                  longitude: form.longitude,
                  lat: form.lat,
                  lng: form.lng,
                  address: form.address,
                  city: form.city,
                  country: form.country,
                  countryCode: form.countryCode,
                }}
                onChange={handleLocationChange}
                height={370}
              />
            )}
            {(form.latitude || form.longitude) ? (
              <p className="selected-coordinates">الإحداثيات: {form.latitude || '-'}، {form.longitude || '-'}</p>
            ) : (
              <p className="selected-coordinates">يفضل تحديد موقع العقار على الخريطة ليظهر بشكل صحيح للباحثين.</p>
            )}
          </div>
          <Input label="المساحة" value={String(form.area || '')} onChange={(event) => update('area', event.target.value)} />
          <Input label="الحمامات" value={String(form.bathrooms || '')} onChange={(event) => update('bathrooms', event.target.value)} />
          <Input label="غرف النوم" value={String(form.bedrooms || '')} onChange={(event) => update('bedrooms', event.target.value)} />
          <div className="form-grid-full edit-contact-rules-card">
            <h2>القواعد ومعلومات الاتصال</h2>
            <div className="app-form-row phone">
              <CountryDialCodePicker
                value={form.phoneCountryCode || form.country_code || DEFAULT_COUNTRY.phoneCode}
                onChange={(phoneCode) => setForm((current) => ({ ...current, phoneCountryCode: phoneCode, country_code: phoneCode }))}
              />
              <Input label="رقم هاتف التواصل" value={form.contact_number || ''} onChange={(event) => update('contact_number', event.target.value)} />
            </div>
            <Input label="اسم جهة الاتصال" value={form.contact_name || ''} onChange={(event) => update('contact_name', event.target.value)} />
            <TextArea label="القواعد الخاصة بالعقار" value={form.rules || ''} onChange={(event) => update('rules', event.target.value)} />
          </div>
          <TextArea label="الوصف" value={form.description || ''} onChange={(event) => update('description', event.target.value)} />
          <ImageUploader label="إضافة صور جديدة" multiple onChange={setNewImages} />
        </div>

        <PanoramaUploadSection scenes={panoramaScenes} onChange={setPanoramaScenes} />

        <div className="inline-actions">
          <Button type="submit" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</Button>
          <Button type="button" variant="outline" onClick={hide}>إخفاء العقار</Button>
          <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>حذف ناعم</Button>
          <Button as={Link} to={`/properties/${id}`} variant="ghost">عودة للتفاصيل</Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        title="تأكيد الحذف الناعم"
        description="سيتم تعيين status إلى deleted وإخفاء العقار بدون حذف المستند نهائيا."
        confirmLabel="حذف ناعم"
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </section>
  );
}
