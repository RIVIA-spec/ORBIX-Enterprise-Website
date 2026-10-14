import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';

class ControlPanelController extends GetxController {
  // === الأرقام الإحصائية ===
  var totalUsers = 0.obs;
  var verifiedUsers = 0.obs;
  var pendingVerifications = 0.obs;
  var totalProperties = 0.obs;
  var pendingProperties = 0.obs;
  var totalRequests = 0.obs;
  var pendingRequests = 0.obs;
  var reportsCount = 0.obs;

  // === البيانات التفصيلية ===
  // var verificationRequests = <Map<String, dynamic>>[].obs;
  var verificationRequestsCount = 0.obs;
  var propertyRequests = <Map<String, dynamic>>[].obs;
  var pendingBookingsCount = 0.obs;

  var isLoading = true.obs;

  @override
  void onInit() {
    super.onInit();
    loadDashboardData();
  }

  Future<void> loadDashboardData() async {
  isLoading.value = true;
  final UserController userCtr = Get.find<UserController>();
  // === 1. جلب الإحصائيات (كل واحدة مستقلة) ===
  if(userCtr.isOwner.value) {
    await _loadUsersStats();
  }
  await _loadVerificationStats();
  await fetchReports();
  await _loadPropertiesStats();
  await _loadRequestsStats();

  // === 2. جلب البيانات التفصيلية (مستقلة) ===
  await _loadPendingVerifications();
  await _loadPendingProperties();
  await loadPendingBookingsCount();

  isLoading.value = false;
}

  // =======================
  // دوال منفصلة لكل عملية
  // =======================

  Future<void> _loadUsersStats() async {
    try {
      final snap = await FirebaseFirestore.instance.collection('users').get();
      totalUsers.value = snap.size;
      verifiedUsers.value = snap.docs.where((d) => d['isVerified'] == true).length;
    } catch (e, s) {
      log("خطأ في جلب المستخدمين: $e", error: e, stackTrace: s);
      totalUsers.value = 0;
      verifiedUsers.value = 0;
    }
  }

  Future<void> fetchReports() async {
    try {
      // جلب إبلاغات العقارات المعلقة
      var propertyReportsSnapshot = await FirebaseFirestore.instance
          .collection('property_reports')
          .where('status', isEqualTo: 'pending')
          .get();
      
      // جلب إبلاغات الفنادق المعلقة
      var hotelReportsSnapshot = await FirebaseFirestore.instance
          .collection('hotel_reports')
          .where('status', isEqualTo: 'pending')
          .get();
      
      // حساب العدد الإجمالي
      reportsCount.value = propertyReportsSnapshot.docs.length + hotelReportsSnapshot.docs.length;
    } catch (e) {
      print("Error fetching reports: $e");
    }
  }


  Future<void> _loadVerificationStats() async {
    try {
      final snap = await FirebaseFirestore.instance.collection('verifications').get();
      pendingVerifications.value = snap.docs.where((d) => d['status'] == 'pending').length;
    } catch (e, s) {
      log("خطأ في جلب التحققات: $e", error: e, stackTrace: s);
      pendingVerifications.value = 0;
    }
  }

  Future<void> _loadPropertiesStats() async {
    try {
      final snap = await FirebaseFirestore.instance.collection('properties').count().get();
      totalProperties.value = snap.count ?? 0;
      // pendingProperties.value = snap.docs.where((d) => d['status'] == 'pending_approval').length;
    } catch (e, s) {
      log("خطأ في جلب العقارات: $e", error: e, stackTrace: s);
      totalProperties.value = 0;
      // pendingProperties.value = 0;
    }
  }

  Future<void> _loadRequestsStats() async {
    try {
      final snap = await FirebaseFirestore.instance.collection('requests').get();
      totalRequests.value = snap.size;
      pendingRequests.value = snap.docs.where((d) => d['status'] == 'pending').length;
    } catch (e, s) {
      log("خطأ في جلب الطلبات: $e", error: e, stackTrace: s);
      totalRequests.value = 0;
      pendingRequests.value = 0;
    }
  }

  // =======================
  // جلب البيانات التفصيلية
  // =======================

  Future<void> _loadPendingVerifications() async {
    try {
      final countPendingVerify = await FirebaseFirestore.instance
          .collection('verifications')
          .where('status', isEqualTo: 'pending')
          .count()
          .get();

      verificationRequestsCount.value = countPendingVerify.count ?? 0;
    } catch (e, s) {
      log("خطأ كلي في جلب طلبات التحقق: $e", error: e, stackTrace: s);
      verificationRequestsCount.value = 0;
    }
  }

  Future<void> _loadPendingProperties() async {
    try {
      final countSnap = await FirebaseFirestore.instance
          .collection('property_requests')
          .where('status', isEqualTo: 'pending')
          .count()           // جلب العدد فقط
          .get();

      pendingProperties.value = countSnap.count ?? 0;
    } catch (e, s) {
      log("خطأ في جلب عدد طلبات نشر العقارات: $e", error: e, stackTrace: s);
      pendingProperties.value = 0;
    }
  }

  Future<void> loadPendingBookingsCount() async {
    try {
      // جلب جميع المستخدمين
      final usersSnapshot = await FirebaseFirestore.instance.collection('users').get();

      int totalPending = 0;

      // لكل مستخدم، نجلب عدد الطلبات المعلقة في subcollection
      for (final userDoc in usersSnapshot.docs) {
        final bookingsSnapshot = await FirebaseFirestore.instance
            .collection('users')
            .doc(userDoc.id)
            .collection('user_bookings')
            .where('status', isEqualTo: 'pending')
            .get();

        totalPending += bookingsSnapshot.size;
      }

      pendingBookingsCount.value = totalPending;

      print("عدد الطلبات المعلقة (subcollection): $totalPending");
    } catch (e, s) {
      print("خطأ في جلب عدد الطلبات: $e");
      pendingBookingsCount.value = 0;
    }
  }

  // === تحديث سريع (Refresh) ===
  Future<void> refreshData() async {
    await loadDashboardData();
  }
}