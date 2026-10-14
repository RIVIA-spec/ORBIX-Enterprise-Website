import { fallbackPages } from "../astrowind-main/astrowind-main/src/lib/strapi/fallbacks.ts";

const apiBase = (
  process.env.STRAPI_URL || "https://orbix-cms-production.up.railway.app"
).replace(/\/$/, "");
const token = process.env.STRAPI_WRITE_TOKEN;
const readToken = process.env.STRAPI_READ_TOKEN || token;
const mode = process.argv.includes("--apply") ? "apply" : "dry-run";
const homepageOnly = process.argv.includes("--homepage-only");
const finalizeTests = process.argv.includes("--finalize-tests");
const publicationTimestamp = new Date().toISOString();

if (!token)
  throw new Error("STRAPI_WRITE_TOKEN is required in process memory.");
if (mode === "apply" && !process.argv.includes("--confirm")) {
  throw new Error("Apply mode requires --confirm.");
}

const headersFor = (write) => ({
  Authorization: `Bearer ${write ? token : readToken}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

const headerNavigation = [
  { title: "الرئيسية", url: "/", displayAsDropdown: false, links: [] },
  {
    title: "خدماتنا",
    displayAsDropdown: true,
    links: [
      {
        label: "العقارات",
        url: "/services/real-estate",
        ariaLabel: "خدمات العقارات",
        icon: "tabler:building",
        openInNewTab: false,
      },
      {
        label: "الضيافة",
        url: "/services/hospitality",
        ariaLabel: "خدمات الضيافة",
        icon: "tabler:hotel-service",
        openInNewTab: false,
      },
      {
        label: "المكاتب",
        url: "/services/offices",
        ariaLabel: "خدمات المكاتب",
        icon: "tabler:building-skyscraper",
        openInNewTab: false,
      },
    ],
  },
  {
    title: "التجارب الرقمية",
    displayAsDropdown: true,
    links: [
      {
        label: "الجولات الافتراضية",
        url: "/virtual-tours",
        ariaLabel: "الجولات الافتراضية",
        icon: "tabler:360-view",
        openInNewTab: false,
      },
      {
        label: "التكنولوجيا التفاعلية",
        url: "/interactive-technology",
        ariaLabel: "التكنولوجيا التفاعلية",
        icon: "tabler:devices",
        openInNewTab: false,
      },
      {
        label: "Orbix Creative Studio",
        url: "/creative-studio",
        ariaLabel: "Orbix Creative Studio",
        icon: "tabler:palette",
        openInNewTab: false,
      },
    ],
  },
  { title: "الشركاء", url: "/partners", displayAsDropdown: false, links: [] },
  { title: "المقالات", url: "/articles", displayAsDropdown: false, links: [] },
  { title: "تواصل معنا", url: "/contact", displayAsDropdown: false, links: [] },
];

const footerNavigation = [
  {
    title: "Orbix",
    displayAsDropdown: false,
    url: "/",
    links: [
      { label: "عن Orbix", url: "/about", ariaLabel: "عن Orbix" },
      { label: "تواصل معنا", url: "/contact", ariaLabel: "تواصل معنا" },
    ],
  },
  {
    title: "الخدمات",
    displayAsDropdown: false,
    url: "/services",
    links: [
      { label: "العقارات", url: "/services/real-estate" },
      { label: "الضيافة", url: "/services/hospitality" },
      { label: "المكاتب", url: "/services/offices" },
    ],
  },
  {
    title: "المحتوى",
    displayAsDropdown: false,
    url: "/articles",
    links: [
      { label: "المقالات", url: "/articles" },
      { label: "أدلة المدن", url: "/city-guides" },
      { label: "دراسات الحالة", url: "/case-studies" },
    ],
  },
  {
    title: "Technical",
    displayAsDropdown: false,
    url: "/sitemap-index.xml",
    links: [
      { label: "RSS", url: "/rss.xml" },
      { label: "خريطة الموقع", url: "/sitemap-index.xml" },
    ],
  },
];

const technicalLinks = [
  {
    label: "RSS",
    url: "/rss.xml",
    ariaLabel: "خلاصة RSS",
    icon: "tabler:rss",
    openInNewTab: false,
  },
  {
    label: "Sitemap",
    url: "/sitemap-index.xml",
    ariaLabel: "خريطة الموقع",
    icon: "tabler:sitemap",
    openInNewTab: false,
  },
  {
    label: "Robots",
    url: "/robots.txt",
    ariaLabel: "ملف robots",
    icon: "tabler:robot",
    openInNewTab: false,
  },
  {
    label: "LLM guidance",
    url: "/llms.txt",
    ariaLabel: "إرشادات الذكاء الاصطناعي",
    icon: "tabler:file-text",
    openInNewTab: false,
  },
];

const brandData = {
  brandName: "Orbix",
  tagline: "Reality Reimagined",
  operatedBy: "RIVIA LLC",
  entityDefinition:
    "منصة PropTech وتجارب رقمية غامرة للعقارات والضيافة والمكاتب.",
  riviaRelationship: "Orbix منتج وعلامة تجارية تديرها RIVIA LLC.",
  colors: {
    primaryBlue: "#016AFA",
    secondaryLightBlue: "#69A8FE",
    white: "#FFFFFF",
    navy: "#06142D",
    mainDarkBackground: "#030816",
    elevatedSurface: "#0B1733",
    primaryText: "#0B1020",
    mutedText: "#526078",
    borderColor: "#D9E6FA",
    accentColor: "#69A8FE",
    interactionColor: "#0157D0",
  },
  typography: {
    englishFont: "IBM Plex Sans",
    arabicFont: "IBM Plex Sans Arabic",
    codeFont: "IBM Plex Mono",
    headingWeights: [500, 600, 700],
    bodyWeights: [400, 500, 600],
    baseTextSize: "16px",
    headingScale: { h1: "clamp(2.5rem, 7vw, 6.5rem)" },
    lineHeight: "1.6",
    letterSpacing: "0",
  },
  designOptions: {
    buttonStyle: "solid",
    cardStyle: "outlined",
    borderRadius: "md",
    shadowStyle: "soft",
    sectionBackground: "dark",
    patternVariant: "city-landmark",
    patternPosition: "bottom",
    patternOpacity: "subtle",
    iconColorVariant: "blue",
    sectionVariant: "dark",
    motionPreset: "fade",
    contentWidth: "wide",
    sectionSpacing: "default",
  },
  headerNavigation,
  footerNavigation,
  technicalLinks,
  headerSettings: {
    isVisible: true,
    isSticky: true,
    style: "dark",
    menuPosition: "center",
    logoVariant: "full",
    isFullWidth: true,
    showThemeToggle: true,
    showRssFeed: true,
    showContactButton: true,
    contactButtonText: "تواصل معنا",
    contactButtonUrl: "/contact",
  },
  footerSettings: {
    isVisible: true,
    showTechnicalLinks: true,
    showSocialLinks: false,
    copyrightText: "© Orbix by RIVIA LLC. جميع الحقوق محفوظة.",
  },
  defaultSeo: {
    metaTitle: "Orbix | العقارات والتجارب الرقمية",
    metaDescription:
      "منصة Orbix للعقارات والضيافة والمكاتب والجولات الافتراضية.",
    canonicalPath: "/",
    noIndex: false,
  },
  geoEntities: [
    {
      name: "Orbix",
      entityType: "Brand",
      description: "علامة PropTech وتجارب رقمية تديرها RIVIA LLC.",
      canonicalUrl: "https://orbixcity.com",
      sameAs: ["https://orbixcity.com"],
      relationship: "operated-by RIVIA LLC",
    },
  ],
  llmsDescription:
    "Orbix منصة PropTech وتجارب رقمية غامرة للعقارات والضيافة والمكاتب.",
};

const siteSetting = {
  siteName: "Orbix",
  siteUrl: "https://orbixcity.com",
  tagline: "Reality Reimagined",
  organizationName: "RIVIA LLC",
  headerCtaText: "تواصل معنا",
  headerCtaUrl: "/contact",
  footerDescription: "Orbix منتج وعلامة تجارية تديرها RIVIA LLC.",
  siteEntities: [
    {
      key: "main",
      domain: "orbixcity.com",
      url: "https://orbixcity.com",
      purpose: "corporate-site",
    },
    {
      key: "docs",
      domain: "docs.orbixcity.com",
      url: "https://docs.orbixcity.com",
      purpose: "documentation",
    },
    {
      key: "partners",
      domain: "partners.orbixcity.com",
      url: "https://partners.orbixcity.com",
      purpose: "partner-portal",
    },
  ],
  siteKeywords: [
    "Orbix",
    "RIVIA",
    "PropTech",
    "360 virtual tours",
    "real estate technology",
  ],
  llmsDescription:
    "Orbix corporate site, documentation, and partner portal are served from orbixcity.com, docs.orbixcity.com, and partners.orbixcity.com.",
};

const testPage = {
  locale: "ar",
  publishedAt: publicationTimestamp,
  title: "اختبار منشئ الصفحات",
  slug: "page-builder-test",
  summary: "صفحة اختبار منشورة للتحقق من Dynamic Zone والقوائم وSEO وGEO.",
  body: "<p>هذه صفحة اختبار تحريرية مؤقتة لمنشئ صفحات Orbix.</p>",
  seo: {
    metaTitle: "اختبار منشئ الصفحات | Orbix",
    metaDescription: "اختبار منشور لأقسام Hero وIcon Grid وFAQ وCTA في Orbix.",
    canonicalPath: "/page-builder-test",
    noIndex: true,
  },
  sections: [
    {
      __component: "sections.generic-section",
      sectionType: "hero",
      isVisible: true,
      eyebrow: "اختبار Page Builder",
      title: "تجربة Orbix تبدأ من المحتوى",
      summary: "Hero منشور من Strapi مع CTA وGEO-ready content.",
      themeVariant: "dark",
      patternSelection: "city-landmark",
      alignment: "start",
      containerWidth: "wide",
      primaryCta: {
        label: "تواصل معنا",
        url: "/contact",
        ariaLabel: "تواصل مع Orbix",
      },
      secondaryCta: {
        label: "استكشف الخدمات",
        url: "/services",
        ariaLabel: "استكشف خدمات Orbix",
      },
    },
    {
      __component: "sections.generic-section",
      sectionType: "services-grid",
      isVisible: true,
      eyebrow: "Icon Grid",
      title: "حلول مصممة للمدن الحديثة",
      summary: "أيقونات من مكتبة Orbix معروضة عبر Page Builder.",
      iconSelection: "orbix-icon-library",
      columnsDesktop: "three",
      columnsMobile: "one",
      items: [
        {
          title: "العقارات",
          summary: "تجارب عرض رقمية للعقارات.",
          icon: "tabler:building-estate",
          iconSource: "library",
          iconColor: "blue",
        },
        {
          title: "الجولات الافتراضية",
          summary: "استكشاف غامر بزاوية 360.",
          icon: "tabler:360-view",
          iconSource: "library",
          iconColor: "blue",
        },
        {
          title: "التكنولوجيا التفاعلية",
          summary: "واجهات وتجارب تفاعلية.",
          icon: "tabler:devices",
          iconSource: "library",
          iconColor: "blue",
        },
      ],
    },
    {
      __component: "sections.generic-section",
      sectionType: "faq",
      isVisible: true,
      title: "الأسئلة الشائعة",
      items: [
        {
          title: "ما هو Orbix؟",
          description: "منصة PropTech وتجارب رقمية غامرة تديرها RIVIA LLC.",
        },
        {
          title: "أين تتوفر الوثائق؟",
          description: "تتوفر عبر docs.orbixcity.com.",
        },
      ],
    },
    {
      __component: "sections.generic-section",
      sectionType: "contact-cta",
      isVisible: true,
      title: "لنبدأ مشروعك الرقمي",
      summary: "تواصل مع فريق Orbix لمناقشة احتياجاتك.",
      primaryCta: {
        label: "تواصل معنا",
        url: "/contact",
        ariaLabel: "تواصل مع فريق Orbix",
      },
      themeVariant: "blue",
    },
  ],
};

const testArticle = {
  locale: "ar",
  publishedAt: publicationTimestamp,
  title: "كيف تعيد Orbix تصور التجارب الرقمية للعقارات",
  slug: "orbix-digital-real-estate-experiences",
  articleType: "article",
  arabicSlug: "تجارب-اوربكس-الرقمية-للعقارات",
  preferredSlugLanguage: "ar",
  excerpt:
    "مقال اختباري منشور للتحقق من المقالات وRSS وSitemap وArticle JSON-LD.",
  body: "<h2>تجربة رقمية أوضح</h2><p>تجمع Orbix بين المحتوى العقاري والجولات الافتراضية والتقنيات التفاعلية في تجربة واحدة.</p>",
  featured: true,
  status: "published",
  readingTime: 2,
  seoTitle: "تجارب Orbix الرقمية للعقارات",
  seoDescription:
    "مقال عن دور Orbix في تطوير التجارب الرقمية للعقارات والضيافة.",
  canonicalUrl:
    "https://orbixcity.com/articles/orbix-digital-real-estate-experiences",
  ogTitle: "تجارب Orbix الرقمية للعقارات",
  ogDescription:
    "كيف تجمع Orbix بين العقارات والجولات الافتراضية والتكنولوجيا التفاعلية.",
  twitterTitle: "تجارب Orbix الرقمية للعقارات",
  twitterDescription: "مقال Orbix الاختباري المنشور من Strapi.",
  robots: "index_follow",
  schemaType: "Article",
  focusKeyword: "تكنولوجيا العقارات",
  secondaryKeywords: ["Orbix", "الجولات الافتراضية", "PropTech"],
  aiSummary:
    "تقدم Orbix منصة رقمية للعقارات والضيافة تجمع العرض الغامر والمحتوى والتواصل.",
  answerSnippet:
    "Orbix هي منصة PropTech وتجارب رقمية للعقارات والضيافة والمكاتب.",
  llmSummary:
    "Orbix by RIVIA delivers immersive digital experiences for real estate, hospitality, and offices.",
  entityMentions: [
    { name: "Orbix", type: "Brand", url: "https://orbixcity.com" },
    { name: "RIVIA LLC", type: "Organization" },
  ],
  geoTopics: ["PropTech", "real estate technology", "360 virtual tours"],
  geoQuestions: ["ما هو Orbix؟", "كيف تستخدم Orbix الجولات الافتراضية؟"],
  seo: {
    metaTitle: "تجارب Orbix الرقمية للعقارات",
    metaDescription:
      "مقال عن دور Orbix في تطوير التجارب الرقمية للعقارات والضيافة.",
    canonicalPath: "/articles/orbix-digital-real-estate-experiences",
    noIndex: true,
  },
};

// Keep this payload compatible with the live CMS schema. New visual-control
// fields are defined locally and are intentionally deferred until that schema
// is deployed to Strapi; sending unknown fields would make the live update fail.
const referenceHomepage = fallbackPages["/"];

const normalizeHomepageItem = (item) =>
  typeof item === "string" ? { title: item } : item;

const homepageData = {
  sections: (referenceHomepage.sections || []).map((section) => ({
    __component: "sections.generic-section",
    ...section,
    sectionType: section.sectionType,
    isVisible: section.isVisible !== false,
    items: Array.isArray(section.items)
      ? section.items.map(normalizeHomepageItem)
      : [],
  })),
};
const records = [
  {
    name: "Brand Setting",
    method: "PUT",
    path: "/api/brand-setting",
    kind: "single",
    payload: brandData,
  },
  {
    name: "Site Settings",
    method: "PUT",
    path: "/api/site-setting",
    kind: "single",
    payload: siteSetting,
  },
  {
    name: "Homepage sections",
    method: "PUT",
    path: "/api/homepage",
    kind: "single",
    payload: homepageData,
  },
  {
    name: "Page /page-builder-test (ar, main)",
    method: "UPSERT+PUBLISH",
    path: "/api/pages?filters[slug][$eq]=page-builder-test&locale=ar",
    kind: "collection",
    payload: testPage,
  },
  {
    name: "Article /articles/orbix-digital-real-estate-experiences (ar)",
    method: "UPSERT+PUBLISH",
    path: "/api/articles?filters[slug][$eq]=orbix-digital-real-estate-experiences&locale=ar",
    kind: "collection",
    payload: testArticle,
  },
];
const targetRecords = homepageOnly
  ? records.filter((record) => record.name === "Homepage sections")
  : finalizeTests
    ? records.filter(
        (record) =>
          record.name.startsWith("Page /page-builder-test") ||
          record.name.startsWith("Article /articles/orbix-digital"),
      )
    : records;

async function request(path, init = {}) {
  const write = Boolean(init.method && init.method !== "GET");
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: headersFor(write),
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }
  if (!response.ok)
    throw new Error(
      `Strapi ${response.status} for ${path}: ${body?.error?.message || "request failed"}`,
    );
  return body;
}

async function find(path) {
  const body = await request(path);
  return Array.isArray(body?.data) ? body.data : body?.data ? [body.data] : [];
}

async function resolveRecord(record) {
  if (record.kind === "single")
    return { ...record, existing: await find(record.path) };
  const draftPath = `${record.path}&status=draft`;
  let rows = [...(await find(record.path)), ...(await find(draftPath))];
  if (!rows.length && record.path.includes("&locale=")) {
    const basePath = record.path.replace(/&locale=[^&]+/, "");
    rows = [
      ...(await find(basePath)),
      ...(await find(`${basePath}&status=draft`)),
    ];
  }
  const uniqueRows = [
    ...new Map(rows.map((row) => [row.documentId || row.id, row])).values(),
  ];
  if (uniqueRows.length > 1)
    throw new Error(
      `Duplicate records found for ${record.name}: ${uniqueRows.length}`,
    );
  return { ...record, existing: uniqueRows };
}

const resolved = [];
for (const record of targetRecords) resolved.push(await resolveRecord(record));

console.log(
  JSON.stringify(
    {
      mode,
      endpoints: targetRecords.map(({ name, method, path }) => ({
        name,
        method,
        endpoint: path,
      })),
      create: resolved
        .filter((record) => record.existing.length === 0)
        .map((record) => record.name),
      update: resolved
        .filter((record) => record.existing.length > 0)
        .map((record) => record.name),
      delete: [],
      duplicates: [],
      note: "No deletion is performed. Existing matches are updated by documentId; missing records are created and published.",
    },
    null,
    2,
  ),
);

if (mode !== "dry-run") {
  async function writeRecord(record) {
    const existing = record.existing[0];
    const documentId = existing?.documentId || existing?.id;
    const collection = record.name.startsWith("Article") ? "articles" : "pages";
    const locale = record.payload.locale
      ? `?locale=${record.payload.locale}`
      : "";
    const path =
      record.kind === "single"
        ? record.path
        : documentId
          ? `/api/${collection}/${documentId}${locale}`
          : `/api/${collection}${locale}`;
    const method =
      record.kind === "single" ? "PUT" : documentId ? "PUT" : "POST";
    const body = { data: record.payload };
    const saved = await request(path, { method, body: JSON.stringify(body) });
    if (record.kind !== "single" && !saved?.data)
      throw new Error(
        `Strapi did not return a saved record for ${record.name}`,
      );
  }

  for (const record of resolved) await writeRecord(record);
  console.log(
    JSON.stringify(
      {
        applied: resolved.map((record) => record.name),
        delete: [],
        duplicates: [],
      },
      null,
      2,
    ),
  );
}
