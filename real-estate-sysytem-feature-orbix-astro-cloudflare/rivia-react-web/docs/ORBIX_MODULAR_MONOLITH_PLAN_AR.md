# خطة Orbix بنظام Modular Monolith

## الهدف

تحويل Orbix تدريجيا من تطبيق React يعتمد مباشرة على Firebase إلى منصة عقارية وإقامات لها Backend واحد منظم بنظام Modular Monolith، مع الحفاظ على مشروع Firebase الحالي كبيئة Production وعدم استخدامه لتجارب الميزات الجديدة.

Project ID الحالي يبقى:

`<production-firebase-project-id>`

يمكن تغيير اسم العرض فقط إلى:

`Orbix Production`

## المعمارية العامة

تتكون منصة Orbix من:

- `orbix-web`: واجهة React/Vite الحالية.
- `orbix-api`: Backend NestJS واحد بنظام Modular Monolith.
- Firebase Authentication: هوية المستخدمين وتسجيل الدخول.
- Firestore: تخزين بيانات المنصة في المرحلة الحالية.
- Firebase Storage: الوسائط الحالية في المرحلة الحالية.
- `orbix-cms`: Strapi مستقل لمحتوى Orbix والبنرات والصفحات.
- Photo Sphere Viewer: عرض الجولات الافتراضية.
- Cloud Run: استضافة `orbix-api`.
- Secret Manager: حفظ الأسرار ومفاتيح الخدمة.
- Cloud Logging وMonitoring: مراقبة وتشخيص.

PropTech Syria يبقى مشروعا مستقلا عن Orbix في الكود والمحتوى وStrapi وقاعدة البيانات.

## مسؤوليات المكونات

### React/Vite

- تسجيل الدخول والخروج عبر Firebase Client SDK.
- الحصول على Firebase ID Token.
- عرض الواجهات العامة ولوحات العميل والشريك والإدارة.
- استدعاء `orbix-api` للعمليات الحساسة.
- يمكنه استخدام تنبيهات فورية غير حساسة من Firebase عند الحاجة.

لا يقرر React:

- أن المستخدم Admin.
- أن العقار موثق.
- أن الحجز مؤكد أو مدفوع.
- أن الصفقة مكتملة.
- أن العمولة مدفوعة.
- أن الفندق أو الشريك أكد الحجز.

### NestJS

- نقطة الدخول الوحيدة للعمليات الحساسة.
- التحقق من Firebase ID Token.
- تطبيق الأدوار والصلاحيات.
- تنفيذ منطق الموديولات.
- التعامل مع Firestore عبر repositories فقط.
- تسجيل Audit Log للعمليات الحساسة.
- كشف API موثق عبر Swagger في Development فقط.

### Firebase Authentication

- يحتفظ بهوية المستخدم.
- يخزن UID والبريد/الهاتف ومزودي الدخول.
- يستخدم Custom Claims مختصرة للأدوار أو النطاقات عند الحاجة.

لا يخزن بيانات العمل التفصيلية مثل الشريك والحجوزات والمدفوعات والعقود.

### Firestore

- يبقى مخزن بيانات التشغيل في المرحلة الحالية.
- الوصول إليه من `orbix-api` فقط للعمليات الحساسة.
- يمنع استخدامه مباشرة داخل Controllers.
- يعزل خلف interfaces/repositories حتى يمكن نقله لاحقا إلى PostgreSQL.

### Firebase Storage

- يبقى لتخزين الوسائط الحالية.
- الوصول الجديد للعمليات الحساسة يكون عبر Media Module.
- لا تخزن صلاحيات الملفات أو metadata التشغيلية المهمة في أسماء الملفات فقط.

### Strapi

يدير المحتوى التحريري فقط:

- المقالات.
- النصائح.
- الخدمات.
- الأدلة.
- الأسئلة الشائعة.
- السياسات والقيم.
- البنرات.
- روابط Google Forms.
- روابط App Store وGoogle Play.
- قوائم التنقل.
- صفحات المدن والأحياء الخاصة بالـSEO.

لا يستخدم Strapi للمستخدمين أو العقارات التشغيلية أو الحجوزات أو المدفوعات أو التوفر أو الصفقات أو العمولات أو المفضلة.

## البيئات

توضع مشاريع Orbix تحت Google Cloud Organization الخاصة بـRIVIA:

- Orbix Production: المشروع الحالي الحقيقي.
- Orbix Staging: اختبار قبل النشر.
- Orbix Development: تطوير وتجارب.

القواعد:

- يمنع استخدام Production لتجربة الميزات الجديدة.
- Development يستخدم Firebase Emulator أو مشروع Firebase منفصل.
- Staging يماثل Production في الإعدادات دون بيانات حقيقية.
- الأسرار تحفظ في Secret Manager أو متغيرات بيئة محلية غير ملتزمة في Git.

## موديولات NestJS وحدودها

### Identity Module

المسؤولية:

- التحقق من Firebase ID Token.
- ملف المستخدم التجاري.
- الأدوار والصلاحيات.
- حماية المسارات.
- إدارة حالة المستخدم.

ملكية البيانات:

- UserProfile التجاري.
- Role وPermission mappings.
- علاقة `firebaseUid` بالمستخدم التجاري.

الأدوار الأولية:

- Customer.
- Partner.
- Partner Staff.
- Moderator.
- Admin.

### Partners Module

المسؤولية:

- المكاتب العقارية.
- المطورون.
- الفنادق.
- مضيفو الإقامات.
- أعضاء فريق الشريك.
- التحقق من الشريك.

ملكية البيانات:

- Partner.
- PartnerMember.
- PartnerVerification.
- Partner status.

### Properties Module

المسؤولية:

- عقارات البيع.
- الإيجار الطويل.
- المشاريع الجديدة.
- حالة النشر والتحقق.
- خصائص العقار.
- ربط العقار بالشريك والجولة.

ملكية البيانات:

- Property.
- PropertyStatus.
- PropertyVerification.
- PropertyFeature values التشغيلية.

### Stays Module

المسؤولية:

- الفنادق.
- الشقق المفروشة.
- الإقامات اليومية والأسبوعية.
- الغرف والوحدات.
- سياسات الإقامة.
- الأسعار الأساسية.

ملكية البيانات:

- Stay.
- Hotel.
- RoomType.
- Unit.
- StayPolicy.
- BaseRate.

### Availability Module

المسؤولية:

- تقويم التوفر.
- الأيام المحجوزة.
- منع الحجز المزدوج.
- الأسعار اليومية والأسبوعية.
- الحد الأدنى للإقامة.

ملكية البيانات:

- AvailabilityDay.
- AvailabilityHold.
- RateOverride.
- MinimumStayRule.

### Bookings Module

المسؤولية:

- طلب الحجز.
- تأكيد الفندق أو المضيف.
- الإلغاء.
- عدم الحضور.
- إكمال الإقامة.
- رقم الحجز.
- سجل تغير الحالة.

ملكية البيانات:

- Booking.
- Guest.
- BookingStatusHistory.
- BookingNumber.

### Virtual Tours Module

المسؤولية:

- الجولة الافتراضية.
- الطوابق.
- المشاهد.
- نقاط الانتقال.
- مخطط الطابق.
- الصور المصغرة.
- ربط الجولة بالعقار أو الفندق.

ملكية البيانات:

- VirtualTour.
- Floor.
- Scene.
- TourLink.
- TourMarker.

### Media Module

المسؤولية:

- رفع الصور والفيديو.
- صور 360.
- الصور المصغرة.
- مخططات الطوابق.
- صلاحيات الملفات.
- دورة حياة الملفات.

ملكية البيانات:

- MediaAsset.
- MediaVariant.
- UploadPolicy.
- FileOwnership.

### Leads Module

المسؤولية:

- طلب التواصل.
- طلب المعاينة.
- طلب شراء العقار.
- طلب الحجز الأولي.
- توزيع الطلب على الشريك.
- متابعة حالة العميل.

ملكية البيانات:

- Lead.
- LeadAssignment.
- LeadStatusHistory.
- CustomerIntent.

### Transactions Module

المسؤولية:

- معاملات البيع والإيجار.
- مراحل الصفقة.
- العقود.
- المستندات.
- العمولة المستحقة.
- إغلاق المعاملة.

ملكية البيانات:

- Transaction.
- DealStage.
- Contract.
- TransactionDocument.

### Payments Module

المسؤولية:

- العربون.
- عملية الدفع.
- حالة الدفع.
- Webhooks.
- الاسترداد.
- منع تكرار العملية.
- الربط مع مزودات الدفع.

ملكية البيانات:

- PaymentIntent.
- Payment.
- Refund.
- PaymentWebhookEvent.
- IdempotencyKey.

### Commissions Module

المسؤولية:

- عمولة Orbix.
- عمولة الشريك.
- سجل الاستحقاقات.
- الفواتير.
- التسويات المالية.

ملكية البيانات:

- CommissionRule.
- CommissionEntry.
- Invoice.
- Settlement.

### Reviews Module

المسؤولية:

- تقييم العقارات والإقامات.
- تقييم الشركاء.
- مراجعة التقييمات.
- مكافحة التقييمات الوهمية.

ملكية البيانات:

- Review.
- RatingAggregate.
- ReviewModeration.

### Notifications Module

المسؤولية:

- البريد الإلكتروني.
- إشعارات التطبيق.
- إشعارات الحجوزات.
- تنبيهات الشركاء.
- قوالب الرسائل.

ملكية البيانات:

- Notification.
- NotificationTemplate.
- DeliveryAttempt.

### Search Module

المسؤولية:

- البحث.
- الفلاتر.
- الخريطة.
- المدن والأحياء.
- ترتيب النتائج.
- إضافة Qdrant مستقبلا.

ملكية البيانات:

- SearchIndex projection.
- City.
- Neighborhood.
- RankingConfig.

### Content Module

المسؤولية:

- الاتصال مع Strapi.
- جلب المقالات والنصائح والخدمات والأدلة والFAQ والبنرات وصفحات المدن وروابط التطبيقات.

ملكية البيانات:

- لا يملك بيانات التشغيل.
- يملك تكامل API وDTOs/cache للمحتوى التحريري.

### Financing Module

مؤجل. المسؤولية المستقبلية:

- جهات التمويل.
- منتجات التمويل.
- طلبات الأهلية.
- المستندات.
- إحالات التمويل.
- عمولة Orbix.

### AI Module

مؤجل. المسؤولية المستقبلية:

- البحث الدلالي.
- توصية العقارات.
- مطابقة العميل مع العقار.
- تقييم جودة الإعلان.
- Qdrant.
- ربط LLM عند الحاجة.

## قواعد التواصل بين الموديولات

- جميع الموديولات داخل تطبيق NestJS واحد.
- كل موديول يملك منطق العمل وRepository الخاص به.
- ممنوع وصول موديول مباشرة إلى بيانات موديول آخر.
- التواصل يتم عبر Services أو Use Cases أو Domain Events.
- Controllers لا تتعامل مع Firestore أو Storage مباشرة.
- DTO Validation إلزامي لكل مدخل.
- الأدوار لا تأتي من الواجهة.
- قرارات الحجز والدفع والتوثيق والإدارة تصدر من NestJS فقط.
- لا Microservices في المرحلة الحالية.

## توزيع البيانات

### Firebase Authentication

- UID.
- البريد أو الهاتف.
- حالة تحقق البريد/الهاتف.
- providers.
- Custom Claims مختصرة.

### Firestore

- UserProfile التجاري في المرحلة الحالية.
- Partners وProperties وStays وAvailability وBookings وLeads وTransactions وPayments وCommissions وReviews وNotifications كبيانات تشغيلية مؤقتة.
- AuditLog.
- Metadata للجولات والوسائط.

### Firebase Storage

- الصور الحالية.
- الفيديو الحالي.
- صور 360 الحالية.
- ملفات الرفع المؤقتة أو الحالية.

### Strapi

- المحتوى التحريري والبنرات والصفحات وروابط التطبيقات والSEO content فقط.

## الأمن

- React يرسل Firebase ID Token فقط.
- NestJS يتحقق من token عبر Firebase Admin SDK.
- RolesGuard يقرأ الصلاحيات من مصدر موثوق داخل السيرفر.
- يمنع قبول role من body أو query أو headers غير موثوقة.
- CORS مضبوط حسب البيئة.
- Helmet مفعل.
- ValidationPipe عام.
- Exception Filter موحد يمنع تسريب تفاصيل داخلية.
- Request ID لكل طلب.
- Logging مبدئي دون أسرار.
- Audit Log للعمليات الحساسة، وتبدأ هيكليا في المرحلة الأولى.
- Production لا يستخدم للاختبارات أو التطوير.

## مراحل التنفيذ

### المرحلة الأولى: الأساس

- إنشاء `orbix-api`.
- إعداد NestJS.
- إعداد Firebase Admin.
- إنشاء Health Endpoint.
- تنفيذ FirebaseAuthGuard.
- تنفيذ Roles وPermissions.
- إعداد Validation وError Handling.
- إضافة Logging وAudit Log.
- ربط Development وStaging.

### المرحلة الثانية: العقارات والعملاء

- Partners Module.
- Properties Module.
- Leads Module.
- نقل العمليات الحساسة من React إلى NestJS.
- منع الكتابة الإدارية المباشرة إلى Firestore.
- إضافة التحقق من ملكية العقار.

### المرحلة الثالثة: المحتوى والجولات

- إنشاء Strapi مستقل لـOrbix.
- نقل طبقة CMS المناسبة من مشروع المجلة.
- إضافة المقالات والأدلة والبنرات.
- تنفيذ Virtual Tours Module.
- استخدام Photo Sphere Viewer.
- إضافة المشاهد والطوابق والمخططات.

### المرحلة الرابعة: الإقامات

- Stays Module.
- الغرف والوحدات.
- الأسعار اليومية والأسبوعية.
- Request to Book.
- لوحة استقبال الطلبات للشريك.
- رقم حجز Orbix.

### المرحلة الخامسة: الحجز الكامل

- Availability Module.
- منع الحجز المزدوج.
- Booking State Machine.
- الإلغاء وعدم الحضور.
- الحجز الفوري.
- مزامنة التوفر.

### المرحلة السادسة: المدفوعات والعمولات

- Payments Module.
- العربون.
- Webhooks.
- Refunds.
- Idempotency.
- Commissions Module.
- الفواتير والتسويات.

### المرحلة السابعة: الذكاء والتمويل

- Search Module المتقدم.
- Qdrant.
- التوصيات.
- التمويل العقاري.
- إحالات الجهات الممولة.
- أدوات الذكاء الاصطناعي.

## الأمور المؤجلة

- PostgreSQL: يؤجل إلى حين تثبيت API boundaries، مع الحفاظ على repositories حتى يسهل النقل.
- Cloudflare R2: يؤجل إلى مرحلة Media v2، مع استمرار Firebase Storage للوسائط الحالية.
- المدفوعات الكاملة: تؤجل حتى اختبار الطلب الحقيقي في السوق.
- Qdrant والذكاء الاصطناعي: يؤجلان إلى مرحلة لاحقة بعد توفر بيانات نظيفة وفهارس بحث.
- Microservices: ممنوعة في المرحلة الحالية.

## أول نسخة قابلة للبيع

لا تنتظر اكتمال جميع الموديولات. النسخة الأولى القابلة للبيع تتكون من:

- تسجيل الدخول.
- الشركاء.
- العقارات الموثقة.
- الصور والجولات الافتراضية.
- طلبات التواصل والمعاينة.
- Orbix Showcase.
- مقالات وأدلة وبانرات من Strapi.
- لوحة بسيطة للشريك.

يمكن بيع:

- تصوير وتجهيز العقار.
- الجولات الافتراضية.
- الإعلانات المميزة.
- صفحات مشاريع المطورين.
- العملاء المحتملين.
- خدمات تقديم العقار رقميا.

ثم تضاف الحجوزات والمدفوعات بعد اختبار الطلب الحقيقي في السوق.
