// lib/features/report_reasons/widgets/edit_reason_sheet.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import '../controller/report_reasons_controller.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';

class EditReasonSheet {
  static void show({
    required String reasonId,
    required String currentReason,
    required ReportReasonsController controller,
  }) {
    final TextEditingController reasonCtrl = TextEditingController(text: currentReason);

    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // شريط السحب
            Center(
              child: Container(
                width: 40,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // العنوان
            Text(
              "تعديل السبب",
              style: GoogleFonts.cairo(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 16),

            // حقل الإدخال
            TextField(
              controller: reasonCtrl,
              textInputAction: TextInputAction.done,
              decoration: InputDecoration(
                labelText: "السبب",
                labelStyle: GoogleFonts.cairo(color: Colors.grey[700]),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.blueAccent, width: 2),
                ),
                filled: true,
                fillColor: Colors.grey[50],
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
              style: GoogleFonts.cairo(fontSize: 16),
              maxLines: 3,
            ),
            const SizedBox(height: 24),

            // الأزرار
            Row(
              children: [
                // زر الإلغاء
                Expanded(
                  child: TextButton(
                    onPressed: () => safeBack(),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: Colors.grey.shade300),
                      ),
                    ),
                    child: Text(
                      "إلغاء",
                      style: GoogleFonts.cairo(
                        fontSize: 16,
                        color: Colors.grey[700],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // زر الحفظ
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      final text = reasonCtrl.text.trim();
                      if (text.isNotEmpty) {
                        controller.updateReason(reasonId, text);
                        safeBack();
                      } else {
                        showSnackBar(
                          "خطأ",
                          "يرجى كتابة سبب",
                          backgroundColor: Colors.red.shade100,
                          colorText: Colors.red.shade800,
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blueAccent,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 2,
                    ),
                    child: Text(
                      "حفظ",
                      style: GoogleFonts.cairo(
                        fontSize: 16,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      enterBottomSheetDuration: const Duration(milliseconds: 300),
      exitBottomSheetDuration: const Duration(milliseconds: 250),
    );
  }
}