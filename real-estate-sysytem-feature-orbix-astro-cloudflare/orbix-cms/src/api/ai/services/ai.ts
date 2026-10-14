const ARTICLE_UID = 'api::article.article';
const OLLAMA_TIMEOUT_MS = 60_000;
const MAX_SUMMARY_LENGTH = 1200;
const MAX_SNIPPET_LENGTH = 280;
const MAX_LLM_SUMMARY_LENGTH = 500;

type ArticleRecord = {
  id: number | string;
  documentId?: string;
  title?: string;
  excerpt?: string;
  body?: unknown;
  keyTakeaways?: unknown;
};

type SummaryPayload = {
  aiSummary: string;
  answerSnippet: string;
  llmSummary: string;
};

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function truncate(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return '';
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function flattenRichText(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (typeof value === 'string') {
    return value.trim() ? [value.trim()] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenRichText(item));
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const directText = [record.text, record.content, record.description, record.body]
      .map(normalizeText)
      .filter(Boolean);

    if (directText.length) {
      return directText;
    }

    return Object.values(record).flatMap((item) => flattenRichText(item));
  }

  return [];
}

function flattenKeyTakeaways(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }

      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        return normalizeText(record.text ?? record.title ?? record.value);
      }

      return '';
    })
    .filter(Boolean);
}

function buildFallbackSummary(rawResponse: string, article: ArticleRecord): SummaryPayload {
  const excerpt = normalizeText(article.excerpt);
  const sourceText = truncate(rawResponse || excerpt || normalizeText(article.title), MAX_SUMMARY_LENGTH);
  const answerSource = rawResponse || excerpt || normalizeText(article.title);
  const llmSource = excerpt || rawResponse || normalizeText(article.title);

  return {
    aiSummary: sourceText || 'تعذر تحويل استجابة النموذج إلى JSON صالح، لذلك تم حفظ ملخص نصي مباشر.',
    answerSnippet:
      truncate(answerSource, MAX_SNIPPET_LENGTH) || 'ملخص موجز للمقال غير متاح حالياً، لكن تم حفظ الاستجابة الخام للمراجعة.',
    llmSummary:
      truncate(llmSource, MAX_LLM_SUMMARY_LENGTH) || 'تم توليد ملخص أولي للمقال ويحتاج إلى مراجعة تحريرية قبل الاعتماد النهائي.',
  };
}

function parseModelJson(rawResponse: string, article: ArticleRecord): SummaryPayload {
  try {
    const parsed = JSON.parse(rawResponse) as Partial<SummaryPayload>;

    const aiSummary = truncate(normalizeText(parsed.aiSummary), MAX_SUMMARY_LENGTH);
    const answerSnippet = truncate(normalizeText(parsed.answerSnippet), MAX_SNIPPET_LENGTH);
    const llmSummary = truncate(normalizeText(parsed.llmSummary), MAX_LLM_SUMMARY_LENGTH);

    if (!aiSummary || !answerSnippet || !llmSummary) {
      return buildFallbackSummary(rawResponse, article);
    }

    return {
      aiSummary,
      answerSnippet,
      llmSummary,
    };
  } catch {
    return buildFallbackSummary(rawResponse, article);
  }
}

function buildPrompt(article: ArticleRecord) {
  const title = normalizeText(article.title);
  const excerpt = normalizeText(article.excerpt);
  const body = flattenRichText(article.body).join('\n');
  const keyTakeaways = flattenKeyTakeaways(article.keyTakeaways);

  return [
    'أنت مساعد تحرير عربي داخل نظام إدارة محتوى.',
    'المطلوب: إنشاء 3 حقول موجزة لمقال عقاري أو تقني باللغة العربية الفصحى.',
    'أعد JSON صالحاً فقط بدون أي شرح إضافي أو markdown.',
    'يجب أن يكون الشكل النهائي:',
    '{"aiSummary":"...","answerSnippet":"...","llmSummary":"..."}',
    'القواعد:',
    '- aiSummary: ملخص واضح من 2 إلى 4 جمل.',
    '- answerSnippet: إجابة قصيرة ومباشرة لا تتجاوز تقريباً 280 حرفاً.',
    '- llmSummary: صياغة مختصرة مناسبة لفهم النماذج ولا تتجاوز تقريباً 500 حرف.',
    '- لا تخترع معلومات غير موجودة في المقال.',
    '- لا تذكر أنك نموذج ذكاء اصطناعي.',
    '',
    `العنوان: ${title || 'غير متوفر'}`,
    `المقتطف: ${excerpt || 'غير متوفر'}`,
    'المحتوى:',
    body || 'غير متوفر',
    '',
    'أهم النقاط:',
    keyTakeaways.length ? keyTakeaways.map((item) => `- ${item}`).join('\n') : '- غير متوفرة',
  ].join('\n');
}

export default ({ strapi }: { strapi: any }) => {
  const documentManager = strapi.service('plugin::content-manager.document-manager');

  const findArticle = async (articleId: string): Promise<ArticleRecord | null> => {
    const query = strapi.db.query(ARTICLE_UID) as any;
    const populate = ['category', 'author', 'tags'];

    try {
      const byDocumentId = await documentManager.findOne(articleId, ARTICLE_UID, { populate });

      if (byDocumentId) {
        return byDocumentId as ArticleRecord;
      }
    } catch (error) {
      strapi.log.debug(`AI summary lookup by documentId failed for ${articleId}: ${String(error)}`);
    }

    const numericId = Number(articleId);

    if (!Number.isNaN(numericId)) {
      const byNumericId = await query.findOne({
        where: { id: numericId },
        populate,
      });

      if (byNumericId) {
        return byNumericId as ArticleRecord;
      }
    }

    return null;
  };

  const requestOllama = async (article: ArticleRecord): Promise<SummaryPayload> => {
    const baseUrl = normalizeText(process.env.OLLAMA_BASE_URL);
    const model = normalizeText(process.env.OLLAMA_MODEL);

    if (!baseUrl || !model) {
      throw new Error('OLLAMA_BASE_URL and OLLAMA_MODEL must be configured.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: buildPrompt(article),
          stream: false,
          format: 'json',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
      }

      const payload = (await response.json()) as Record<string, unknown>;
      const rawResponse =
        typeof payload.response === 'string'
          ? payload.response
          : typeof payload.message === 'string'
            ? payload.message
            : '';

      if (!rawResponse) {
        throw new Error('Ollama returned an empty response.');
      }

      return parseModelJson(rawResponse, article);
    } finally {
      clearTimeout(timeout);
    }
  };

  const saveArticleSummary = async (article: ArticleRecord, summary: SummaryPayload) => {
    const data = {
      aiSummary: summary.aiSummary,
      answerSnippet: summary.answerSnippet,
      llmSummary: summary.llmSummary,
    };

    const documentId = normalizeText(article.documentId);

    if (documentId) {
      return documentManager.update(documentId, ARTICLE_UID, { data });
    }

    return strapi.db.query(ARTICLE_UID).update({
      where: { id: article.id },
      data,
    });
  };

  return {
    isAuthorized(ctx: any) {
      const providedSecret = normalizeText(ctx.request.headers['x-ai-secret']);
      const expectedSecret = normalizeText(process.env.AI_INTERNAL_SECRET);

      return Boolean(expectedSecret) && providedSecret === expectedSecret;
    },

    readArticleId(body: unknown) {
      if (!body || typeof body !== 'object') {
        return '';
      }

      return normalizeText((body as Record<string, unknown>).articleId);
    },

    getHealth() {
      const baseUrl = normalizeText(process.env.OLLAMA_BASE_URL);
      const model = normalizeText(process.env.OLLAMA_MODEL);
      const secret = normalizeText(process.env.AI_INTERNAL_SECRET);

      return {
        configured: Boolean(baseUrl && model && secret),
        baseUrlPresent: Boolean(baseUrl),
        modelName: model || null,
      };
    },

    async generateArticleSummary(articleId: string) {
      const article = await findArticle(articleId);

      if (!article) {
        throw new Error('Article not found.');
      }

      const summary = await requestOllama(article);
      const savedArticle = await saveArticleSummary(article, summary);

      return {
        success: true,
        articleId: String(savedArticle.documentId ?? savedArticle.id ?? articleId),
        savedFields: summary,
      };
    },

    findArticle,
    requestOllama,
    saveArticleSummary,
  };
};
