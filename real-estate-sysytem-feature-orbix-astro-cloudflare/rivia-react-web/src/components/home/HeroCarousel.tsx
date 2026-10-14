import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listActiveHeroSlides } from '../../services/heroSlideService';
import type { HeroSlide } from '../../types/models';

const ROTATION_MS = 45_000;

const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: 'fallback-1',
    imageUrl: '',
    title: 'مساحات مختارة بعناية',
    subtitle: 'استكشف عقارات واضحة التفاصيل وتجربة تصفح هادئة.',
    badge: 'RIVIA',
    order: 1,
    isActive: true,
  },
  {
    id: 'fallback-2',
    imageUrl: '',
    title: 'المدينة والخريطة في مكان واحد',
    subtitle: 'انتقل بين البطاقات والخريطة والجولات الافتراضية بسهولة.',
    badge: 'عقارات',
    order: 2,
    isActive: true,
  },
];

function normalizeLink(url?: string) {
  if (!url) return '';
  if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://')) return url;
  return `/${url}`;
}

export function HeroCarousel({ cmsSlides }: { cmsSlides?: HeroSlide[] }) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(!cmsSlides);
  const [timerKey, setTimerKey] = useState(0);

  useEffect(() => {
    if (cmsSlides) {
      setSlides(cmsSlides);
      setLoading(false);
      return undefined;
    }
    let active = true;

    listActiveHeroSlides()
      .then((items) => {
        if (active) setSlides(items);
      })
      .catch(() => {
        if (active) setSlides([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cmsSlides]);

  const displaySlides = useMemo(() => (slides.length > 0 ? slides : FALLBACK_SLIDES), [slides]);
  const activeSlide = displaySlides[current % displaySlides.length];

  useEffect(() => {
    if (displaySlides.length <= 1) return undefined;
    const intervalId = window.setInterval(() => {
      setCurrent((value) => (value + 1) % displaySlides.length);
    }, ROTATION_MS);
    return () => window.clearInterval(intervalId);
  }, [displaySlides.length, timerKey]);

  const goTo = (index: number) => {
    setCurrent(index);
    setTimerKey((value) => value + 1);
  };

  const goNext = () => goTo((current + 1) % displaySlides.length);
  const goPrev = () => goTo((current - 1 + displaySlides.length) % displaySlides.length);

  if (loading) {
    return (
      <div className="hero-carousel-card hero-carousel-loading" aria-label="جاري تحميل سلايدر الرئيسية">
        <div className="hero-carousel-skeleton" />
      </div>
    );
  }

  const linkUrl = normalizeLink(activeSlide.linkUrl);
  const hasImage = Boolean(activeSlide.imageUrl);

  return (
    <div className="hero-carousel-card" aria-label="سلايدر الرئيسية">
      <div className="hero-carousel-stage">
        {hasImage ? (
          <img className="hero-carousel-image" src={activeSlide.imageUrl} alt={activeSlide.title || 'صورة الهيرو'} />
        ) : (
          <div className="hero-carousel-placeholder" aria-hidden="true">
            <span>{activeSlide.badge || 'RIVIA'}</span>
          </div>
        )}
        <div className="hero-carousel-overlay">
          {activeSlide.badge ? <span className="hero-carousel-badge">{activeSlide.badge}</span> : null}
          <h2>{activeSlide.title || 'عقارات مختارة'}</h2>
          {activeSlide.subtitle ? <p>{activeSlide.subtitle}</p> : null}
          {linkUrl && activeSlide.linkLabel ? (
            linkUrl.startsWith('http') ? (
              <a className="hero-carousel-link" href={linkUrl} target="_blank" rel="noreferrer">
                {activeSlide.linkLabel}
              </a>
            ) : (
              <Link className="hero-carousel-link" to={linkUrl}>
                {activeSlide.linkLabel}
              </Link>
            )
          ) : null}
        </div>
      </div>

      {displaySlides.length > 1 ? (
        <>
          <button className="hero-carousel-nav hero-carousel-prev" type="button" onClick={goPrev} aria-label="الشريحة السابقة">
            ‹
          </button>
          <button className="hero-carousel-nav hero-carousel-next" type="button" onClick={goNext} aria-label="الشريحة التالية">
            ›
          </button>
          <div className="hero-carousel-dots" aria-label="اختيار شريحة">
            {displaySlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={index === current ? 'active' : ''}
                onClick={() => goTo(index)}
                aria-label={`عرض الشريحة ${index + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
