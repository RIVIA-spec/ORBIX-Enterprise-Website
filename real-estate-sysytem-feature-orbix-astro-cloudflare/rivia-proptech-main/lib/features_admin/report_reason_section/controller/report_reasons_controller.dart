// lib/features/report_reasons/controller/report_reasons_controller.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/features_admin/report_reason_section/services/report_reasons_service.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';


class ReportReasonsController extends GetxController {
  final ReportReasonsService _service = ReportReasonsService();
  final RxList<Map<String, dynamic>> reasons = <Map<String, dynamic>>[].obs;
  final RxBool isLoading = true.obs;

  @override
  void onInit() {
    super.onInit();
    loadReasons();
  }

  Future<void> loadReasons() async {
    try {
      isLoading(true);
      final data = await _service.getAllReasonsOnce();
      reasons.assignAll(data);
    } catch (e) {
      showSnackBar("خطأ", "فشل تحميل الأسباب: $e");
    } finally {
      isLoading(false);
    }
  }

  Future<void> addReason(String reason) async {
    if (reason.trim().isEmpty) {
      showSnackBar("خطأ", "يرجى كتابة سبب");
      return;
    }
    try {
      await _service.addReason(reason);
      await loadReasons();
      showSnackBar("تم", "تمت الإضافة بنجاح", backgroundColor: Colors.green.shade100);
    } catch (e) {
      showSnackBar("خطأ", e.toString());
    }
  }

  Future<void> updateReason(String id, String newReason) async {
    if (newReason.trim().isEmpty) return;
    await _service.updateReason(id, newReason);
    await loadReasons();
  }

  Future<void> deleteReason(String id) async {
    await _service.deleteReason(id);
    await loadReasons();
  }

  Future<void> resetDefaultReasons() async {
    Get.dialog(
      AlertDialog(
        title: const Text("تأكيد إعادة التعيين"),
        content: const Text("هل تريد حذف جميع الأسباب وإعادة الافتراضية؟"),
        actions: [
          TextButton(onPressed: () => safeBack(), child: const Text("إلغاء")),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              safeBack();
              try {
                final snapshot = await _service.firestore.collection(_service.collectionPath).get();
                final batch = _service.firestore.batch();
                for (var doc in snapshot.docs) {
                  batch.delete(doc.reference);
                }
                await batch.commit();

                await _service.seedReportReasons();
                await loadReasons();
                showSnackBar("تم", "تم إعادة تعيين الأسباب بنجاح");
              } catch (e) {
                showSnackBar("خطأ", "فشل إعادة التعيين: $e");
              }
            },
            child: const Text("تأكيد"),
          ),
        ],
      ),
    );
  }
}