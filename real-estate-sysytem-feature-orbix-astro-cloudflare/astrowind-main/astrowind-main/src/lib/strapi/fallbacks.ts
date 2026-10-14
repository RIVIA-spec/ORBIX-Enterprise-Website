import type { BrandSettings, CmsPage, LinkItem, NavigationGroup, Section } from './types';

const link = (label: string, url: string): LinkItem => ({ label, url });

const page = (path: string, title: string, summary: string, sections: Section[] = []): CmsPage => ({
  title,

  slug: path === '/' ? 'home' : path.replace(/^\/+/, ''),

  summary,

  sections,

  seo: { metaTitle: title, metaDescription: summary.slice(0, 155), canonicalPath: path, noIndex: false },

  updatedAt: '2026-09-03T00:00:00.000Z',
});

export const fallbackBrand: BrandSettings = {
  brandName: 'Orbix',

  tagline: 'Reality Reimagined',

  operatedBy: 'RIVIA',

  entityDefinition:
    'Orbix is a corporate PropTech and immersive-technology brand operated by RIVIA for real estate, hospitality, offices, virtual tours, and interactive digital experiences.',

  riviaRelationship: 'Orbix is a product and brand operated by RIVIA.',

  assets: {
    primaryHorizontalLogo: { url: '/orbix/Orbix logo-01.png', alternativeText: 'Orbix Reality Reimagined logo' },

    verticalLogo: { url: '/orbix/Orbix logo-01.png', alternativeText: 'Orbix Reality Reimagined vertical logo' },

    lightLogo: { url: '/orbix/Orbix logo-01.png', alternativeText: 'Orbix blue logo with Reality Reimagined tagline' },

    darkLogo: { url: '/orbix/Orbix logo-04.png', alternativeText: 'Orbix navy logo with Reality Reimagined tagline' },

    symbolMark: { url: '/orbix/Orbix logo-01.png', alternativeText: 'Orbix circular mark' },

    favicon: { url: '/orbix/Orbix logo-01.png', alternativeText: 'Orbix favicon' },

    defaultSocialImage: { url: '/orbix/Orbix logo-04.png', alternativeText: 'Orbix social image' },
  },

  colors: {
    primaryBlue: '#016AFA',

    secondaryLightBlue: '#69A8FE',

    white: '#FFFFFF',

    navy: '#06142D',

    mainDarkBackground: '#030816',

    elevatedSurface: '#0B1733',

    primaryText: '#F4F8FF',

    mutedText: '#B8C7DD',

    borderColor: '#1B2E52',

    accentColor: '#69A8FE',

    interactionColor: '#2F86FF',

    sourceNotes:
      'Primary blue and light blue are approved values. Navy and dark surfaces are documented fallbacks because no readable SVG/EPS source was available locally.',
  },

  typography: {
    englishFont: 'IBM Plex Sans',

    arabicFont: 'IBM Plex Sans Arabic',

    codeFont: 'IBM Plex Mono',

    headingWeights: [600, 700],

    bodyWeights: [400, 500],

    baseTextSize: '16px',

    lineHeight: '1.6',

    letterSpacing: '0',
  },
};

export const fallbackHeader: NavigationGroup[] = [
  {
    title: 'Main',

    links: [
      link('Services', '/services'),

      link('Studio', '/creative-studio'),

      link('Tours', '/virtual-tours'),

      link('Industries', '/industries/real-estate'),

      link('Work', '/case-studies'),

      link('Media', '/media'),

      link('Docs', '/downloads'),
    ],
  },
];

export const fallbackFooter: NavigationGroup[] = [
  {
    title: 'Company',

    links: [
      link('About Orbix', '/about'),

      link('Creative Studio', '/creative-studio'),

      link('Partners', '/partners'),

      link('Clients', '/clients'),
    ],
  },

  {
    title: 'Solutions',

    links: [
      link('Real Estate', '/industries/real-estate'),

      link('Hospitality', '/industries/hospitality'),

      link('Offices', '/industries/offices'),

      link('Virtual Tours', '/virtual-tours'),
    ],
  },

  {
    title: 'Resources',

    links: [
      link('Guides', '/guides'),

      link('City Guides', '/city-guides'),

      link('Articles', '/articles'),

      link('News', '/news'),
    ],
  },

  {
    title: 'Technical',

    links: [
      link('Downloads', '/downloads'),

      link('Documentation', 'https://docs.orbixcity.com'),

      link('Partner Portal', 'https://partners.orbixcity.com'),
    ],
  },
];

export const fallbackTechnicalLinks: LinkItem[] = [
  link('RSS Feed', '/rss.xml'),

  link('Sitemap', '/sitemap-index.xml'),

  link('llms.txt', '/llms.txt'),

  link('robots.txt', '/robots.txt'),

  link('Privacy', '/privacy'),

  link('Terms', '/terms'),

  link('Cookies', '/cookies'),
];

const serviceSections = (kind: string, title: string, summary: string): Section[] => [
  {
    sectionType: 'hero',

    eyebrow: 'Orbix service',

    title,

    summary,

    primaryCta: link('ابدأ مشروعك', '/contact'),

    secondaryCta: link('View case studies', '/case-studies'),
  },

  {
    sectionType: 'text-media',

    eyebrow: 'Problem / Solution',

    title: `What ${kind} teams need`,

    summary:
      'Clear public pages, immersive media, structured documentation, and reliable technical output that can be managed from Strapi without unsafe scripts.',
  },

  {
    sectionType: 'services-grid',

    eyebrow: 'Capabilities',

    title: 'Controlled capabilities',

    items: [
      { title: 'Immersive capture', description: '360 scenes, still imagery, video, and spatial context.' },

      {
        title: 'Interactive delivery',

        description: 'Astro-rendered pages with optional client behavior only where it adds value.',
      },

      { title: 'SEO and GEO', description: 'Canonical pages, schemas, sources, summaries, and internal links.' },
    ],
  },

  {
    sectionType: 'process',

    eyebrow: 'Process',

    title: 'From discovery to published system',

    items: [
      'Scope the entity and audience',

      'Capture and structure the content',

      'Render accessible pages',

      'Measure and maintain the public resource',
    ] as never,
  },

  {
    sectionType: 'faq',

    eyebrow: 'FAQ',

    title: 'Common questions',

    items: [
      {
        title: 'Does Strapi control this page?',

        description: 'Yes. The local content is only a build-safe fallback until published CMS records exist.',
      },
    ],
  },

  {
    sectionType: 'contact-cta',

    title: `Plan ${kind} content with Orbix`,

    primaryCta: link('Contact Orbix', '/contact'),
  },
];

const orbixApplicationSections: Section[] = [
  // ORBIX_APPLICATION_AND_BUSINESS_SERVICES

  {
    sectionType: 'hero',

    eyebrow: 'ORBIX BY RIVIA',

    title: 'العقار والخدمات والمعاملات في تجربة رقمية واحدة',

    summary:
      'يساعد تطبيق Orbix المستخدمين على اكتشاف العقارات والإقامات، مشاهدة الجولات الافتراضية، التواصل مع المكاتب والفنادق، ومتابعة رحلة المعاملة ضمن تجربة رقمية واضحة وموثوقة.',

    themeVariant: 'dark',

    patternSelection: 'city-landmark',

    primaryCta: link('اكتشف تطبيق Orbix', '/app'),

    secondaryCta: link('انضم كشريك', '/partners'),
  },

  {
    sectionType: 'app-store-links',

    eyebrow: 'تطبيق Orbix',

    title: 'Reality Reimagined',

    summary: 'اكتشف العقارات والإقامات، شاهد المكان بجولة افتراضية 360، تواصل مع الجهة المناسبة، وتابع طلبك من الهاتف.',

    items: [
      {
        title: 'Google Play',

        description: 'تحميل تطبيق Orbix لأجهزة Android.',

        url: '#google-play',

        icon: 'android',
      },

      {
        title: 'App Store',

        description: 'تحميل تطبيق Orbix لأجهزة iPhone وiPad.',

        url: '#app-store',

        icon: 'apple',
      },
    ],
  },

  {
    sectionType: 'services-grid',

    eyebrow: 'منظومة الخدمات',

    title: 'خدمات تتجاوز الإعلان العقاري',

    summary:
      'يجمع Orbix بين الاكتشاف العقاري، المحتوى الغامر، إدارة الطلبات، الدعم التشغيلي، والحلول الرقمية اللازمة لإكمال رحلة المستخدم والشريك.',

    items: [
      {
        title: 'خدمات العقارات',

        description: 'اكتشاف العقارات، الإعلانات الموثقة، طلبات البيع والإيجار والتواصل مع المكاتب والمطورين.',

        url: '/industries/real-estate',

        icon: 'real-estate',
      },

      {
        title: 'الفنادق والإقامات',

        description: 'استكشاف أماكن الإقامة وإرسال طلبات الحجز والتواصل مع الفندق من خلال تجربة منظمة.',

        url: '/industries/hospitality',

        icon: 'hospitality',
      },

      {
        title: 'حلول المكاتب العقارية',

        description: 'إدارة العقارات والعملاء والطلبات والفريق ومتابعة مراحل المعاملة من لوحة الشريك.',

        url: '/industries/offices',

        icon: 'office',
      },

      {
        title: 'الدعم القانوني',

        description: 'تنظيم المستندات ومسارات الطلب والتنسيق مع مختصين قانونيين مؤهلين بحسب الدولة والحالة.',

        url: '/services/legal-support',

        icon: 'legal',
      },

      {
        title: 'المعاملات الإلكترونية',

        description: 'إدارة الطلبات والموافقات والمستندات والعقود والتوقيع ومسار المعاملة رقمياً.',

        url: '/services/e-transactions',

        icon: 'document',
      },

      {
        title: 'الدعم التقني',

        description: 'إعداد الحسابات ولوحات التحكم والجولات الافتراضية والتكاملات وتدريب فرق الشركاء.',

        url: '/services/technical-support',

        icon: 'technology',
      },

      {
        title: 'حلول الدفع الإلكتروني الدولي',

        description: 'تكاملات دفع وتحويل عبر مزودي خدمات مرخصين، وفق التوافر والامتثال في كل دولة.',

        url: '/services/international-payments',

        icon: 'payment',
      },

      {
        title: 'الجولات الافتراضية 360',

        description: 'جولات Pannellum متعددة المشاهد مع نقاط معلومات وتنقل وتجربة ملائمة للعقارات والفنادق.',

        url: '/virtual-tours',

        icon: 'virtual-tour',
      },

      {
        title: 'Orbix Creative Studio',

        description: 'مواقع تفاعلية وتجارب ثلاثية الأبعاد وسرد رقمي وإنتاج بصري للعلامات التجارية.',

        url: '/creative-studio',

        icon: 'creative-studio',
      },
    ],
  },

  {
    sectionType: 'process',

    eyebrow: 'كيف يعمل التطبيق',

    title: 'من الاكتشاف إلى إتمام الطلب',

    summary: 'تجربة مبسطة للمستخدم مع أدوات تشغيل واضحة للمكاتب والفنادق والشركاء.',

    items: [
      'اكتشاف العقار أو الإقامة المناسبة.',

      'مشاهدة الصور والفيديو والجولة الافتراضية 360.',

      'إرسال طلب تواصل أو معاينة أو حجز.',

      'مراجعة الطلب من المكتب أو الفندق.',

      'تنظيم المستندات وخطوات المعاملة.',

      'اختيار وسيلة الدفع المتاحة عند تفعيلها.',

      'متابعة حالة الطلب حتى الإغلاق.',
    ] as never,
  },

  {
    sectionType: 'interactive-technology',

    eyebrow: 'التكنولوجيا',

    title: 'تجربة عقارية غامرة وليست مجرد قائمة إعلانات',

    summary:
      'يستخدم Orbix المحتوى المنظم والجولات الافتراضية والواجهات التفاعلية لمساعدة المستخدم على فهم المكان قبل اتخاذ القرار.',

    primaryCta: link('اكتشف تقنيات Orbix', '/interactive-technology'),
  },

  {
    sectionType: 'partners',

    eyebrow: 'بوابة الشركاء',

    title: 'أدوات للمكاتب والفنادق والمطورين',

    summary: 'يستطيع الشريك إدارة ملفه وعقاراته أو وحداته وطلباته ومحتواه وجولاته الافتراضية من خلال لوحة مخصصة.',

    items: [
      {
        title: 'المكاتب العقارية',

        description: 'إدارة العقارات والعملاء والطلبات ومراحل المعاملات.',

        url: '/partners',

        icon: 'office',
      },

      {
        title: 'الفنادق',

        description: 'إدارة بيانات الفندق والغرف وطلبات الحجز والمحتوى.',

        url: '/partners',

        icon: 'hospitality',
      },

      {
        title: 'المطورون العقاريون',

        description: 'عرض المشاريع والوحدات وخطط الدفع ونسب الإنجاز.',

        url: '/partners',

        icon: 'development',
      },
    ],
  },
];

const homeSections: Section[] = [
  ...orbixApplicationSections,

  {
    sectionType: 'carousel',

    eyebrow: 'أوربيكس | تقنيات عقارية غامرة',

    title: 'تقنيات عقارية وتجارب رقمية غامرة',

    summary: 'نطوّر تجارب رقمية وجولات افتراضية وحلولاً تفاعلية للعقارات والضيافة والمدن.',

    items: [
      {
        title: 'واقعٌ نعيد تصوّره',

        description: 'حلول غامرة لعرض العقارات والفنادق وتقديم الأماكن بصورة أكثر وضوحاً وتأثيراً.',

        label: '01',

        primaryCta: { label: 'استكشف خدماتنا', url: '/services' },
      },

      {
        title: 'استوديو أوربيكس الإبداعي',

        description: 'مواقع تفاعلية وتجارب ويب ثلاثية الأبعاد وجولات افتراضية وسرد رقمي.',

        label: '02',

        primaryCta: { label: 'استكشف الاستوديو', url: '/creative-studio' },
      },
    ],
  },

  {
    sectionType: 'hero',

    eyebrow: 'أوربيكس من ريفيا',

    title: 'تقنيات غامرة للعقارات والضيافة والأماكن',

    summary: 'أوربيكس منصة ريفيا للتكنولوجيا العقارية والجولات الافتراضية والإنتاج الإبداعي والأدلة الرقمية.',

    themeVariant: 'dark',

    patternSelection: 'city-landmark',

    primaryCta: link('ابدأ مشروعك', '/contact'),

    secondaryCta: link('اكتشف قدراتنا', '/services'),
  },

  {
    sectionType: 'capability-strip',

    items: [
      '360 tours',

      'Interactive websites',

      '3D web',

      'Real-estate media',

      'Hotel guides',

      'Office solutions',
    ] as never,
  },

  {
    sectionType: 'creative-studio',

    eyebrow: '01 / الاستوديو',

    title: 'استوديو أوربيكس الإبداعي',

    summary:
      'A creative and interactive production division for immersive brand experiences, interactive websites, 3D web experiences, virtual tours, creative development, and story-led digital interfaces.',

    primaryCta: link('Explore the studio', '/creative-studio'),
  },

  {
    sectionType: 'virtual-tours',

    eyebrow: '02 / Tours',

    title: 'Virtual Tours 360',

    summary:
      'Pannellum-ready public tours support multiple scenes, navigation hotspots, information hotspots, fullscreen viewing, and noindex controls for private demonstrations.',

    primaryCta: link('View tour services', '/virtual-tours'),
  },

  {
    sectionType: 'interactive-technology',

    eyebrow: '03 / Interactive',

    title: 'Interactive Technology',

    summary:
      'Orbix builds interactive web experiences, guided product explainers, spatial storytelling, and game-like digital interfaces without turning static content into heavy client applications.',

    primaryCta: link('Interactive capabilities', '/interactive-technology'),
  },

  {
    sectionType: 'services-grid',

    eyebrow: '04 / Solutions',

    title: 'Real estate, hospitality, and office systems',

    summary:
      'Service pages are structured for editorial depth, internal linking, FAQs, and schema rather than generic SaaS cards.',

    items: [
      {
        title: 'Real estate services',

        description: 'Launch media, sales content, tours, and discovery pages for property teams.',

        url: '/industries/real-estate',

        icon: 'real-estate',
      },

      {
        title: 'Hospitality and hotels',

        description: 'Hotel tour content, destination guides, venue storytelling, and booking CTAs.',

        url: '/industries/hospitality',

        icon: 'hospitality',
      },

      {
        title: 'Real-estate offices',

        description: 'Office presentation systems, documentation, partner material, and team workflows.',

        url: '/industries/offices',

        icon: 'office',
      },
    ],
  },

  {
    sectionType: 'case-studies',

    eyebrow: '05 / Work',

    title: 'Selected projects and case studies',

    summary:
      'Published CMS case studies appear here with verified challenge, approach, technology, and results. Fallback mode does not invent client metrics.',

    primaryCta: link('Open case studies', '/case-studies'),
  },

  {
    sectionType: 'partners',

    eyebrow: '06 / Network',

    title: 'Partners and clients',

    summary:
      'Partner and client logos are rendered only from published CMS records. No fake logos are shown in fallback mode.',

    primaryCta: link('Partnerships', '/partners'),
  },

  {
    sectionType: 'city-guides',

    eyebrow: '07 / Places',

    title: 'City Guides',

    summary:
      'Structured city content connects Orbix services, local places, case studies, and guides with stable canonical URLs.',

    primaryCta: link('Browse city guides', '/city-guides'),
  },

  {
    sectionType: 'guides',

    eyebrow: '08 / Field Notes',

    title: '360 photography, office, and hotel guides',

    summary:
      'Guides explain practical workflows for panoramic capture, real-estate office presentation, and hotel discovery content.',

    primaryCta: link('Read guides', '/guides'),
  },

  {
    sectionType: 'articles-news',

    eyebrow: '09 / Editorial',

    title: 'Articles and News',

    summary:
      'Articles and news are managed in Strapi with authors, sources, publication dates, related content, and RSS support.',

    primaryCta: link('Articles', '/articles'),

    secondaryCta: link('News', '/news'),
  },

  {
    sectionType: 'media-coverage',

    eyebrow: '10 / Media',

    title: 'Media coverage',

    summary:
      'Al Jazeera appearances, external articles, interviews, events, and press mentions render only when published in the CMS.',

    primaryCta: link('Media room', '/media'),
  },

  {
    sectionType: 'downloads',

    eyebrow: '11 / Documents',

    title: 'Documentation, PDFs, and Media Kit',

    summary:
      'Download cards are populated from Strapi media records with file type, version, language, and update metadata.',

    primaryCta: link('Open downloads', '/downloads'),
  },

  {
    sectionType: 'app-store-links',

    eyebrow: '12 / Apps',

    title: 'Application links',

    summary:
      'Store links, QR codes, availability status, labels, and region notes are controlled by Strapi. Unavailable links stay hidden.',
  },

  {
    sectionType: 'about',

    eyebrow: '13 / Entity',

    title: 'About Orbix and RIVIA',

    summary: 'Orbix is the PropTech and immersive-technology brand; RIVIA is the legal/company entity operating it.',

    primaryCta: link('About the company', '/about'),
  },

  {
    sectionType: 'contact-cta',

    eyebrow: 'Project intake',

    title: 'Plan an immersive property or hospitality experience',

    summary:
      'Use the contact page to scope tours, media systems, interactive websites, documentation, or partner material.',

    primaryCta: link('Contact Orbix', '/contact'),
  },
];

export const fallbackPages: Record<string, CmsPage> = {
  '/': page('/', 'Orbix', fallbackBrand.entityDefinition, homeSections),

  '/services': page(
    '/services',

    'Orbix Services',

    'Immersive technology, PropTech, creative studio, virtual tour, hospitality, and office solutions.',

    serviceSections(
      'property and hospitality',

      'Services for immersive real estate and place discovery',

      'Orbix services combine creative production, virtual tours, interactive technology, and SEO-ready public content.'
    )
  ),

  '/creative-studio': page(
    '/creative-studio',

    'Orbix Creative Studio',

    'The creative and interactive production division of Orbix.',

    serviceSections(
      'creative studio',

      'Creative Studio for immersive digital experiences',

      'Interactive websites, 3D web concepts, virtual tours, creative development, and game-like storytelling for brands and places.'
    )
  ),

  '/virtual-tours': page(
    '/virtual-tours',

    'Virtual Tours 360',

    'Pannellum-compatible virtual tour production and publishing.',

    serviceSections(
      'virtual tour',

      '360 virtual tours for properties, hotels, and places',

      'Multi-scene tours with hotspots, fallback images, noindex controls, and lazy loaded Pannellum viewing.'
    )
  ),

  '/interactive-technology': page(
    '/interactive-technology',

    'Interactive Technology',

    'Interactive websites, spatial storytelling, and 3D web experiences.',

    serviceSections(
      'interactive technology',

      'Interactive technology for real-world spaces',

      'Orbix creates restrained, high-performance interactive experiences for property, hospitality, and corporate presentations.'
    )
  ),

  '/industries/real-estate': page(
    '/industries/real-estate',

    'Real Estate Solutions',

    'Immersive media and public content systems for real estate teams.',

    serviceSections(
      'real estate',

      'Real estate launch and discovery systems',

      'Orbix supports property launches with virtual tours, media, editorial pages, guides, and structured technical SEO.'
    )
  ),

  '/industries/hospitality': page(
    '/industries/hospitality',

    'Hospitality and Hotel Solutions',

    'Immersive hotel and hospitality discovery content.',

    serviceSections(
      'hospitality',

      'Hospitality and hotel presentation systems',

      'Hotel tours, destination guides, room and venue storytelling, and booking-ready calls to action.'
    )
  ),

  '/industries/offices': page(
    '/industries/offices',

    'Real-estate Office Solutions',

    'Office presentation, partner enablement, and documentation systems.',

    serviceSections(
      'office',

      'Real-estate office systems',

      'Office pages, team resources, media kits, documentation, and partner-facing public material.'
    )
  ),

  '/partners': page('/partners', 'Partners', 'Published Orbix partner relationships and collaboration categories.', [
    {
      sectionType: 'partners',

      title: 'Partners',

      summary:
        'Partner records, logos, locations, relationship types, and websites are shown only from published CMS data.',
    },
  ]),

  '/clients': page('/clients', 'Clients', 'Published client relationships and related work.', [
    {
      sectionType: 'clients',

      title: 'Clients',

      summary: 'Client logos and claims are hidden until published CMS records exist.',
    },
  ]),

  '/city-guides': page('/city-guides', 'City Guides', 'Structured city guide content for Orbix place discovery.', [
    {
      sectionType: 'city-guides',

      title: 'City Guides',

      summary: 'City guide records connect services, projects, and factual place resources.',
    },
  ]),

  '/guides': page('/guides', 'Guides', '360 photography, real-estate office, and hotel guide resources.', [
    {
      sectionType: 'guides',

      title: 'Guides',

      summary: 'Published guide records include authors, sources, dates, FAQs, and related content.',
    },
  ]),

  '/case-studies': page(
    '/case-studies',

    'Case Studies',

    'Evidence-focused case studies with verified project context.',

    [
      {
        sectionType: 'case-studies',

        title: 'Case Studies',

        summary:
          'Case studies render verified challenge, approach, solution, technology, and results from CMS records.',
      },
    ]
  ),

  '/articles': page('/articles', 'Articles', 'Orbix editorial articles with authors, sources, and RSS support.', [
    {
      sectionType: 'articles-news',

      title: 'Articles',

      summary: 'Article records are managed in Strapi and excluded from public output when noindex or draft.',
    },
  ]),

  '/news': page('/news', 'News', 'Published Orbix news and announcements.', [
    {
      sectionType: 'articles-news',

      title: 'News',

      summary:
        'News records use publication dates, authorship, canonical URLs, and NewsArticle schema where appropriate.',
    },
  ]),

  '/media': page('/media', 'Media Coverage', 'Press, interviews, appearances, and external coverage.', [
    {
      sectionType: 'media-coverage',

      title: 'Media Coverage',

      summary: 'Al Jazeera and other appearances render only from published media mention records.',
    },
  ]),

  '/downloads': page(
    '/downloads',

    'Downloads and Documentation',

    'PDF documents, media kits, brand documents, partner guides, and service documentation.',

    [
      {
        sectionType: 'downloads',

        title: 'Downloads and Documentation',

        summary: 'Files come from Strapi media records with type, size, version, language, and update date.',
      },
    ]
  ),

  '/about': page(
    '/about',

    'About Orbix and RIVIA',

    'Orbix is a PropTech and immersive-technology brand operated by RIVIA.',

    [{ sectionType: 'about', title: 'About Orbix and RIVIA', summary: fallbackBrand.entityDefinition }]
  ),

  '/contact': page(
    '/contact',

    'Contact Orbix',

    'Project intake for immersive property, hospitality, office, and interactive technology work.',

    [
      {
        sectionType: 'contact-cta',

        title: 'Contact Orbix',

        summary: 'Share the project scope, location, content needs, and preferred timeline.',

        primaryCta: link('Email project intake', 'mailto:hello@orbixcity.com'),
      },
    ]
  ),

  '/privacy': page('/privacy', 'Privacy Policy', 'Privacy information for Orbix public web properties.', [
    {
      sectionType: 'legal',

      title: 'Privacy Policy',

      summary:
        'This local fallback should be replaced by the published legal policy in Strapi before production launch.',
    },
  ]),

  '/terms': page('/terms', 'Terms', 'Terms for Orbix public web properties.', [
    {
      sectionType: 'legal',

      title: 'Terms',

      summary: 'This local fallback should be replaced by the published terms in Strapi before production launch.',
    },
  ]),

  '/cookies': page('/cookies', 'Cookies', 'Cookie information for Orbix public web properties.', [
    {
      sectionType: 'legal',

      title: 'Cookies',

      summary:
        'This local fallback should be replaced by the published cookie policy in Strapi before production launch.',
    },
  ]),
};

export const fallbackCollections: Record<string, CmsPage[]> = {
  services: [
    page(
      '/services/creative-studio',

      'Creative Studio',

      'Interactive production, virtual tour content, and creative development.',

      serviceSections(
        'creative studio',

        'Creative Studio',

        'Creative and interactive production for immersive digital experiences.'
      )
    ),

    page(
      '/services/virtual-tours-360',

      'Virtual Tours 360',

      'Multi-scene virtual tours for properties, hotels, offices, and places.',

      serviceSections('virtual tours', 'Virtual Tours 360', '360 capture and Pannellum-compatible publishing.')
    ),

    page(
      '/services/interactive-technology',

      'Interactive Technology',

      'Interactive web experiences and spatial storytelling.',

      serviceSections(
        'interactive technology',

        'Interactive Technology',

        'Interactive experiences for corporate and place-based content.'
      )
    ),
  ],

  guides: [
    page(
      '/guides/360-photography-guide',

      '360 Photography Guide',

      'A practical guide to planning panoramic capture for real estate and hospitality.',

      [
        {
          sectionType: 'article-body',

          title: '360 Photography Guide',

          summary: 'Published guide content, author, sources, and downloads are controlled by Strapi.',
        },
      ]
    ),

    page(
      '/guides/real-estate-office-guide',

      'Real-estate Office Guide',

      'How public office resources can support property marketing teams.',

      [
        {
          sectionType: 'article-body',

          title: 'Real-estate Office Guide',

          summary: 'Fallback guide content is for local preview only.',
        },
      ]
    ),

    page(
      '/guides/hotel-virtual-tour-guide',

      'Hotel Virtual Tour Guide',

      'Planning hotel and hospitality virtual tour content.',

      [
        {
          sectionType: 'article-body',

          title: 'Hotel Virtual Tour Guide',

          summary: 'Fallback guide content is for local preview only.',
        },
      ]
    ),
  ],

  articles: [
    page(
      '/articles/orbix-proptech-entity',

      'What Orbix Means by Reality Reimagined',

      'A concise definition of Orbix, RIVIA, and the corporate website role.',

      [
        {
          sectionType: 'article-body',

          title: 'What Orbix Means by Reality Reimagined',

          summary: fallbackBrand.entityDefinition,
        },
      ]
    ),
  ],

  news: [
    page(
      '/news/orbix-corporate-site-foundation',

      'Orbix Corporate Site Foundation',

      'A factual note about the Orbix corporate website architecture.',

      [
        {
          sectionType: 'article-body',

          title: 'Orbix Corporate Site Foundation',

          summary: 'The public site is statically rendered with Astro and controlled by Strapi.',
        },
      ]
    ),
  ],

  projects: [
    page(
      '/case-studies/immersive-property-system',

      'Immersive Property System',

      'A demonstration case-study layout for verified CMS records.',

      [
        {
          sectionType: 'case-study-body',

          title: 'Evidence-focused case study structure',

          summary:
            'Real metrics, client names, testimonials, and results are hidden until published CMS records provide them.',
        },
      ]
    ),
  ],

  'virtual-tours': [
    page(
      '/virtual-tours/sample-panorama',

      'Sample Panorama Tour',

      'A local Pannellum-compatible tour preview using fallback media.',

      [
        {
          sectionType: 'tour-viewer',

          title: 'Sample Panorama Tour',

          summary: 'Replace fallback panorama scenes with Strapi tour media before production.',

          items: [
            {
              sceneId: 'entry',

              label: 'Entry scene',

              panorama: '/orbix/Orbix logo-04.png',

              pitch: 0,

              yaw: 0,

              hfov: 100,

              hotspots: [
                { hotspotType: 'info', label: 'Orbix', text: 'Pannellum data shape preview.', pitch: 0, yaw: 0 },
              ],
            },
          ] as never,
        },
      ]
    ),
  ],
};
