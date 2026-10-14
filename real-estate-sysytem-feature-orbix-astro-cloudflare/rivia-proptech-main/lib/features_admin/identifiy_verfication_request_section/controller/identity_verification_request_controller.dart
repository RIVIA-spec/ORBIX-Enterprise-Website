// identity_verification_controller.dart
import 'dart:async';
import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class IdentityVerificationRequestController extends GetxController {
  var requests = <Map<String, dynamic>>[].obs;
  var isLoading = true.obs;
  StreamSubscription? _verificationSubscription;

  @override
  void onInit() {
    super.onInit();
    listenToPendingVerifications();
  }

  void listenToPendingVerifications() {
    _verificationSubscription?.cancel(); // إلغاء الاشتراك السابق إن وجد
    
    _verificationSubscription = FirebaseFirestore.instance
        .collection('verifications')
        .where('status', isEqualTo: 'pending')
        .snapshots()
        .listen(
      (snapshot) async {
        isLoading.value = true;
        final List<Map<String, dynamic>> result = [];

        for (var doc in snapshot.docs) {
          final data = doc.data();
          try {
            final userSnap = await FirebaseFirestore.instance
                .collection('users')
                .doc(data['userId'])
                .get();

            result.add({
              'id': doc.id,
              'userId': data['userId'],
              'name': userSnap.exists ? (userSnap['username'] ?? 'غير معروف') : 'غير معروف',
              'email': userSnap.exists ? (userSnap['email'] ?? '') : '',
              'frontIdUrl': data['frontIdUrl'],
              'backIdUrl': data['backIdUrl'],
              'submittedAt': data['submittedAt']?.toDate(),
            });
          } catch (e) {
            result.add({
              'id': doc.id,
              'userId': data['userId'],
              'name': 'غير معروف',
              'email': '',
              'frontIdUrl': data['frontIdUrl'],
              'backIdUrl': data['backIdUrl'],
              'submittedAt': data['submittedAt']?.toDate(),
            });
          }
        }

        requests.assignAll(result);
        isLoading.value = false;
      },
      onError: (e, s) {
        // تجاهل أخطاء PERMISSION_DENIED عند تسجيل الخروج
        if (e.toString().contains('PERMISSION_DENIED')) {
          _verificationSubscription?.cancel();
          requests.clear();
          isLoading.value = false;
          return;
        }
        log("خطأ في تحديث طلبات التحقق", error: e, stackTrace: s);
        requests.clear();
        isLoading.value = false;
      },
    );
  }

  // قبول التحقق
  Future<void> approve(String verifId, String userId) async {
    try {
      await FirebaseFirestore.instance.runTransaction((tx) async {
        tx.update(FirebaseFirestore.instance.collection('verifications').doc(verifId), {
          'status': 'verified',
          'reviewedAt': FieldValue.serverTimestamp(),
          'reviewedBy': FirebaseAuth.instance.currentUser!.uid,
        });
        tx.update(FirebaseFirestore.instance.collection('users').doc(userId), {
          'isVerified': true,
        });
      });
      showSnackBar("تم", "تم التحقق من الهوية");
    } catch (e) {
      showSnackBar("خطأ", "فشل في الموافقة");
    }
  }

  // رفض التحقق مع سبب
  Future<void> reject(String verifId, String reason) async {
    if (reason.isEmpty) {
      showSnackBar("خطأ", "يجب إدخال سبب الرفض");
      return;
    }
    try {
      await FirebaseFirestore.instance.collection('verifications').doc(verifId).update({
        'status': 'rejected',
        'rejectionReason': reason,
        'reviewedAt': FieldValue.serverTimestamp(),
        'reviewedBy': FirebaseAuth.instance.currentUser!.uid,
      });
      showSnackBar("تم", "تم رفض الطلب");
    } catch (e) {
      showSnackBar("خطأ", "فشل في الرفض");
    }
  }

  @override
  void onClose() {
    _verificationSubscription?.cancel();
    _verificationSubscription = null;
    super.onClose();
  }
}