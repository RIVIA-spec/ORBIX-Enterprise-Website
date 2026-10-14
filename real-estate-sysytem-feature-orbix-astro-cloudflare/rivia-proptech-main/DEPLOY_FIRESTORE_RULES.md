# نشر قواعد Firestore

## المشكلة
القواعد المحدثة في `firestore.rules` تحتاج إلى نشرها في Firebase Console.

## الحل

### الطريقة 1: من Firebase Console (الأسهل)
1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. اختر مشروعك: `rivia-proptech-a0ff2`
3. اذهب إلى **Firestore Database** > **Rules**
4. انسخ محتوى ملف `firestore.rules` بالكامل
5. الصق المحتوى في محرر القواعد
6. اضغط **Publish** (نشر)

### الطريقة 2: من Terminal (إذا كان Firebase CLI مثبت)
```bash
firebase use rivia-proptech-a0ff2
firebase deploy --only firestore:rules
```

## التحقق من النشر
بعد النشر:
1. تأكد من أن القواعد الجديدة ظاهرة في Firebase Console
2. جرّب إرسال إشعار من التطبيق مرة أخرى
3. يجب أن تعمل الآن بدون أخطاء

## ملاحظة مهمة
القاعدة المحدثة تسمح للمستخدمين الذين لديهم `role: 'admin'` أو `role: 'owner'` بإنشاء مستندات في `fcm_notification_requests`.

