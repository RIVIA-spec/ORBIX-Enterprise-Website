import 'dart:developer';
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class IdentityController extends GetxController {
  var frontImage = Rxn<File>();
  var backImage = Rxn<File>();
  var isUploading = false.obs;
  var isLoading = false.obs;
  

  // الحالة الحالية للطلب
  var verificationStatus = RxnString(); // null, pending, verified, rejected
  var rejectionReason = RxnString();
  var canSubmitNewRequest = true.obs; // هل يمكن إرسال طلب جديد؟

  // روابط الصور من Firestore
  var frontIdUrl = RxnString();
  var backIdUrl = RxnString();

  @override
  void onInit() {
    super.onInit();
    loadVerificationStatus();
  }

  /// جلب آخر طلب تحقق (فقط إذا كان pending أو rejected)
  Future<void> loadVerificationStatus() async {
    try {
      isLoading.value = true;
      final userId = FirebaseAuth.instance.currentUser!.uid;
      final doc = await FirebaseFirestore.instance
          .collection('verifications')
          .doc(userId)
          .get();

      if (!doc.exists) {
        verificationStatus.value = null;
        canSubmitNewRequest.value = true;
        frontIdUrl.value = null;
        backIdUrl.value = null;
        return;
      }

      final data = doc.data()!;
      final status = data['status'] as String?;

      verificationStatus.value = status;
      rejectionReason.value = data['rejectionReason'];
      frontIdUrl.value = data['frontIdUrl'];
      backIdUrl.value = data['backIdUrl'];

      canSubmitNewRequest.value = (status == 'rejected');
    } catch (e, s) {
      log("فشل جلب حالة التحقق: $e", error: e, stackTrace: s);
      verificationStatus.value = null;
      canSubmitNewRequest.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  /// إرسال طلب تحقق جديد
  Future<void> submitVerification() async {
    if (!canSubmitNewRequest.value) {
      showSnackBar("تنبيه", "لا يمكنك إرسال طلب جديد، طلبك قيد المراجعة");
      return;
    }

    if (frontImage.value == null || backImage.value == null) {
      showSnackBar("خطأ", "يرجى رفع الصورتين");
      return;
    }

    isUploading.value = true;
    try {
      final userId = FirebaseAuth.instance.currentUser!.uid;
      final storage = FirebaseStorage.instance;
      final firestore = FirebaseFirestore.instance;

      final verifRef = firestore.collection('verifications').doc(userId);

      // 🧹 1. محاولة حذف أي طلب تحقق قديم
      try {
        final oldDoc = await verifRef.get();
        if (oldDoc.exists) {
          await verifRef.delete();
          log("تم حذف طلب التحقق القديم للمستخدم $userId");
        }
      } catch (e) {
        log("لم يتم العثور على طلب تحقق قديم أو فشل الحذف (تجاهله): $e");
        // لا مشكلة لو فشل، نكمل العملية
      }

      // 🖼️ 2. رفع الصور
      final frontRef = storage.ref().child('id_verifications/$userId/front.jpg');
      final backRef = storage.ref().child('id_verifications/$userId/back.jpg');

      await Future.wait([
        frontRef.putFile(frontImage.value!),
        backRef.putFile(backImage.value!),
      ]);

      final frontUrl = await frontRef.getDownloadURL();
      final backUrl = await backRef.getDownloadURL();

      // 🧾 3. إنشاء طلب تحقق جديد
      await verifRef.set({
        'userId': userId,
        'status': 'pending',
        'frontIdUrl': frontUrl,
        'backIdUrl': backUrl,
        'submittedAt': FieldValue.serverTimestamp(),
      });

      // 🔄 4. تحديث الحالة المحلية
      verificationStatus.value = 'pending';
      canSubmitNewRequest.value = false;

      showSnackBar("تم", "تم إرسال طلب التحقق بنجاح");
    } catch (e, s) {
      log("خطأ في رفع الصور أو إنشاء الطلب: $e", error: e, stackTrace: s);
      showSnackBar("خطأ", "فشل الإرسال: $e");
    } finally {
      isUploading.value = false;
    }
  }


  /// إعادة تعيين النموذج عند رفض الطلب
  void resetForm() {
    frontImage.value = null;
    backImage.value = null;
    verificationStatus.value = null;
    canSubmitNewRequest.value = true;
  }
}