# Firestore Rules Snippet: Cookie Consent Settings

هذا الملف توثيق فقط. لا يوجد داخل مشروع React الحالي `firestore.rules` أو `firebase.json` أو `.firebaserc`، ولا يجب إنشاء أو ربط أو نشر قواعد Firebase تلقائيا من هذا المجلد.

إعدادات الكوكيز التي تستخدمها الواجهة مخزنة في:

```txt
app_settings/cookie_consent
```

ادمج إحدى النسختين التاليتين داخل قواعد المشروع الحالية، داخل:

```txt
match /databases/{database}/documents {
  ...
}
```

لا تستبدل قواعد قاعدة البيانات كلها بهذا المقطع.

## النسخة A: عند وجود Helpers حالية

استخدم هذه النسخة إذا كانت القواعد الحالية تحتوي helpers مثل `isAdmin()` و`isAppOwner()` و`hasRole(role)`. عدل أسماء helpers فقط إذا كانت مختلفة في مشروع Firebase الفعلي.

```txt
function isCookieSettingsAdmin() {
  return isAdmin()
    || isAppOwner()
    || hasRole('owner')
    || hasRole('admin')
    || hasRole('superadmin')
    || hasRole('super_admin');
}

function cookieSettingsKeys() {
  return [
    'enabled',
    'version',
    'policyLastUpdated',
    'titleAr',
    'descriptionAr',
    'acceptAllLabelAr',
    'rejectOptionalLabelAr',
    'policyLinkLabelAr',
    'essentialEnabled',
    'analyticsEnabled',
    'marketingEnabled',
    'analyticsProviderName',
    'marketingProviderName',
    'bannerPosition',
    'requireRenewedConsent',
    'updatedAt',
    'updatedBy'
  ];
}

function validCookieConsentBase() {
  return request.resource.data.keys().hasOnly(cookieSettingsKeys())
    && request.resource.data.keys().hasAll(cookieSettingsKeys())
    && request.resource.data.enabled is bool
    && request.resource.data.version is int
    && request.resource.data.version >= 1
    && request.resource.data.policyLastUpdated is string
    && request.resource.data.policyLastUpdated.size() > 0
    && request.resource.data.policyLastUpdated.size() <= 40
    && request.resource.data.titleAr is string
    && request.resource.data.titleAr.size() > 0
    && request.resource.data.titleAr.size() <= 120
    && request.resource.data.descriptionAr is string
    && request.resource.data.descriptionAr.size() > 0
    && request.resource.data.descriptionAr.size() <= 1500
    && request.resource.data.acceptAllLabelAr is string
    && request.resource.data.acceptAllLabelAr.size() > 0
    && request.resource.data.acceptAllLabelAr.size() <= 80
    && request.resource.data.rejectOptionalLabelAr is string
    && request.resource.data.rejectOptionalLabelAr.size() > 0
    && request.resource.data.rejectOptionalLabelAr.size() <= 80
    && request.resource.data.policyLinkLabelAr is string
    && request.resource.data.policyLinkLabelAr.size() > 0
    && request.resource.data.policyLinkLabelAr.size() <= 80
    && request.resource.data.essentialEnabled == true
    && request.resource.data.analyticsEnabled == false
    && request.resource.data.marketingEnabled == false
    && request.resource.data.analyticsProviderName is string
    && request.resource.data.analyticsProviderName.size() <= 120
    && request.resource.data.marketingProviderName is string
    && request.resource.data.marketingProviderName.size() <= 120
    && request.resource.data.bannerPosition in ['bottom-right', 'bottom-center']
    && request.resource.data.requireRenewedConsent == false
    && request.resource.data.updatedBy is string
    && request.resource.data.updatedBy == request.auth.uid
    && request.resource.data.updatedAt is timestamp
    && request.resource.data.updatedAt == request.time;
}

function validCookieConsentCreate() {
  return validCookieConsentBase()
    && request.resource.data.version == 1;
}

function validCookieConsentUpdate() {
  return validCookieConsentBase()
    && request.resource.data.version >= resource.data.version
    && request.resource.data.version <= resource.data.version + 1;
}

match /app_settings/cookie_consent {
  allow read: if true;
  allow create: if isCookieSettingsAdmin()
                && validCookieConsentCreate();
  allow update: if isCookieSettingsAdmin()
                && validCookieConsentUpdate();
  allow delete: if false;
}
```

## النسخة B: مستقلة ومحدودة لمستند الكوكيز

استخدم هذه النسخة إذا لم تكن helpers الحالية معروفة. يجب مطابقة الحقول داخل `users/{uid}` مع بنية الأدوار الفعلية قبل النشر. هذه النسخة تمنع `staff` و`moderator` من تعديل إعدادات الكوكيز.

```txt
function signedIn() {
  return request.auth != null;
}

function userProfile() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
}

function truthy(value) {
  return value == true || value == 1 || value == 'true';
}

function isCookieSettingsAdmin() {
  return signedIn() && (
    userProfile().role in ['admin', 'owner', 'superadmin', 'super_admin']
    || truthy(userProfile().isAdmin)
    || truthy(userProfile().isAppOwner)
    || truthy(userProfile().isOwner)
  );
}

function cookieSettingsKeys() {
  return [
    'enabled',
    'version',
    'policyLastUpdated',
    'titleAr',
    'descriptionAr',
    'acceptAllLabelAr',
    'rejectOptionalLabelAr',
    'policyLinkLabelAr',
    'essentialEnabled',
    'analyticsEnabled',
    'marketingEnabled',
    'analyticsProviderName',
    'marketingProviderName',
    'bannerPosition',
    'requireRenewedConsent',
    'updatedAt',
    'updatedBy'
  ];
}

function validCookieConsentBase() {
  return request.resource.data.keys().hasOnly(cookieSettingsKeys())
    && request.resource.data.keys().hasAll(cookieSettingsKeys())
    && request.resource.data.enabled is bool
    && request.resource.data.version is int
    && request.resource.data.version >= 1
    && request.resource.data.policyLastUpdated is string
    && request.resource.data.policyLastUpdated.size() > 0
    && request.resource.data.policyLastUpdated.size() <= 40
    && request.resource.data.titleAr is string
    && request.resource.data.titleAr.size() > 0
    && request.resource.data.titleAr.size() <= 120
    && request.resource.data.descriptionAr is string
    && request.resource.data.descriptionAr.size() > 0
    && request.resource.data.descriptionAr.size() <= 1500
    && request.resource.data.acceptAllLabelAr is string
    && request.resource.data.acceptAllLabelAr.size() > 0
    && request.resource.data.acceptAllLabelAr.size() <= 80
    && request.resource.data.rejectOptionalLabelAr is string
    && request.resource.data.rejectOptionalLabelAr.size() > 0
    && request.resource.data.rejectOptionalLabelAr.size() <= 80
    && request.resource.data.policyLinkLabelAr is string
    && request.resource.data.policyLinkLabelAr.size() > 0
    && request.resource.data.policyLinkLabelAr.size() <= 80
    && request.resource.data.essentialEnabled == true
    && request.resource.data.analyticsEnabled == false
    && request.resource.data.marketingEnabled == false
    && request.resource.data.analyticsProviderName is string
    && request.resource.data.analyticsProviderName.size() <= 120
    && request.resource.data.marketingProviderName is string
    && request.resource.data.marketingProviderName.size() <= 120
    && request.resource.data.bannerPosition in ['bottom-right', 'bottom-center']
    && request.resource.data.requireRenewedConsent == false
    && request.resource.data.updatedBy is string
    && request.resource.data.updatedBy == request.auth.uid
    && request.resource.data.updatedAt is timestamp
    && request.resource.data.updatedAt == request.time;
}

function validCookieConsentCreate() {
  return validCookieConsentBase()
    && request.resource.data.version == 1;
}

function validCookieConsentUpdate() {
  return validCookieConsentBase()
    && request.resource.data.version >= resource.data.version
    && request.resource.data.version <= resource.data.version + 1;
}

match /app_settings/cookie_consent {
  allow read: if true;
  allow create: if isCookieSettingsAdmin()
                && validCookieConsentCreate();
  allow update: if isCookieSettingsAdmin()
                && validCookieConsentUpdate();
  allow delete: if false;
}
```

## ملاحظات أمنية

- القراءة العامة مسموحة لأن البانر العام يحتاج إعدادات النصوص والنسخة.
- الإنشاء والتعديل محصوران في `admin` و`owner/app owner` و`superadmin/super_admin` إذا كان هذا الدور مستخدما فعليا.
- `staff` و`moderator` والمستخدم العادي والزائر لا يملكون صلاحية تعديل هذا المستند.
- حذف `app_settings/cookie_consent` ممنوع للجميع.
- `updatedBy` يجب أن يساوي `request.auth.uid` حتى لا يستطيع المدير إرسال معرف مستخدم آخر.
- `updatedAt == request.time` متوافق مع `serverTimestamp()` في `cookieConsentSettingsService.ts`.
- `version` عند الإنشاء يجب أن يساوي `1`.
- عند التحديث لا يمكن تخفيض `version` ولا زيادته بأكثر من `1` في عملية واحدة. الواجهة لا توفر حقلا يدويا لتعديل `version`; الزيادة تحدث فقط بعد Confirm عند تفعيل خيار طلب الموافقة من المستخدمين مرة أخرى، وبعد نجاح الحفظ تعاد `requireRenewedConsent` إلى `false`.
- يتم فرض `analyticsEnabled == false` و`marketingEnabled == false` مؤقتا لأن المشروع لا يحتوي مزود Analytics أو Marketing فعلي. بعد ربط مزود حقيقي وتحديث سياسة الخصوصية يمكن إزالة هذين القيدين أو استبدالهما بمنطق موافقة مناسب.

## طريقة الدمج داخل Firebase Console

1. افتح Firebase Console.
2. اختر مشروع Firebase الصحيح: `rivia-proptech-a0ff2`.
3. افتح Firestore Database.
4. افتح تبويب Rules.
5. خذ نسخة احتياطية كاملة من القواعد الحالية قبل أي تعديل.
6. ادمج functions والمقطع المختار داخل `match /databases/{database}/documents`.
7. لا تستبدل باقي قواعد Collections.
8. اختبر الحالات في Rules Playground حسب `FIRESTORE_COOKIE_SETTINGS_TESTS.md`.
9. اضغط Publish فقط بعد نجاح الاختبارات.

الحماية على مستوى Firestore لن تصبح فعالة إلا بعد الدمج والنشر اليدوي من Firebase Console.
