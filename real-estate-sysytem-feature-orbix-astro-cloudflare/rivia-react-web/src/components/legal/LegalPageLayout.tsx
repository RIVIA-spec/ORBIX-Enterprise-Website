import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../seo/SEO';

type LegalSection = {
  title: string;
  paragraphs?: ReactNode[];
  items?: ReactNode[];
};

type LegalPageLayoutProps = {
  title: string;
  description: string;
  path: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalPageLayout({ title, description, path, updatedAt, intro, sections }: LegalPageLayoutProps) {
  return (
    <article className="legal-page" dir="rtl">
      <SEO title={`${title} | Orbix`} description={description} path={path} />
      <div className="container legal-page__container">
        <Link className="legal-page__back-link" to="/">
          العودة إلى الرئيسية
        </Link>

        <header className="legal-page__header">
          <span className="eyebrow">Orbix</span>
          <h1>{title}</h1>
          <p>{intro}</p>
          <time dateTime="2026-07-21">آخر تحديث: {updatedAt}</time>
        </header>

        <div className="legal-page__content">
          {sections.map((section) => (
            <section className="legal-section" key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              {section.items && (
                <ul>
                  {section.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
