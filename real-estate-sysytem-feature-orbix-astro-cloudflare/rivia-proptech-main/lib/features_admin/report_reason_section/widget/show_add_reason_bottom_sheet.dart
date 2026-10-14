

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';

void showAddReasonBottomSheet({
  required controller,
}) {

  final reasonCtrl = TextEditingController();

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
            "إضافة سبب جديد",
            style: GoogleFonts.cairo(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 16),

          // حقل الإدخال
          CustomTextFormField(
            controller: reasonCtrl,
            hint: "السبب",
            validator: (value) {
              if(value == null || value.isEmpty){
                return "هذا الحقل مطلوب";
              }
              return null;
            },
            maxLines: 3,
            // minLines: 1,
          ),
          // TextField(
          //   controller: reasonCtrl,
          //   textInputAction: TextInputAction.done,
          //   decoration: InputDecoration(
          //     labelText: "السبب",
          //     labelStyle: GoogleFonts.cairo(color: Colors.grey[700]),
          //     border: OutlineInputBorder(
          //       borderRadius: BorderRadius.circular(12),
          //       borderSide: BorderSide(color: Colors.grey.shade300),
          //     ),
          //     focusedBorder: OutlineInputBorder(
          //       borderRadius: BorderRadius.circular(12),
          //       borderSide: const BorderSide(color: Colors.redAccent, width: 2),
          //     ),
          //     filled: true,
          //     fillColor: Colors.grey[50],
          //     contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          //   ),
          //   style: GoogleFonts.cairo(fontSize: 16),
          //   maxLines: 3,
          // ),
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

              // زر الإضافة
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    final text = reasonCtrl.text.trim();
                    if (text.isNotEmpty) {
                      controller.addReason(text);
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
                    backgroundColor: Colors.redAccent,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 2,
                  ),
                  child: Text(
                    "إضافة",
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
          const SizedBox(height: 16), // لتجنب التصاق الأزرار بأسفل الشاشة
        ],
      ),
    ),
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    enterBottomSheetDuration: const Duration(milliseconds: 300),
    exitBottomSheetDuration: const Duration(milliseconds: 250),
  );
} 