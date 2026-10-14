# Cookie Consent Firestore Rules Tests

هذا الملف يصف اختبارات Firebase Rules Playground اليدوية لمستند:

```txt
/app_settings/cookie_consent
```

لا يوجد داخل مشروع React الحالي `firestore.rules` أو `firebase.json`، لذلك لا تشغل `firebase init` ولا تنشر من هذا المجلد. نفذ هذه الاختبارات في Firebase Console بعد دمج المقطع يدويا.

## مستند صالح

استخدم مستندا بهذه البنية، مع جعل `updatedBy` مساويا لمعرف المستخدم المصادق عليه في Rules Playground، و`updatedAt` مساويا لـ`request.time` أو timestamp الاختبار الذي تمثله الواجهة:

```json
{
  "enabled": true,
  "version": 1,
  "policyLastUpdated": "2026-07-21",
  "titleAr": "ملفات تعريف الارتباط",
  "descriptionAr": "نستخدم ملفات تعريف الارتباط الضرورية لتشغيل Orbix. يمكنك قبول جميع الملفات أو رفض غير الضروري.",
  "acceptAllLabelAr": "قبول الكل",
  "rejectOptionalLabelAr": "رفض غير الضروري",
  "policyLinkLabelAr": "قراءة سياسة الكوكيز",
  "essentialEnabled": true,
  "analyticsEnabled": false,
  "marketingEnabled": false,
  "analyticsProviderName": "",
  "marketingProviderName": "",
  "bannerPosition": "bottom-right",
  "requireRenewedConsent": false,
  "updatedAt": "request.time",
  "updatedBy": "AUTH_UID"
}
```

## اختبار القراءة

`get` على `/app_settings/cookie_consent` يجب أن تكون نتيجته:

- زائر: `Allow`
- مستخدم عادي: `Allow`
- staff: `Allow`
- moderator: `Allow`
- admin: `Allow`
- owner / app owner: `Allow`
- superadmin: `Allow` إذا كان الدور موجودا فعليا في القواعد المختارة

## اختبار الكتابة

اختبر `create` عند عدم وجود المستند، و`update` عند وجوده باستخدام المستند الصالح أعلاه.

- زائر: `Deny`
- مستخدم عادي بدور `user`: `Deny`
- staff: `Deny`
- moderator: `Deny`
- admin: `Allow`
- owner / app owner: `Allow`
- superadmin: `Allow` إن كان موجودا فعليا ومضافا إلى helper أو إلى نسخة القواعد المستقلة

يجب أن تطابق بيانات `users/{uid}` في Rules Playground بنية الأدوار الفعلية. الحقول التي تدعمها نسخة التوثيق المستقلة هي `role`, `isAdmin`, `isOwner`, `isAppOwner`.

## اختبار الحذف

اختبر `delete` على المسار نفسه. يجب أن تكون النتيجة `Deny` للجميع:

- زائر: `Deny`
- مستخدم عادي: `Deny`
- staff: `Deny`
- moderator: `Deny`
- admin: `Deny`
- owner / app owner: `Deny`
- superadmin: `Deny`

## اختبارات Validation

يجب رفض الحالات التالية حتى من حساب admin:

- `essentialEnabled = false`
- `version = 0`
- `version` أقل من الإصدار السابق عند `update`
- زيادة `version` بأكثر من `1` في عملية واحدة
- `bannerPosition` بقيمة غير `bottom-right` أو `bottom-center`
- وجود حقل إضافي غير معروف
- غياب أي حقل من الحقول المسموحة المطلوبة
- `updatedBy` مختلف عن `request.auth.uid`
- `updatedAt` لا يساوي `request.time`
- `analyticsEnabled = true` حاليا
- `marketingEnabled = true` حاليا
- `titleAr` فارغ
- `descriptionAr` فارغ
- `acceptAllLabelAr` فارغ
- `rejectOptionalLabelAr` فارغ
- `policyLinkLabelAr` فارغ
- `titleAr` أطول من 120 حرفا
- `descriptionAr` أطول من 1500 حرف
- أي نص زر أو رابط سياسة أطول من 80 حرفا
- `analyticsProviderName` أو `marketingProviderName` أطول من 120 حرفا
- نوع بيانات خاطئ، مثل `enabled` كنص أو `version` كنص أو `updatedAt` كنص

## النتيجة المتوقعة قبل النشر

الواجهة تمنع غير المخولين من رؤية صفحة إعدادات الكوكيز أو الحفظ منها، لكن منع الكتابة الحقيقي يجب أن يكون داخل Firestore Rules المنشورة. لا تعتبر نتيجة REST 403 مجهولة اختبارا نهائيا للقواعد؛ استخدم التطبيق أو Rules Playground بعد نشر القواعد يدويا.
