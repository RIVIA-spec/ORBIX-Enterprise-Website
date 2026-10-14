# ✅ القواعد الصحيحة لـ Storage

## ⚠️ مهم: احذف القاعدة الخاطئة `match /rooms/{roomId}`

القاعدة `match /rooms/{roomId}` في قواعدك الحالية **خاطئة** ويجب حذفها.

---

## 📋 القواعد الصحيحة (انسخها بالكامل):

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

    // 4. صور الفنادق - هذه القاعدة تطابق جميع المسارات تحت hotels/{userId}/
    match /hotels/{userId}/{allPaths=**} {
      // القراءة: الجميع
      allow read: if true;
      
      // الكتابة (إنشاء، تحديث، حذف): صاحب التطبيق أو الأدمن
      allow write: if isAppOwner() || isAdmin();
    }

    // 5. كل شيء آخر ممنوع
    match /{allPaths=**} {
      allow read, write: if false;
    }

  }
}
```

---

## 🔍 شرح المسار:

المسار الفعلي في الكود:
```
hotels/{userId}/hotel_rooms/{hotelId}/{fileName}
```

القاعدة `match /hotels/{userId}/{allPaths=**}` تطابق:
- ✅ `hotels/{userId}/hotel_rooms/{hotelId}/{fileName}`
- ✅ `hotels/{userId}/hotel_rooms/{hotelId}/panorama_tours/{fileName}`
- ✅ أي مسار فرعي تحت `hotels/{userId}/`

---

## ❌ القاعدة الخاطئة (احذفها):

```javascript
// ❌ هذه القاعدة خاطئة - احذفها!
match /rooms/{roomId} {
  allow create, update, delete, write: if isAppOwner() || isAdmin();
}
```

**لماذا خاطئة؟**
- المسار الفعلي لا يبدأ بـ `/rooms/`
- المسار الفعلي يبدأ بـ `/hotels/{userId}/...`
- هذه القاعدة لا تطابق أي مسار في Storage

---

## 📝 خطوات التصحيح:

1. افتح Firebase Console → Storage → Rules
2. **احذف** القاعدة `match /rooms/{roomId} { ... }`
3. تأكد من وجود القاعدة `match /hotels/{userId}/{allPaths=**} { ... }`
4. اضغط **Publish**

---

## ✅ بعد التصحيح:

المسار `hotels/{userId}/hotel_rooms/{hotelId}/{fileName}` سيتم تطابقه بواسطة:
```javascript
match /hotels/{userId}/{allPaths=**} {
  allow write: if isAppOwner() || isAdmin();
}
```

وستعمل الصلاحيات بشكل صحيح! 🎉

