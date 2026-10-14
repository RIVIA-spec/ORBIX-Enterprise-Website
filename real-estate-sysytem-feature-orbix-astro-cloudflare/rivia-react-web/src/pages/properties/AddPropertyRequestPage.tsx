import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocationPicker, type LocationPickerChange } from '../../components/map/LocationPicker';
import { Button } from '../../components/ui/Button';
import { CountryDialCodePicker } from '../../components/ui/CountryDialCodePicker';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { useAuth } from '../../hooks/useAuth';
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY, getCountryByCode, getCountryByName } from '../../lib/countries';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { countryFlag, countryName, localizedCurrencyLabel, type Language, type TextDirection, useTranslation } from '../../lib/i18n';
import { FEATURE_OPTIONS, PROPERTY_TYPE_OPTIONS, getCitiesByCountry } from '../../lib/propertyOptions';
import { createPropertyRequest, getGlobalFeatures, getPropertyCategories } from '../../services/propertyRequestService';
import { uploadPanoramaImage, uploadPropertyImage } from '../../services/storageService';
import { buildPanoramaTourPayload, saveRequestTour, type PanoramaPayloadScene } from '../../services/tourService';
import type { Category } from '../../types/models';

type FormState = {
  title: string;
  description: string;
  property_type: string;
  listing_type: string;
  offerType: OfferType;
  rentalPeriod: RentalPeriod;
  city: string;
  country: string;
  countryCode: string;
  address: string;
  latitude: string;
  longitude: string;
  lat: string;
  lng: string;
  area: string;
  area_unit: string;
  daily_price: string;
  daily_price_currency: string;
  monthly_price: string;
  yearly_price: string;
  currency: string;
  selling_price: string;
  selling_price_currency: string;
  starting_price: string;
  developer_name: string;
  expected_delivery_date: string;
  construction_progress: string;
  payment_plan: string;
  down_payment: string;
  number_of_buildings: string;
  total_units: string;
  project_status: string;
  bathrooms: string;
  bedrooms: string;
  property_category_id: string;
  property_category_title: string;
  country_code: string;
  phoneCountryCode: string;
  contact_number: string;
  contact_name: string;
  rules: string;
};

type OfferType = 'sale' | 'rent' | 'offPlan';
type RentalPeriod = 'daily' | 'monthly' | 'yearly';
type Translate = ReturnType<typeof useTranslation>['t'];

const OFFER_TYPE_OPTIONS: Array<{ value: OfferType; labelKey: string; listingType: string }> = [
  { value: 'sale', labelKey: 'addProperty.offer.sale', listingType: 'Sale' },
  { value: 'rent', labelKey: 'addProperty.offer.rent', listingType: 'Rent' },
  { value: 'offPlan', labelKey: 'addProperty.offer.offPlan', listingType: 'Off-plan / New Project' },
];

const RENTAL_PERIOD_OPTIONS: Array<{ value: RentalPeriod; labelKey: string }> = [
  { value: 'daily', labelKey: 'addProperty.rental.daily' },
  { value: 'monthly', labelKey: 'addProperty.rental.monthly' },
  { value: 'yearly', labelKey: 'addProperty.rental.yearly' },
];

const PROJECT_STATUS_OPTIONS = [
  { value: 'Planning', labelKey: 'addProperty.projectStatus.planning' },
  { value: 'Under Construction', labelKey: 'addProperty.projectStatus.underConstruction' },
  { value: 'Ready', labelKey: 'addProperty.projectStatus.ready' },
];

const PROPERTY_TYPE_LABEL_KEYS = PROPERTY_TYPE_OPTIONS.map((_, index) => `propertyType.${index}`);
const FEATURE_LABEL_KEYS = FEATURE_OPTIONS.map((_, index) => `feature.${index}`);

const initialState: FormState = {
  title: '',
  description: '',
  property_type: '',
  listing_type: 'Sale',
  offerType: 'sale',
  rentalPeriod: 'monthly',
  city: '',
  country: DEFAULT_COUNTRY.name,
  countryCode: DEFAULT_COUNTRY.code,
  address: '',
  latitude: '',
  longitude: '',
  lat: '',
  lng: '',
  area: '',
  area_unit: 'm2',
  daily_price: '',
  daily_price_currency: DEFAULT_COUNTRY.currency,
  monthly_price: '',
  yearly_price: '',
  currency: DEFAULT_COUNTRY.currency,
  selling_price: '',
  selling_price_currency: DEFAULT_COUNTRY.currency,
  starting_price: '',
  developer_name: '',
  expected_delivery_date: '',
  construction_progress: '',
  payment_plan: '',
  down_payment: '',
  number_of_buildings: '',
  total_units: '',
  project_status: 'Planning',
  bathrooms: '',
  bedrooms: '',
  property_category_id: '',
  property_category_title: '',
  country_code: DEFAULT_COUNTRY.phoneCode,
  phoneCountryCode: DEFAULT_COUNTRY.phoneCode,
  contact_number: '',
  contact_name: '',
  rules: '',
};

const fallbackFeatures = FEATURE_OPTIONS;
const imagePreview = (file: File | null) => (file ? URL.createObjectURL(file) : '');

export function AddPropertyRequestPage() {
  const navigate = useNavigate();
  const { t, language, direction, locale } = useTranslation();
  const { user, profile } = useAuth();
  const [form, setForm] = useState<FormState>(initialState);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [panoramaScenes, setPanoramaScenes] = useState<PanoramaPayloadScene[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getPropertyCategories(), getGlobalFeatures()])
      .then(([categoryItems, featureItems]) => {
        if (!active) return;
        setCategories(categoryItems);
        setAvailableFeatures(featureItems.length > 0 ? featureItems : fallbackFeatures);
      })
      .catch((err: unknown) => {
        setAvailableFeatures(fallbackFeatures);
        setError(getFirebaseErrorMessage(err, t('addProperty.metaError')));
      })
      .finally(() => active && setLoadingMeta(false));
    return () => {
      active = false;
    };
  }, [t]);

  const categoryOptions = useMemo(() => {
    const options =
      categories.length > 0
        ? categories.map((category) => ({ value: category.id, label: category.title || category.id }))
        : PROPERTY_TYPE_OPTIONS.map((type, index) => ({ value: type, label: t(PROPERTY_TYPE_LABEL_KEYS[index]) }));
    const hasProject = options.some((option) => option.label.trim().toLowerCase() === 'project' || option.value.trim().toLowerCase() === 'project');
    return [{ value: '', label: t('addProperty.selectPropertyType') }, ...options, ...(hasProject ? [] : [{ value: 'Project', label: t('propertyType.project') }])];
  }, [categories, t]);

  const cityOptions = useMemo(
    () =>
      getCitiesByCountry(form.countryCode).map((city, index) => ({
        value: city,
        label: t(`city.${form.countryCode}.${index}`),
      })),
    [form.countryCode, t],
  );

  const countryOptions = useMemo(
    () =>
      COUNTRY_OPTIONS.map((country) => ({
        value: country.code,
        label: `${countryFlag(country.code)} ${countryName(country.code, language)} (${country.phoneCode})`,
      })),
    [language],
  );

  const currencyOptions = useMemo(() => {
    const currencies = [...new Set([...COUNTRY_OPTIONS.map((country) => country.currency), 'USD'])];
    return currencies.map((currency) => ({ value: currency, label: localizedCurrencyLabel(currency, language) }));
  }, [language]);

  const hasSelectedLocation = Boolean(form.latitude && form.longitude);
  const isProjectProperty = form.property_type.trim().toLowerCase() === 'project';

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleOfferTypeChange = (value: string) => {
    const offerType = value as OfferType;
    const option = OFFER_TYPE_OPTIONS.find((item) => item.value === offerType) || OFFER_TYPE_OPTIONS[0];
    setForm((current) => ({
      ...current,
      offerType,
      listing_type: option.listingType,
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
    const country = getCountryByCode(countryCode) || DEFAULT_COUNTRY;
    setForm((current) => {
      const currentCountry = getCountryByCode(current.countryCode) || getCountryByName(current.country);
      const shouldSyncPhoneCode = !current.phoneCountryCode || current.phoneCountryCode === currentCountry?.phoneCode;
      return {
        ...current,
        country: country.name,
        countryCode: country.code,
        city: getCitiesByCountry(country.code).includes(current.city) ? current.city : '',
        country_code: shouldSyncPhoneCode ? country.phoneCode : current.country_code,
        phoneCountryCode: shouldSyncPhoneCode ? country.phoneCode : current.phoneCountryCode,
        daily_price_currency: current.daily_price_currency || country.currency,
        currency: current.currency || country.currency,
        selling_price_currency: current.selling_price_currency || country.currency,
      };
    });
  };

  const handlePhoneCountryCodeChange = (phoneCode: string) => {
    setForm((current) => ({
      ...current,
      country_code: phoneCode,
      phoneCountryCode: phoneCode,
    }));
  };

  const handleCategory = (categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId);
    setForm((current) => ({
      ...current,
      property_category_id: categoryId,
      property_category_title: category?.title || categoryId,
      property_type: category?.title || categoryId || current.property_type,
    }));
  };

  const uploadPanoramaScenes = async () => {
    if (!user || panoramaScenes.length === 0) return null;

    const uploadedScenes = await Promise.all(
      panoramaScenes.map(async (scene, index) => {
        if (!scene.file && (scene.url || scene.path)) return scene;
        if (!scene.file) return scene;
        const uploaded = await uploadPanoramaImage(user.uid, scene.file);
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!user.emailVerified) {
      setError(t('addProperty.verifyEmailError'));
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const mainImage = mainImageFile ? await uploadPropertyImage(user.uid, mainImageFile) : '';
      const images = await Promise.all(imageFiles.map((file) => uploadPropertyImage(user.uid, file)));
      let panoramaTour = null;
      try {
        panoramaTour = await uploadPanoramaScenes();
      } catch {
        setError(t('addProperty.panoramaUploadError'));
        return;
      }

      const {
        offerType,
        rentalPeriod,
        daily_price,
        daily_price_currency,
        monthly_price,
        yearly_price,
        currency,
        selling_price,
        selling_price_currency,
        starting_price,
        developer_name,
        expected_delivery_date,
        construction_progress,
        payment_plan,
        down_payment,
        number_of_buildings,
        total_units,
        project_status,
        bathrooms,
        bedrooms,
        ...baseForm
      } = form;
      const visibleCurrency = currency || selling_price_currency || daily_price_currency;
      const rentPriceByPeriod: Record<RentalPeriod, string> = {
        daily: daily_price,
        monthly: monthly_price,
        yearly: yearly_price,
      };
      const rentLegacyPriceKey: Record<RentalPeriod, 'daily_price' | 'monthly_price' | 'yearly_price'> = {
        daily: 'daily_price',
        monthly: 'monthly_price',
        yearly: 'yearly_price',
      };
      const rentPrice = rentPriceByPeriod[rentalPeriod];
      const salePricing = selling_price
        ? {
            pricing: { salePrice: selling_price, currency: visibleCurrency },
            selling_price,
            sellingPrice: selling_price,
            salePrice: selling_price,
            selling_price_currency: visibleCurrency,
            currency: visibleCurrency,
            price: selling_price,
          }
        : {};
      const rentPricing = rentPrice
        ? {
            pricing: { rentalPeriod, [`${rentalPeriod}Price`]: rentPrice, currency: visibleCurrency },
            [rentLegacyPriceKey[rentalPeriod]]: rentPrice,
            rentPrice,
            currency: visibleCurrency,
            ...(rentalPeriod === 'daily' ? { daily_price_currency: visibleCurrency } : {}),
            price: rentPrice,
          }
        : {};
      const offPlanPricing = starting_price
        ? {
            pricing: { startingPrice: starting_price, currency: visibleCurrency },
            starting_price,
            startingPrice: starting_price,
            selling_price: starting_price,
            sellingPrice: starting_price,
            selling_price_currency: visibleCurrency,
            currency: visibleCurrency,
            price: starting_price,
          }
        : {};
      const projectInfo =
        offerType === 'offPlan' || isProjectProperty
          ? {
              ...(offerType === 'offPlan'
                ? {
                    developerName: developer_name,
                    expectedDeliveryDate: expected_delivery_date,
                    constructionProgress: construction_progress,
                    paymentPlan: payment_plan,
                    ...(down_payment ? { downPayment: down_payment } : {}),
                  }
                : {}),
              ...(isProjectProperty
                ? {
                    numberOfBuildings: number_of_buildings,
                    totalUnits: total_units,
                    projectStatus: project_status,
                  }
                : {}),
            }
          : null;
      const dynamicPayload = offerType === 'rent' ? rentPricing : offerType === 'offPlan' ? offPlanPricing : salePricing;

      const requestRef = await createPropertyRequest({
        ...baseForm,
        ...dynamicPayload,
        offerType,
        property_type: form.property_type,
        listing_type: form.listing_type,
        listingType: form.listing_type,
        country: form.country,
        countryCode: form.countryCode,
        latitude: form.latitude,
        longitude: form.longitude,
        lat: form.lat || form.latitude,
        lng: form.lng || form.longitude,
        phoneCountryCode: form.phoneCountryCode || form.country_code,
        location: {
          country: form.country,
          countryCode: form.countryCode,
          city: form.city,
          address: form.address,
          latitude: form.latitude,
          longitude: form.longitude,
          lat: form.lat || form.latitude,
          lng: form.lng || form.longitude,
        },
        area: form.area,
        ...(!isProjectProperty ? { bathrooms, bedrooms } : {}),
        ...(projectInfo ? { projectInfo } : {}),
        contact_number: `${form.country_code}${form.contact_number}`.trim(),
        features: selectedFeatures,
        mainImage,
        images,
        ...(panoramaTour
          ? {
              panorama_tour: panoramaTour,
              panoramaTour,
              panoramaTours: panoramaTour,
              tourImages: panoramaTour.imageUrls,
              panoramaImages: panoramaTour.imageUrls,
            }
          : {}),
        ownerId: user.uid,
        status: 'pending',
        request_type: 'publish',
      });

      if (panoramaTour) {
        await saveRequestTour(requestRef.id, panoramaTour).catch(() => {
          console.warn('Unable to save the request tour subdocument. Tour data was saved on the request.');
        });
      }

      setSuccess(t('addProperty.success'));
      setForm(initialState);
      setSelectedFeatures([]);
      setMainImageFile(null);
      setImageFiles([]);
      setPanoramaScenes([]);
      setLocationPickerOpen(false);
    } catch (err) {
      setError(getFirebaseErrorMessage(err, t('addProperty.submitError')));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMeta) return <LoadingState label={t('addProperty.loading')} />;

  return (
    <main className="add-property-app add-property-page" dir={direction} lang={language}>
      <header className="add-property-appbar">
        <button type="button" className="add-property-back" onClick={() => navigate(-1)} aria-label={t('common.back')}>
          ‹
        </button>
        <h1>{t('addProperty.title')}</h1>
      </header>

      <section className="add-property-shell">
        {!user?.emailVerified && <EmptyState title={t('addProperty.emailRequired.title')} description={t('addProperty.emailRequired.description')} />}
        {profile?.isVerified === false && <div className="notice">{t('addProperty.identityNotice')}</div>}
        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <form className="add-property-form" onSubmit={handleSubmit}>
          <AppCard title={t('addProperty.basic.title')} helper={t('addProperty.basic.helper')}>
            <AppInput label={t('addProperty.field.title')} value={form.title} onChange={(value) => update('title', value)} required language={language} direction={direction} />
            <AppTextArea label={t('addProperty.field.description')} value={form.description} onChange={(value) => update('description', value)} required language={language} direction={direction} />
            <AppSelect label={t('addProperty.field.propertyType')} value={form.property_category_id} onChange={handleCategory} options={categoryOptions} language={language} direction={direction} />
            <AppSelect
              label={t('addProperty.field.offerType')}
              value={form.offerType}
              onChange={handleOfferTypeChange}
              options={OFFER_TYPE_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
              language={language}
              direction={direction}
            />
            <div className="app-form-row two">
              <AppInput label={t('addProperty.field.area')} value={form.area} onChange={(value) => update('area', value)} type="number" language={language} direction={direction} />
              <AppSelect
                label={t('addProperty.field.unit')}
                value={form.area_unit}
                onChange={(value) => update('area_unit', value)}
                options={[
                  { value: 'm2', label: t('addProperty.unit.squareMeters') },
                  { value: 'ft2', label: t('addProperty.unit.squareFeet') },
                ]}
                language={language}
                direction={direction}
              />
            </div>
            <PricingFields form={form} update={update} currencyOptions={currencyOptions} t={t} language={language} direction={direction} />
            {form.offerType === 'offPlan' && (
              <DynamicFieldGroup>
                <div className="app-form-row two">
                  <AppInput label={t('addProperty.field.developerName')} value={form.developer_name} onChange={(value) => update('developer_name', value)} required language={language} direction={direction} />
                  <AppInput label={t('addProperty.field.expectedDeliveryDate')} value={form.expected_delivery_date} onChange={(value) => update('expected_delivery_date', value)} required type="date" language={language} direction={direction} locale={locale} />
                </div>
                <div className="app-form-row two">
                  <AppInput label={t('addProperty.field.constructionProgress')} value={form.construction_progress} onChange={(value) => update('construction_progress', value)} required type="number" min="0" max="100" language={language} direction={direction} />
                  <AppInput label={t('addProperty.field.downPayment')} value={form.down_payment} onChange={(value) => update('down_payment', value)} type="number" language={language} direction={direction} />
                </div>
                <AppTextArea label={t('addProperty.field.paymentPlan')} value={form.payment_plan} onChange={(value) => update('payment_plan', value)} required language={language} direction={direction} />
              </DynamicFieldGroup>
            )}
            {isProjectProperty && (
              <DynamicFieldGroup>
                <div className="app-form-row two">
                  <AppInput label={t('addProperty.field.numberOfBuildings')} value={form.number_of_buildings} onChange={(value) => update('number_of_buildings', value)} required type="number" language={language} direction={direction} />
                  <AppInput label={t('addProperty.field.totalUnits')} value={form.total_units} onChange={(value) => update('total_units', value)} required type="number" language={language} direction={direction} />
                </div>
                <AppSelect
                  label={t('addProperty.field.projectStatus')}
                  value={form.project_status}
                  onChange={(value) => update('project_status', value)}
                  options={PROJECT_STATUS_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
                  language={language}
                  direction={direction}
                />
              </DynamicFieldGroup>
            )}
          </AppCard>

          <AppCard title={t('addProperty.location.title')} helper={t('addProperty.location.helper')}>
            <AppSelect label={t('addProperty.field.country')} value={form.countryCode} onChange={handleCountryChange} options={countryOptions} language={language} direction={direction} />
            <AppSelect label={t('addProperty.field.city')} value={form.city} onChange={(value) => update('city', value)} options={[{ value: '', label: t('addProperty.selectCity') }, ...cityOptions]} language={language} direction={direction} />
            <AppInput label={t('addProperty.field.address')} value={form.address} onChange={(value) => update('address', value)} language={language} direction={direction} />
            <button type="button" className={`location-select-button ${hasSelectedLocation ? 'active' : ''}`} onClick={() => setLocationPickerOpen((current) => !current)}>
              {hasSelectedLocation ? t('addProperty.location.selectedButton') : t('addProperty.location.selectButton')}
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
                height={390}
              />
            )}
            {hasSelectedLocation ? (
              <p className="selected-coordinate-chip">{t('common.coordinates', { lat: Number(form.latitude).toFixed(4), lng: Number(form.longitude).toFixed(4) })}</p>
            ) : (
              <p className="selected-coordinates">{t('addProperty.location.help')}</p>
            )}
          </AppCard>

          <AppCard title={t('addProperty.features.title')} helper={t('addProperty.features.helper')}>
            {!isProjectProperty && (
              <DynamicFieldGroup>
                <div className="app-form-row two">
                  <AppInput label={t('addProperty.field.bedrooms')} value={form.bedrooms} onChange={(value) => update('bedrooms', value)} type="number" language={language} direction={direction} />
                  <AppInput label={t('addProperty.field.bathrooms')} value={form.bathrooms} onChange={(value) => update('bathrooms', value)} type="number" language={language} direction={direction} />
                </div>
              </DynamicFieldGroup>
            )}
            <div className="app-feature-list">
              {availableFeatures.map((feature) => (
                <label key={feature} className="app-feature-row">
                  <span>{featureLabel(feature, t)}</span>
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(feature)}
                    onChange={(event) =>
                      setSelectedFeatures((current) => (event.target.checked ? [...current, feature] : current.filter((item) => item !== feature)))
                    }
                  />
                </label>
              ))}
            </div>
          </AppCard>

          <AppCard title={t('addProperty.images.title')} helper={t('addProperty.images.helper')}>
            <ImageTile label={t('addProperty.images.mainUpload')} hint={t('addProperty.images.uploadHint')} onChange={(files) => setMainImageFile(files[0] || null)} />
            <ImageTile label={t('addProperty.images.galleryUpload')} hint={t('addProperty.images.uploadHint')} multiple onChange={(newFiles) => setImageFiles((prev) => [...prev, ...newFiles])} />

            <div className="app-image-preview-grid">
              {mainImageFile && (
                <figure className="app-image-preview main">
                  <img src={imagePreview(mainImageFile)} alt={t('addProperty.images.main')} />
                  <figcaption>{t('addProperty.images.main')}</figcaption>
                </figure>
              )}
              {imageFiles.map((file, index) => {
                const caption = index === 0 && !mainImageFile ? t('addProperty.images.main') : t('addProperty.images.item', { index: index + 1 });
                return (
                  <figure key={`${file.name}-${index}`} className="app-image-preview">
                    <img src={imagePreview(file)} alt={caption} />
                    <figcaption>{caption}</figcaption>
                  </figure>
                );
              })}
            </div>
          </AppCard>

          <AppCard title={t('addProperty.panorama.title')} helper={t('addProperty.panorama.helper')}>
            {panoramaScenes.map((scene, index) => (
              <div key={index} className="panorama-scene-row">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setPanoramaScenes((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, file, order: itemIndex + 1 } : item)));
                  }}
                  dir={direction}
                  lang={language}
                />
                {scene.file && <span>{t('addProperty.panorama.fileSelected', { name: scene.file.name })}</span>}
                <button type="button" onClick={() => setPanoramaScenes((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}>
                  {t('common.delete')}
                </button>
              </div>
            ))}

            <button type="button" onClick={() => setPanoramaScenes((prev) => [...prev, { order: prev.length + 1, file: null }])}>
              + {t('addProperty.panorama.addScene')}
            </button>
          </AppCard>

          <AppCard title={t('addProperty.contact.title')} helper={t('addProperty.contact.helper')}>
            <div className="app-form-row phone">
              <CountryDialCodePicker value={form.phoneCountryCode || form.country_code} onChange={handlePhoneCountryCodeChange} />
              <AppInput label={t('addProperty.field.contactPhone')} value={form.contact_number} onChange={(value) => update('contact_number', value)} type="tel" language={language} direction={direction} />
            </div>
            <AppInput label={t('addProperty.field.contactName')} value={form.contact_name} onChange={(value) => update('contact_name', value)} language={language} direction={direction} />
            <AppTextArea label={t('addProperty.field.rules')} value={form.rules} onChange={(value) => update('rules', value)} language={language} direction={direction} />
          </AppCard>

          <div className="add-property-submit">
            <Button type="submit" disabled={submitting || !user?.emailVerified} className="add-property-submit-button">
              {submitting ? t('addProperty.submitting') : t('addProperty.submit')}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}

function featureLabel(feature: string, t: Translate) {
  const index = FEATURE_OPTIONS.indexOf(feature);
  return index >= 0 ? t(FEATURE_LABEL_KEYS[index]) : feature;
}

function AppCard({ title, helper, children }: { title: string; helper: string; children: ReactNode }) {
  return (
    <section className="app-property-card">
      <div className="app-card-heading">
        <h2>{title}</h2>
        <p>{helper}</p>
      </div>
      <div className="app-card-divider" />
      <div className="app-card-body">{children}</div>
    </section>
  );
}

function DynamicFieldGroup({ children }: { children: ReactNode }) {
  return <div className="dynamic-field-group">{children}</div>;
}

type FormUpdater = (field: keyof FormState, value: string) => void;

function PricingFields({
  form,
  update,
  currencyOptions,
  t,
  language,
  direction,
}: {
  form: FormState;
  update: FormUpdater;
  currencyOptions: Array<{ value: string; label: string }>;
  t: Translate;
  language: Language;
  direction: TextDirection;
}) {
  const rentPriceField: Record<RentalPeriod, keyof FormState> = {
    daily: 'daily_price',
    monthly: 'monthly_price',
    yearly: 'yearly_price',
  };
  const rentPriceLabel: Record<RentalPeriod, string> = {
    daily: t('addProperty.price.daily'),
    monthly: t('addProperty.price.monthly'),
    yearly: t('addProperty.price.yearly'),
  };

  if (form.offerType === 'rent') {
    const priceField = rentPriceField[form.rentalPeriod];
    return (
      <DynamicFieldGroup>
        <AppSelect
          label={t('addProperty.field.rentalPeriod')}
          value={form.rentalPeriod}
          onChange={(value) => update('rentalPeriod', value)}
          options={RENTAL_PERIOD_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
          language={language}
          direction={direction}
        />
        <div className="app-form-row two">
          <AppInput label={rentPriceLabel[form.rentalPeriod]} value={form[priceField]} onChange={(value) => update(priceField, value)} required type="number" language={language} direction={direction} />
          <AppSelect label={t('addProperty.field.currency')} value={form.currency} onChange={(value) => update('currency', value)} options={currencyOptions} language={language} direction={direction} />
        </div>
      </DynamicFieldGroup>
    );
  }

  if (form.offerType === 'offPlan') {
    return (
      <DynamicFieldGroup>
        <div className="app-form-row two">
          <AppInput label={t('addProperty.price.startingFrom')} value={form.starting_price} onChange={(value) => update('starting_price', value)} required type="number" language={language} direction={direction} />
          <AppSelect label={t('addProperty.field.currency')} value={form.currency} onChange={(value) => update('currency', value)} options={currencyOptions} language={language} direction={direction} />
        </div>
      </DynamicFieldGroup>
    );
  }

  return (
    <DynamicFieldGroup>
      <div className="app-form-row two">
        <AppInput label={t('addProperty.price.sale')} value={form.selling_price} onChange={(value) => update('selling_price', value)} required type="number" language={language} direction={direction} />
        <AppSelect label={t('addProperty.field.currency')} value={form.selling_price_currency} onChange={(value) => update('selling_price_currency', value)} options={currencyOptions} language={language} direction={direction} />
      </div>
    </DynamicFieldGroup>
  );
}

function AppInput({
  label,
  value,
  onChange,
  required = false,
  type = 'text',
  min,
  max,
  language,
  direction,
  locale,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  min?: string;
  max?: string;
  language: Language;
  direction: TextDirection;
  locale?: string;
}) {
  const inputDirection = type === 'number' || type === 'date' || type === 'tel' ? 'ltr' : direction;
  return (
    <label className="app-field">
      <span>{label}</span>
      <div className="app-input-shell">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          placeholder={label}
          type={type}
          min={min}
          max={max}
          inputMode={type === 'number' ? 'decimal' : type === 'tel' ? 'tel' : undefined}
          dir={inputDirection}
          lang={locale || language}
        />
      </div>
    </label>
  );
}

function AppTextArea({
  label,
  value,
  onChange,
  required = false,
  language,
  direction,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  language: Language;
  direction: TextDirection;
}) {
  return (
    <label className="app-field">
      <span>{label}</span>
      <div className="app-input-shell app-textarea-shell">
        <textarea value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={label} dir={direction} lang={language} />
      </div>
    </label>
  );
}

function AppSelect({
  label,
  value,
  onChange,
  options,
  language,
  direction,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  language: Language;
  direction: TextDirection;
}) {
  return (
    <label className="app-field">
      <span>{label}</span>
      <div className="app-input-shell">
        <select value={value} onChange={(event) => onChange(event.target.value)} dir={direction} lang={language}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function ImageTile({ label, hint, multiple = false, onChange }: { label: string; hint: string; multiple?: boolean; onChange: (files: File[]) => void }) {
  return (
    <label className="app-image-upload-tile">
      <span className="app-image-plus">+</span>
      <strong>{label}</strong>
      <small>{hint}</small>
      <input type="file" accept="image/*" multiple={multiple} onChange={(event) => onChange(Array.from(event.target.files || []))} />
    </label>
  );
}
