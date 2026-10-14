import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { VirtualTourViewer } from '../../components/tour/VirtualTourViewer';
import { useProperty } from '../../hooks/useProperties';
import { absoluteUrl, breadcrumbSchema, firstImage, getPropertySeoMetadata } from '../../lib/seo';
import { getPropertyTour } from '../../services/tourService';
import type { PropertyPanorama } from '../../types/models';

export function PropertyTourPage() {
  const { id } = useParams();
  const { property, loading, error } = useProperty(id);
  const [tour, setTour] = useState<PropertyPanorama | null>(null);
  const [tourLoading, setTourLoading] = useState(true);
  const [tourError, setTourError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setTour(null);
    setTourLoading(true);
    setTourError(null);
    getPropertyTour(id)
      .then((item) => { if (active) setTour(item); })
      .catch(() => { if (active) setTourError('تعذر تحميل الجولة الافتراضية.'); })
      .finally(() => { if (active) setTourLoading(false); });
    return () => { active = false; };
  }, [id]);

  const propertyHref = id ? `/properties/${id}` : '/properties';

  if (loading || tourLoading) {
    return <section className="tour-pseudo-fullscreen-shell"><div className="tour-pseudo-state">جار تحميل الجولة الافتراضية...</div></section>;
  }

  if (error || tourError || !property) {
    return (
      <section className="tour-pseudo-fullscreen-shell">
        <div className="tour-pseudo-state"><h1>تعذر تحميل الجولة الافتراضية.</h1><p>{tourError || error}</p><Link to={propertyHref}>العودة للعقار</Link></div>
      </section>
    );
  }

  if (!tour) {
    return (
      <section className="tour-pseudo-fullscreen-shell">
        <div className="tour-pseudo-state"><h1>لا توجد جولة افتراضية لهذا العقار.</h1><Link to={propertyHref}>العودة للعقار</Link></div>
      </section>
    );
  }

  const title = property.title || 'الجولة الافتراضية';
  const metadata = getPropertySeoMetadata(property);
  const tourPath = `/properties/${property.id}/tour`;

  return (
    <section className="tour-pseudo-fullscreen-shell" aria-label="الجولة الافتراضية للعقار">
      <SEO
        title={`جولة 360 | ${title}`}
        description={`جولة افتراضية 360 للعقار: ${metadata.description}`}
        path={tourPath}
        image={firstImage(property)}
        type="article"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'VirtualLocation',
            name: `جولة 360 | ${title}`,
            description: metadata.description,
            url: absoluteUrl(tourPath),
          },
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Properties', path: '/properties' },
            { name: title, path: `/properties/${property.id}` },
            { name: '360 Tour', path: tourPath },
          ]),
        ]}
      />
      <header className="tour-pseudo-header">
        <Link to={propertyHref} className="tour-pseudo-exit">العودة للعقار</Link>
        <div><span>جولة 360</span><h1>{property.title || 'الجولة الافتراضية'}</h1></div>
        <span className="tour-pseudo-header-spacer" aria-hidden="true" />
      </header>
      <main className="tour-pseudo-viewer">
        <VirtualTourViewer tour={tour} />
      </main>
    </section>
  );
}
