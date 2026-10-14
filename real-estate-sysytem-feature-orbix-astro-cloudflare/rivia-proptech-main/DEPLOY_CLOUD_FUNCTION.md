# نشر Cloud Function لإرسال إشعارات FCM

## المشكلة الحالية
المستندات تُنشأ في Firestore بنجاح، لكن الإشعارات لا تصل إلى الأجهزة.

## السبب
Cloud Function لم تُنشر بعد أو لا تعمل بشكل صحيح.

## الحل

### الخطوة 1: تثبيت Dependencies
```bash
cd functions
npm install
```

### الخطوة 2: نشر Cloud Function
```bash
cd ..
firebase deploy --only functions:sendFCMNotification
```

أو نشر جميع Functions:
```bash
firebase deploy --only functions
```

### الخطوة 3: التحقق من النشر
1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. اختر مشروعك: `rivia-proptech-a0ff2`
3. اذهب إلى **Functions**
4. تأكد من وجود function باسم `sendFCMNotification`
5. يجب أن تكون الحالة **Deployed** (نُشرت)

### الخطوة 4: التحقق من Logs
1. في Firebase Console > Functions
2. اضغط على `sendFCMNotification`
3. اذهب إلى **Logs**
4. أرسل إشعار من التطبيق
5. يجب أن ترى logs مثل:
   - `FCM Notification Request received: ...`
   - `Sending FCM notifications to X devices...`
   - `Successfully sent X messages`

### الخطوة 5: التحقق من حالة المستندات
1. اذهب إلى Firestore Console
2. اذهب إلى collection `fcm_notification_requests`
3. تحقق من المستندات:
   - `status: 'pending'` → Cloud Function لم تعمل بعد
   - `status: 'completed'` → تم الإرسال بنجاح ✅
   - `status: 'failed'` → فشل الإرسال (تحقق من `error`)

## استكشاف الأخطاء

### المشكلة: Cloud Function غير موجودة
**الحل**: انشر Cloud Function كما هو موضح أعلاه

### المشكلة: Cloud Function موجودة لكن لا تعمل
**الحل**:
1. تحقق من Logs في Firebase Console
2. تحقق من أن `functions/index.js` صحيح
3. أعد نشر Cloud Function

### المشكلة: الإشعارات لا تصل
**الحل**:
1. تحقق من أن FCM tokens صحيحة في Firestore
2. تحقق من Logs في Firebase Console
3. تأكد من أن التطبيق مغلق تماماً (ليس فقط في الخلفية)
4. تحقق من إعدادات الإشعارات في الجهاز

### المشكلة: `status: 'failed'` في Firestore
**الحل**:
1. افتح المستند في Firestore
2. اقرأ حقل `error` لمعرفة السبب
3. الأخطاء الشائعة:
   - `Invalid registration token` → FCM token غير صحيح أو منتهي الصلاحية
   - `Permission denied` → مشكلة في الصلاحيات
   - `Network error` → مشكلة في الشبكة

## ملاحظات مهمة

1. **Cloud Function ضرورية**: بدون نشر Cloud Function، لن تصل الإشعارات خارج التطبيق
2. **FCM Tokens**: يجب أن تكون tokens صحيحة ومحدثة
3. **الإشعارات خارج التطبيق**: تحتاج إلى تطبيق مغلق تماماً (ليس فقط في الخلفية)
4. **Logs**: دائماً تحقق من Logs في Firebase Console لمعرفة المشاكل

