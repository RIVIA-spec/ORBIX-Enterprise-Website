// lib/features/bookings/controller/bookings_controller.dart
import 'dart:async';
import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class BookingsController extends GetxController {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  final RxList<Map<String, dynamic>> bookings = <Map<String, dynamic>>[].obs;
  final RxBool isLoading = true.obs;
  StreamSubscription? _bookingsSubscription;

  @override
  void onInit() {
    loadBookings();
    super.onInit();
  }

  Future<void> loadBookings() async {
    final user = _auth.currentUser;
    if (user == null) {
      showSnackBar("خطأ", "يجب تسجيل الدخول");
      isLoading(false);
      return;
    }

    try {
      isLoading(true);

      final snapshot = await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('user_bookings')
          .orderBy('created_at', descending: true)
          .get();

      bookings.assignAll(
        snapshot.docs.map((doc) => {
          ...doc.data(),
          'id': doc.id,
        }).toList(),
      );
    } catch (e) {
      showSnackBar("خطأ", "فشل تحميل الحجوزات");
    } finally {
      isLoading(false);
    }
  }

  // تحديث تلقائي
  void startListening() {
    _bookingsSubscription?.cancel(); // إلغاء الاشتراك السابق إن وجد
    
    final user = _auth.currentUser;
    if (user == null) return;

    final userId = user.uid;
    _bookingsSubscription = _firestore
        .collection('users')
        .doc(userId)
        .collection('user_bookings')
        .orderBy('created_at', descending: true)
        .snapshots()
        .listen(
      (snapshot) {
        // التحقق من أن المستخدم ما زال مسجل دخول
        if (_auth.currentUser?.uid != userId) {
          _bookingsSubscription?.cancel();
          return;
        }
        bookings.assignAll(
          snapshot.docs.map((doc) => {
            ...doc.data(),
            'id': doc.id,
          }).toList(),
        );
      },
      onError: (error) {
        // تجاهل أخطاء PERMISSION_DENIED عند تسجيل الخروج
        if (error.toString().contains('PERMISSION_DENIED')) {
          _bookingsSubscription?.cancel();
          bookings.clear();
          return;
        }
        log('خطأ في الاستماع للحجوزات: $error');
      },
    );
  }

  @override
  void onReady() {
    startListening();
    super.onReady();
  }

  @override
  void onClose() {
    _bookingsSubscription?.cancel();
    _bookingsSubscription = null;
    Get.delete<BookingsController>(); // يُحذف ويُعاد إنشاؤه
    super.onClose();
  }
}