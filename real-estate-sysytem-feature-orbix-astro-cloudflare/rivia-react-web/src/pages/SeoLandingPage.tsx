import { Link, useParams } from 'react-router-dom';
import { PropertyCard } from '../components/cards/PropertyCard';
import { SEO } from '../components/seo/SEO';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { useProperties } from '../hooks/useProperties';
import { slugify } from '../lib/seo';

type LandingKind = 'buy' | 'rent' | 'city';

export function SeoLandingPage({ kind }: { kind: LandingKind }) {
  const { citySlug } = useParams();
  const { properties, loading, error } = useProperties(80);
  const city = properties.find((item) => slugify(item.city || item.location?.city) === citySlug)?.city || citySlug?.replace(/-/g, ' ');
  const purpose = kind === 'buy' ? 'عقارات للبيع' : kind === 'rent' ? 'عقارات للإيجار' : 'عقارات';
  const title = `${purpose}${city ? ` في ${city}` : ''} | Orbix`;
  const description = `اكتشف ${purpose}${city ? ` في ${city}` : ''} على Orbix، مع تفاصيل الأسعار والموقع والصور.`;
  const path = kind === 'city' ? `/city/${citySlug}` : citySlug ? `/${kind}/${citySlug}` : `/${kind}`;
  const filtered = properties.filter((item) => {
    const itemCity = slugify(item.city || item.location?.city);
    const listing = String(item.listingType || item.listing_type || item.type || item.category || item.propertyType || '').toLowerCase();
    return (!citySlug || itemCity === citySlug) && (kind === 'city' || (kind === 'buy' ? /sale|buy|بيع/.test(listing) : /rent|lease|إيجار|ايجار/.test(listing)));
  });
  return <section className="container section">
    <SEO title={title} description={description} path={path} />
    <header className="section-header"><div><h1>{purpose}{city ? ` في ${city}` : ''}</h1><p>{description}</p></div></header>
    <nav className="inline-actions" aria-label="روابط عقارية"><Link to="/buy">شراء</Link><Link to="/rent">إيجار</Link><Link to="/hotels">فنادق</Link><Link to="/properties">كل العقارات</Link></nav>
    {loading && <LoadingState label="جاري تحميل العقارات" />}
    {error && <EmptyState title="تعذر تحميل العقارات" description={error} />}
    {!loading && !error && <div className="cards-grid">{filtered.map((property) => <PropertyCard key={property.id} property={property} />)}</div>}
    {!loading && !error && filtered.length === 0 && <EmptyState title="لا توجد إعلانات مطابقة حالياً" />}
  </section>;
}
