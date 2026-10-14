import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { getArticleBySlug } from '../../services/contentGateway';
import type { CmsArticle } from '../../types/content';
import { articleSchema, breadcrumbSchema } from '../../lib/seo';

export function ArticlePage() {
  const { slug = '' } = useParams();
  const [article, setArticle] = useState<CmsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getArticleBySlug(slug).then(setArticle).catch((value: unknown) => setError(value instanceof Error ? value.message : 'تعذر تحميل المقال')).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingState label="جاري تحميل المقال" />;
  if (error || !article) return <section className="container section"><EmptyState title="المقال غير متاح" description={error || 'قد يكون غير منشور أو غير موجود.'} /></section>;
  const path = '/articles/' + article.slug;
  const title = article.seo?.metaTitle || article.title;
  const description = article.seo?.metaDescription || article.excerpt;
  const image = article.seo?.shareImage?.url || article.coverImage?.url;

  return <article className="container section">
    <SEO
      title={title}
      description={description}
      path={article.seo?.canonicalPath || path}
      image={image}
      type="article"
      noIndex={article.seo?.noIndex}
      jsonLd={[
        articleSchema({ title: article.title, description, path, image, publishedAt: article.publishedAt }),
        breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Articles', path: '/articles' }, { name: article.title, path }]),
      ]}
    />
    <h1>{article.title}</h1><p>{article.excerpt}</p><div style={{ whiteSpace: 'pre-wrap' }}>{article.body}</div>
  </article>;
}
