import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/features_admin/report_reason_section/services/report_reasons_service.dart';

class HotelReportController extends GetxController {
  final ReportReasonsService _reportService = ReportReasonsService();
  final RxList<Map<String, dynamic>> reportReasons = <Map<String, dynamic>>[].obs;
  final RxBool isLoadingReasons = true.obs;

  @override
  void onInit() {
    super.onInit();
    loadReportReasons();
  }

  Future<void> submitReport({
    required String hotelId,
    required List<String> reasonIds,
    String? reasonText,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      showSnackBar("خطأ", "يجب تسجيل الدخول");
      return;
    }

    try {
      await FirebaseFirestore.instance.collection('hotel_reports').add({
        'hotel_id': hotelId,
        'reporter_id': user.uid,
        'reason_ids': reasonIds,
        'reason_text': reasonText,
        'status': 'pending',
        'reported_at': FieldValue.serverTimestamp(),
      });

      showSnackBar(
        "تم الإبلاغ",
        "شكرًا لك، تم استلام بلاغك بنجاح",
        backgroundColor: Colors.green.shade100,
        colorText: Colors.green.shade800,
        icon: const Icon(Icons.check_circle),
        duration: const Duration(seconds: 3),
      );
    } catch (e) {
      showSnackBar("خطأ", "فشل إرسال البلاغ: $e");
    }
  }

  Future<void> loadReportReasons() async {
    try {
      isLoadingReasons(true);
      final reasons = await _reportService.getAllReasonsOnce();
      reportReasons.assignAll(reasons);
    } catch (e) {
      showSnackBar("خطأ", "فشل تحميل أسباب الإبلاغ");
    } finally {
      isLoadingReasons(false);
    }
  }
}

