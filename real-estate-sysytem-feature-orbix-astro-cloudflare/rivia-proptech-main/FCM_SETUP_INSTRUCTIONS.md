# تعليمات إعداد FCM للإشعارات خارج التطبيق

## المشكلة الحالية
الإشعارات تعمل داخل التطبيق لكن لا تصل خارج التطبيق.

## الحلول المطبقة

### 1. إعدادات AndroidManifest.xml ✅
تم إضافة الصلاحيات المطلوبة:
- `POST_NOTIFICATIONS`
- `VIBRATE`
- إعدادات FCM (channel, icon, color)

### 2. Cloud Function ✅
تم إنشاء Cloud Function في `functions/index.js`

## الخطوات المطلوبة لتفعيل الإشعارات

### الخطوة 1: تثبيت Cloud Functions
```bash
cd functions
npm install
```

### الخطوة 2: نشر Cloud Function
```bash
firebase deploy --only functions
```

أو إذا كنت في مجلد functions:
```bash
cd ..
firebase deploy --only functions
```

### الخطوة 3: التحقق من نشر Cloud Function
1. اذهب إلى Firebase Console
2. اذهب إلى Functions
3. تأكد من وجود function باسم `sendFCMNotification`

### الخطوة 4: اختبار الإشعارات
1. سجّل دخول من جهاز
2. تأكد من أن FCM token موجود في `users/{userId}/fcm_token`
3. أرسل إشعار من قسم الأدمن
4. أغلق التطبيق تماماً (ليس فقط في الخلفية)
5. يجب أن يصل الإشعار خارج التطبيق

## التحقق من المشاكل

### 1. التحقق من FCM Token
- افتح Firestore Console
- اذهب إلى `users/{userId}`
- تأكد من وجود حقل `fcm_token` مع قيمة

### 2. التحقق من Cloud Function
- افتح Firebase Console > Functions
- ابحث عن `sendFCMNotification`
- تحقق من Logs لرؤية الأخطاء

### 3. التحقق من طلبات الإشعارات
- افتح Firestore Console
- اذهب إلى collection `fcm_notification_requests`
- تحقق من:
  - هل تم إنشاء المستندات؟
  - ما هي حالة المستندات؟ (pending, completed, failed)
  - إذا كانت failed، تحقق من حقل `error`

## ملاحظات مهمة

1. **الإشعارات خارج التطبيق تحتاج إلى Cloud Function**
   - بدون Cloud Function، لن تصل الإشعارات خارج التطبيق
   - Cloud Function هي التي ترسل الإشعارات فعلياً

2. **FCM Token يجب أن يكون موجوداً**
   - يتم حفظه تلقائياً عند تسجيل الدخول
   - إذا لم يكن موجوداً، سجّل خروج ثم دخول مرة أخرى

3. **صلاحيات الإشعارات**
   - يجب أن يكون المستخدم قد وافق على صلاحيات الإشعارات
   - في Android 13+، يجب طلب صلاحية `POST_NOTIFICATIONS`

4. **اختبار الإشعارات**
   - أغلق التطبيق تماماً (ليس فقط في الخلفية)
   - الإشعارات في الخلفية تصل فقط إذا كان التطبيق في الخلفية
   - الإشعارات خارج التطبيق تصل فقط إذا كان التطبيق مغلقاً تماماً

## استكشاف الأخطاء

### المشكلة: لا تصل الإشعارات
1. تحقق من أن Cloud Function نُشرت
2. تحقق من Logs في Firebase Console
3. تحقق من وجود FCM token في Firestore
4. تحقق من أن المستخدم وافق على صلاحيات الإشعارات

### المشكلة: Cloud Function تفشل
1. تحقق من Logs في Firebase Console > Functions
2. تحقق من أن `firebase-admin` و `firebase-functions` مثبتة
3. تحقق من أن Firebase Project صحيح

### المشكلة: FCM Token غير موجود
1. سجّل خروج ثم دخول مرة أخرى
2. تحقق من Logs في التطبيق
3. تحقق من أن `FCMService().initialize()` يتم استدعاؤه

