import { getAsset, getPermalink } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'تطبيق Orbix',
      links: [
        { text: 'عن التطبيق', href: getPermalink('/app') },
        { text: 'اكتشاف العقارات', href: getPermalink('/industries/real-estate') },
        { text: 'الفنادق والإقامات', href: getPermalink('/industries/hospitality') },
        { text: 'الجولات الافتراضية 360', href: getPermalink('/virtual-tours') },
        { text: 'تحميل التطبيق', href: getPermalink('/downloads') },
      ],
    },
    {
      text: 'الخدمات',
      links: [
        { text: 'جميع الخدمات', href: getPermalink('/services') },
        { text: 'الخدمات العقارية', href: getPermalink('/industries/real-estate') },
        { text: 'خدمات الفنادق', href: getPermalink('/industries/hospitality') },
        { text: 'حلول المكاتب العقارية', href: getPermalink('/industries/offices') },
        { text: 'الدعم القانوني', href: getPermalink('/services/legal-support') },
        { text: 'المعاملات الإلكترونية', href: getPermalink('/services/e-transactions') },
        { text: 'الدعم التقني', href: getPermalink('/services/technical-support') },
        { text: 'حلول الدفع الدولي', href: getPermalink('/services/international-payments') },
      ],
    },
    {
      text: 'التقنيات',
      links: [
        { text: 'التكنولوجيا التفاعلية', href: getPermalink('/interactive-technology') },
        { text: 'الجولات الافتراضية', href: getPermalink('/virtual-tours') },
        { text: 'المواقع ثلاثية الأبعاد', href: getPermalink('/creative-studio') },
        { text: 'Orbix Creative Studio', href: getPermalink('/creative-studio') },
      ],
    },
    {
      text: 'الشركاء',
      links: [
        { text: 'المكاتب العقارية', href: getPermalink('/partners') },
        { text: 'الفنادق', href: getPermalink('/partners') },
        { text: 'المطورون العقاريون', href: getPermalink('/partners') },
        { text: 'العملاء', href: getPermalink('/clients') },
        { text: 'دراسات الحالة', href: getPermalink('/case-studies') },
      ],
    },
    {
      text: 'المعرفة والإعلام',
      links: [
        { text: 'دليل المدن', href: getPermalink('/city-guides') },
        { text: 'الأدلة', href: getPermalink('/guides') },
        { text: 'المقالات', href: getPermalink('/articles') },
        { text: 'الأخبار', href: getPermalink('/news') },
        { text: 'الظهور الإعلامي', href: getPermalink('/media') },
        { text: 'الملفات وMedia Kit', href: getPermalink('/downloads') },
      ],
    },
    {
      text: 'عن Orbix',
      links: [
        { text: 'من نحن', href: getPermalink('/about') },
        { text: 'Orbix by RIVIA', href: getPermalink('/about') },
        { text: 'Documentation', href: getPermalink('/documentation') },
        { text: 'تواصل معنا', href: getPermalink('/contact') },
      ],
    },
  ],

  actions: [
    {
      text: 'ابدأ الآن',
      href: getPermalink('/contact'),
      variant: 'primary',
    },
  ],
};
export const footerData = {
  links: [
    {
      title: 'تطبيق Orbix',
      links: [
        { text: 'عن التطبيق', href: getPermalink('/app') },
        { text: 'العقارات', href: getPermalink('/industries/real-estate') },
        { text: 'الفنادق والإقامات', href: getPermalink('/industries/hospitality') },
        { text: 'الجولات الافتراضية', href: getPermalink('/virtual-tours') },
        { text: 'تحميل التطبيق', href: getPermalink('/downloads') },
      ],
    },
    {
      title: 'الخدمات',
      links: [
        { text: 'الدعم القانوني', href: getPermalink('/services/legal-support') },
        { text: 'المعاملات الإلكترونية', href: getPermalink('/services/e-transactions') },
        { text: 'الدعم التقني', href: getPermalink('/services/technical-support') },
        { text: 'حلول الدفع الدولي', href: getPermalink('/services/international-payments') },
      ],
    },
    {
      title: 'الشركة',
      links: [
        { text: 'عن Orbix', href: getPermalink('/about') },
        { text: 'الشركاء', href: getPermalink('/partners') },
        { text: 'العملاء', href: getPermalink('/clients') },
        { text: 'دراسات الحالة', href: getPermalink('/case-studies') },
        { text: 'تواصل معنا', href: getPermalink('/contact') },
      ],
    },
    {
      title: 'المعرفة',
      links: [
        { text: 'دليل المدن', href: getPermalink('/city-guides') },
        { text: 'الأدلة', href: getPermalink('/guides') },
        { text: 'المقالات', href: getPermalink('/articles') },
        { text: 'الأخبار', href: getPermalink('/news') },
        { text: 'المركز الإعلامي', href: getPermalink('/media') },
      ],
    },
  ],

  secondaryLinks: [
    { text: 'RSS', href: getAsset('/rss.xml') },
    { text: 'خريطة الموقع', href: getAsset('/sitemap-index.xml') },
    { text: 'llms.txt', href: getAsset('/llms.txt') },
    { text: 'سياسة الخصوصية', href: getPermalink('/privacy') },
    { text: 'الشروط والأحكام', href: getPermalink('/terms') },
    { text: 'ملفات الارتباط', href: getPermalink('/cookies') },
  ],

  socialLinks: [],

  footNote: '&copy; 2026 Orbix by RIVIA. Reality Reimagined. جميع الحقوق محفوظة.',
};
