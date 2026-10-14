# ✅ القواعد النهائية الصحيحة لـ Storage

## 📋 انسخ هذا الكود بالكامل والصقه في Firebase Console → Storage → Rules

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    // دالة مساعدة: هل المستخدم صاحب التطبيق
    function isAppOwner() {
      return request.auth != null
          && exists(/databases/(default)/documents/users/$(request.auth.uid))
          && get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'owner';
    }
    
    // دالة مساعدة: هل المستخدم أدمن؟
    function isAdmin() {
      return request.auth != null
          && exists(/databases/(default)/documents/users/$(request.auth.uid))
          && get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // 1. صور الهوية
    match /id_verifications/{userId}/{allPaths=**} {
      // القراءة: المستخدم نفسه أو الأدمن
      allow read: if request.auth != null && (request.auth.uid == userId || isAppOwner() || isAdmin());
      
      // الكتابة (إنشاء، تحديث، حذف): المستخدم نفسه أو الأدمن
      allow write: if request.auth != null && (request.auth.uid == userId || isAppOwner() || isAdmin());
    }

    // 2. صور العقارات العادية
    match /properties/{userId}/property_images/{allPaths=**} {
      // القراءة: الجميع
      allow read: if true;
      
      // الكتابة: صاحب العقار أو الأدمن
      allow write: if request.auth != null && (request.auth.uid == userId || isAppOwner() || isAdmin());
    }

    // 3. صور الجولات البانوراما
    match /properties/{userId}/panorama_tours/{allPaths=**} {
      // القراءة: الجميع
      allow read: if true;
      
      // الكتابة: صاحب العقار أو الأدمن
      allow create, write: if request.auth != null && (request.auth.uid == userId || isAppOwner() || isAdmin());
    }

    // 4. صور الفنادق - ✅ محدثة لتطابق قواعد العقارات
    match /hotels/{userId}/{allPaths=**} {
      // القراءة: الجميع
      allow read: if true;
      
      // الكتابة (إنشاء، تحديث، حذف): المستخدم نفسه أو صاحب التطبيق أو الأدمن
      allow write: if request.auth != null && (request.auth.uid == userId || isAppOwner() || isAdmin());
    }

    // 5. كل شيء آخر ممنوع
    match /{allPaths=**} {
      allow read, write: if false;
    }

  }
}
```

---

## 🔍 التغيير المهم:

**قبل (خاطئ):**
```javascript
allow write: if isAppOwner() || isAdmin();
```

**بعد (صحيح):**
```javascript
allow write: if request.auth != null && (request.auth.uid == userId || isAppOwner() || isAdmin());
```

---

## ✅ لماذا هذا التغيير مهم؟

1. **قواعد العقارات تعمل** لأنها تسمح للمستخدم نفسه بالكتابة: `request.auth.uid == userId`
2. **قواعد الفنادق لم تكن تعمل** لأنها كانت تسمح فقط لـ owner/admin وليس للمستخدم نفسه
3. **الآن الفنادق تعمل** لأنها تطابق قواعد العقارات تماماً

---

## 📝 خطوات التطبيق:

1. افتح Firebase Console → Storage → Rules
2. **احذف كل القواعد القديمة**
3. انسخ الكود أعلاه بالكامل
4. الصقه في Firebase Console
5. اضغط **Publish**
6. انتظر بضع ثوانٍ
7. جرب إنشاء فندق مرة أخرى

---

## 🎯 النتيجة المتوقعة:

بعد تطبيق هذه القواعد:
- ✅ المستخدم نفسه يمكنه رفع الصور في `hotels/{userId}/...`
- ✅ owner يمكنه رفع الصور في أي `hotels/{userId}/...`
- ✅ admin يمكنه رفع الصور في أي `hotels/{userId}/...`

تماماً مثل قواعد العقارات! 🎉

