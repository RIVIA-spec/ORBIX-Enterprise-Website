import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HotelCard } from '../components/cards/HotelCard';
import { PropertyCard } from '../components/cards/PropertyCard';
import { HeroCarousel } from '../components/home/HeroCarousel';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { LoadingState } from '../components/ui/LoadingState';
import { useFavorites } from '../hooks/useFavorites';
import { useProperties } from '../hooks/useProperties';
import { AR } from '../lib/constants';
import { getVisibleHotels } from '../services/hotelService';
import { filterProperties, isActiveFeaturedProperty } from '../services/propertyService';
import { extractTourImages } from '../services/tourService';
import type { Hotel, Property } from '../types/models';
import { SEO, organizationSchema } from '../components/seo/SEO';
import { SITE_URL } from '../lib/seo';
import { getHomepage, getSiteSettings, listArticles, listGuides, listHomepageBanners, listServices } from '../services/contentGateway';
import type { CmsArticle, CmsBanner, CmsGuide, CmsHomepage, CmsService, CmsSiteSettings } from '../types/content';
import type { HeroSlide } from '../types/models';

function matchesSearch(item: Property | Hotel, query: string) {
  if (!query.trim()) return true;
  const needle = query.trim().toLowerCase();
  const source = [
    'title' in item ? item.title : undefined,
    'name' in item ? item.name : undefined,
    'hotel_name' in item ? item.hotel_name : undefined,
    item.city,
    item.address,
    item.description,
    'category' in item ? item.category : undefined,
    'propertyType' in item ? item.propertyType : undefined,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return source.includes(needle);
}

export function HomePage() {
  const [search, setSearch] = useState('');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [hotelsError, setHotelsError] = useState<string | null>(null);
  const [cmsHomepage, setCmsHomepage] = useState<CmsHomepage | null>(null);
  const [cmsSettings, setCmsSettings] = useState<CmsSiteSettings | null>(null);
  const [cmsBanners, setCmsBanners] = useState<CmsBanner[]>([]);
  const [cmsArticles, setCmsArticles] = useState<CmsArticle[]>([]);
  const [cmsServices, setCmsServices] = useState<CmsService[]>([]);
  const [cmsGuides, setCmsGuides] = useState<CmsGuide[]>([]);
  const [cmsLoading, setCmsLoading] = useState(true);
  const [cmsError, setCmsError] = useState<string | null>(null);
  const { properties, diagnostics, loading, error } = useProperties(8);
  const { favoriteSet, toggle, isAuthenticated } = useFavorites();

  useEffect(() => {
    let active = true;

    getVisibleHotels(6)
      .then((items) => {
        if (active) setHotels(items);
      })
      .catch((err: unknown) => {
        if (active) setHotelsError(err instanceof Error ? err.message : 'تعذر تحميل الفنادق');
      })
      .finally(() => {
        if (active) setHotelsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    Promise.allSettled([getHomepage(), getSiteSettings(), listHomepageBanners(), listArticles(), listServices(), listGuides()])
      .then(([homepage, settings, banners, articles, services, guides]) => {
        if (!active) return;
        if (homepage.status === 'fulfilled') setCmsHomepage(homepage.value);
        if (settings.status === 'fulfilled') setCmsSettings(settings.value);
        if (banners.status === 'fulfilled') setCmsBanners(banners.value);
        if (articles.status === 'fulfilled') setCmsArticles(articles.value.slice(0, 3));
        if (services.status === 'fulfilled') setCmsServices(services.value.slice(0, 3));
        if (guides.status === 'fulfilled') setCmsGuides(guides.value.slice(0, 3));
        const rejected = [homepage, settings, banners, articles, services, guides].find((item) => item.status === 'rejected');
        if (rejected?.status === 'rejected') {
          setCmsError(rejected.reason instanceof Error ? rejected.reason.message : 'Strapi content is unavailable.');
        }
      })
      .finally(() => {
        if (active) setCmsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleProperties = properties;
  const featuredProperties = useMemo(() => visibleProperties.filter(isActiveFeaturedProperty), [visibleProperties]);
  const renderedHomeProperties = featuredProperties.length > 0 ? featuredProperties : visibleProperties;
  const searchedHomeProperties = useMemo(
    () => (search.trim() ? filterProperties(renderedHomeProperties, { text: search }) : renderedHomeProperties),
    [renderedHomeProperties, search],
  );
  const filteredHotels = useMemo(() => hotels.filter((item) => matchesSearch(item, search)), [hotels, search]);
  const featuredTourProperty = useMemo(() => {
    return (
      properties.find((property) => {
        const panorama = property.panorama_tour || property.panoramaTour || property.panoramaTours;
        return extractTourImages(panorama).length > 0;
      }) || null
    );
  }, [properties]);
  const heroSlides = useMemo<HeroSlide[]>(() => {
    const source = cmsHomepage?.heroCarousel?.length ? cmsHomepage.heroCarousel : cmsBanners;
    return source
      .filter((banner) => banner.isActive !== false)
      .map((banner) => ({
        id: String(banner.documentId || banner.id || banner.title),
        imageUrl: banner.imageUrl || banner.image?.url || '',
        title: banner.title,
        subtitle: banner.subtitle,
        badge: banner.badge,
        linkLabel: banner.linkLabel,
        linkUrl: banner.linkUrl,
        order: banner.sortOrder,
        isActive: banner.isActive !== false,
      }));
  }, [cmsBanners, cmsHomepage]);
  const homepageTitle = cmsHomepage?.heroTitle || 'Reality Reimagined';
  const homepageSubtitle = cmsHomepage?.heroSubtitle || 'Visit it before you come';
  const googlePlayUrl = cmsHomepage?.googlePlayUrl || cmsSettings?.googlePlayUrl;
  const appStoreUrl = cmsHomepage?.appStoreUrl || cmsSettings?.appStoreUrl;

  return (
    <>
      <SEO title={cmsHomepage?.seoTitle || cmsSettings?.defaultSeoTitle || 'Orbix | عقارات وفنادق'} description={cmsHomepage?.seoDescription || cmsSettings?.defaultSeoDescription || 'اكتشف العقارات والفنادق المتاحة في Orbix.'} path="/" image={cmsSettings?.defaultOgImage?.url || cmsHomepage?.heroImage?.url} jsonLd={[cmsSettings?.organizationSchemaOverride || organizationSchema, cmsSettings?.websiteSchemaOverride || { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Orbix', url: SITE_URL, inLanguage: 'ar-SA' }]} />
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">{cmsHomepage?.heroLabel || 'Orbix'}</span>
            <h1>{homepageTitle}</h1>
            <p>{homepageSubtitle}</p>
            <div className="hero-actions hero-primary-actions">
              <Button as={Link} to={cmsHomepage?.primaryCtaUrl || '/properties'}>{cmsHomepage?.primaryCtaText || 'تصفح العقارات'}</Button>
              <Button as={Link} to={cmsHomepage?.secondaryCtaUrl || '/map'} variant="secondary">{cmsHomepage?.secondaryCtaText || 'استكشف العقارات على الخريطة'}</Button>
              <Button as={Link} to={featuredTourProperty ? `/properties/${featuredTourProperty.id}/tour` : '/properties'} variant="outline" className="mobile-hidden">الجولة الافتراضية</Button>
              {!isAuthenticated && <Button as={Link} to="/register" variant="outline" className="mobile-hidden">إنشاء حساب</Button>}
            </div>
            {(googlePlayUrl || appStoreUrl) && (
              <div className="hero-actions hero-app-actions" aria-label="App links">
                {googlePlayUrl && <Button as="a" href={googlePlayUrl} variant="outline">Google Play</Button>}
                {appStoreUrl && <Button as="a" href={appStoreUrl} variant="outline">App Store</Button>}
              </div>
            )}
            <div className="home-quick-actions hero-shortcuts" aria-label="روابط سريعة">
              <Button as={Link} to="/properties" variant="outline">العقارات</Button>
              <Button as={Link} to="/map" variant="outline">الخريطة</Button>
              <Button as={Link} to="/favorites" variant="outline">المفضلة</Button>
              <Button as={Link} to={isAuthenticated ? '/profile' : '/login'} variant="ghost">{isAuthenticated ? 'حسابي' : 'دخول'}</Button>
            </div>
            <div className="hero-search-inline">
              <Input label="ابحث" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="المدينة، العنوان، النوع..." />
            </div>
          </div>
        </div>
      </section>

      <section className="container section home-cms-section">
        {cmsError && <EmptyState title="Strapi content unavailable" description="Core property, hotel, account, and booking features continue to use Firebase." />}
        {cmsLoading && <LoadingState label="Loading content" />}
        {!cmsLoading && !cmsError && heroSlides.length === 0 && <EmptyState title="No homepage banners published yet" description="The page is using built-in content until banners are published in Strapi." />}
        {!cmsLoading && <HeroCarousel cmsSlides={heroSlides.length > 0 ? heroSlides : undefined} />}
      </section>

      <section className="container section home-properties-section">
        <div className="section-header">
          <div>
            <h2>{featuredProperties.length > 0 ? 'عقارات مميزة' : 'عقارات متاحة'}</h2>
            <p>{featuredProperties.length > 0 ? 'عقارات مختارة تظهر أولا لأنها مميزة أو مدفوعة.' : 'لا توجد عقارات مميزة حاليا، نعرض لك العقارات المتاحة.'}</p>
          </div>
          <Button as={Link} to="/properties" variant="ghost">عرض الكل</Button>
        </div>

        {import.meta.env.DEV && import.meta.env.VITE_SHOW_DEBUG_COUNTS === 'true' && (
          <div className="notice">
            loadedPropertiesCount: {diagnostics?.loadedCount ?? properties.length} · visiblePropertiesCount: {diagnostics?.visibleCount ?? properties.length} · featuredPropertiesCount: {featuredProperties.length} · renderedHomePropertiesCount: {renderedHomeProperties.length} · filteredPropertiesCount: {searchedHomeProperties.length}
          </div>
        )}
        {loading && <LoadingState label="جاري تحميل العقارات" />}
        {error && (
          <EmptyState
            title="تعذر تحميل العقارات"
            description={String(error).includes('permission-denied') ? 'تعذر عرض العقارات حاليًا. يرجى المحاولة لاحقًا.' : error}
          />
        )}
        {!loading && !error && visibleProperties.length === 0 && (
          <EmptyState
            title={properties.length === 0 ? 'لا توجد عقارات متاحة حاليًا.' : 'لا توجد نتائج مطابقة للبحث الحالي.'}
            description={properties.length === 0 ? diagnostics?.propertyRequestsNote || 'لا توجد عقارات متاحة حاليًا، سنعرض لك العقارات فور إضافتها.' : 'جرب تعديل البحث.'}
          />
        )}
        <div className="cards-grid home-property-grid">
          {searchedHomeProperties.map((property) => (
            <PropertyCard key={property.id} property={property} isFavorite={favoriteSet.has(property.id)} onToggleFavorite={toggle} />
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-header">
          <div>
            <h2>Orbix content</h2>
            <p>Articles, services, and guides are managed in Strapi. Properties and hotels remain in Firebase.</p>
          </div>
          <Button as={Link} to="/articles" variant="ghost">View content</Button>
        </div>
        {cmsLoading && <LoadingState label="Loading Strapi content" />}
        {cmsError && <EmptyState title="Content fallback active" description="Strapi is unavailable, so Firebase-backed experiences continue normally." />}
        {!cmsLoading && !cmsError && cmsArticles.length + cmsServices.length + cmsGuides.length === 0 && <EmptyState title="No Strapi content published yet" />}
        <div className="cards-grid">
          {cmsArticles.map((item) => <article className="card content-card" key={item.documentId || item.id || item.slug}><span className="eyebrow">Article</span><h2><Link to={'/articles/' + item.slug}>{item.title}</Link></h2><p>{item.excerpt}</p></article>)}
          {cmsServices.map((item) => <article className="card content-card" key={item.documentId || item.id || item.slug}><span className="eyebrow">Service</span><h2><Link to={'/services/' + item.slug}>{item.title}</Link></h2><p>{item.summary}</p></article>)}
          {cmsGuides.map((item) => <article className="card content-card" key={item.documentId || item.id || item.slug}><span className="eyebrow">Guide</span><h2><Link to={'/guides/' + item.slug}>{item.title}</Link></h2><p>{item.summary}</p></article>)}
        </div>
      </section>

      <section id="hotels" className="container section">
        <div className="section-header">
          <div>
            <h2>{AR.hotels}</h2>
            <p>استكشف الفنادق والغرف المتاحة للحجز.</p>
          </div>
          <Button as={Link} to="/hotels" variant="ghost">عرض الكل</Button>
        </div>

        {hotelsLoading && <LoadingState label="جاري تحميل الفنادق" />}
        {hotelsError && <EmptyState title="تعذر تحميل الفنادق" description={hotelsError} />}
        {!hotelsLoading && !hotelsError && filteredHotels.length === 0 && (
          <EmptyState title="لا توجد فنادق متاحة حاليا." />
        )}
        <div className="cards-grid hotel-grid">
          {filteredHotels.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      </section>
    </>
  );
}
