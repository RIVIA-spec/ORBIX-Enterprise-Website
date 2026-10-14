import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/features/hotel_section/hotel_controller/hotel_report_controller.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

void showHotelReportDialog(Map<String, dynamic> hotel) {
  final controller = Get.put(HotelReportController());
  final RxList<String> selectedReasonIds = <String>[].obs;
  
  Get.bottomSheet(
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    enableDrag: true,

    /// نستخدم StatefulBuilder للحفاظ على الـ state داخل الـ BottomSheet
    StatefulBuilder(
      builder: (context, setState) {
        return Obx(() {
          // ---------- حالة التحميل ----------
          if (controller.isLoadingReasons.value) {
            return _buildLoadingSheet();
          }

          // ---------- الـ BottomSheet الرئيسي مع حركة جميلة ----------
          return AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
            height: Get.height * 0.85,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              children: [
                // ---------- الرأس ----------
                _buildHeader(),

                // ---------- قائمة الأسباب (قابلة للتمرير) ----------
                Expanded(
                  child: controller.reportReasons.isEmpty
                      ? _buildEmptyState()
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 20, vertical: 16),
                          itemCount: controller.reportReasons.length,
                          itemBuilder: (context, index) {
                            final reason = controller.reportReasons[index];
                            final String id = reason['id'];
                            final bool isSelected =
                                selectedReasonIds.contains(id);

                            return AnimatedScale(
                              scale: isSelected ? 1.1 : 1.0,  // التأثير هنا
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeInOut,
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                width: double.infinity,
                                child: GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      if (isSelected) {
                                        selectedReasonIds.remove(id);
                                      } else {
                                        selectedReasonIds.add(id);
                                      }
                                    });
                                  },
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 16, vertical: 14),
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? Colors.redAccent
                                          : Colors.grey.shade50,
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(
                                        color: isSelected
                                            ? Colors.redAccent
                                            : Colors.grey.shade300,
                                        width: isSelected ? 0 : 1.5,
                                      ),
                                      boxShadow: isSelected
                                          ? [
                                              BoxShadow(
                                                color: Colors.red.withOpacity(0.2),
                                                blurRadius: 8,
                                                offset: const Offset(0, 2),
                                              ),
                                            ]
                                          : null,
                                    ),
                                    child: Row(
                                      children: [
                                        // دائرة التحديد
                                        AnimatedContainer(
                                          duration:
                                              const Duration(milliseconds: 200),
                                          width: 24,
                                          height: 24,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: isSelected
                                                ? Colors.white
                                                : Colors.transparent,
                                            border: Border.all(
                                              color: isSelected
                                                  ? Colors.white
                                                  : Colors.grey.shade400,
                                              width: 2,
                                            ),
                                          ),
                                          child: isSelected
                                              ? const Icon(Icons.check,
                                                  size: 16,
                                                  color: Colors.redAccent)
                                              : null,
                                        ),
                                        const SizedBox(width: 12),

                                        // النص
                                        Expanded(
                                          child: Text(
                                            reason['reason'],
                                            style: GoogleFonts.cairo(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w600,
                                              color: isSelected
                                                  ? Colors.white
                                                  : Colors.black87,
                                            ),
                                          ),
                                        ),

                                        // أيقونة تحديد إضافية
                                        if (isSelected)
                                          const Icon(Icons.check_circle,
                                              color: Colors.white, size: 20),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                ),

                // ---------- حقل التفاصيل + الأزرار ----------
                _buildFooter(
                  selectedReasonIds: selectedReasonIds,
                  hotel: hotel,
                  controller: controller,
                ),
              ],
            ),
          );
        });
      },
    ),
  );
}

/* ------------------------------------------------------------------ */
/*                         الـ Widgets المساعدة                         */
/* ------------------------------------------------------------------ */

Widget _buildLoadingSheet() {
  return AnimatedOpacity(
    duration: const Duration(milliseconds: 300),
    opacity: 1.0,
    child: Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: const Center(child: CircularProgressIndicator()),
    ),
  );
}

Widget _buildEmptyState() => Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.report_off, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            "لا توجد أسباب متاحة حاليًا",
            style: GoogleFonts.cairo(fontSize: 16, color: Colors.grey[600]),
          ),
        ],
      ),
    );

Widget _buildHeader() => Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          Center(
            child: Container(
              width: 40,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.grey[400],
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.flag, color: Colors.redAccent, size: 28),
              const SizedBox(width: 10),
              Text(
                "الإبلاغ عن الفندق",
                style: GoogleFonts.cairo(
                  fontSize: 21,
                  fontWeight: FontWeight.bold,
                  color: Colors.redAccent,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            "اختر واحدًا أو أكثر من الأسباب، أو اكتب تفاصيل إضافية:",
            style: GoogleFonts.cairo(fontSize: 14, color: Colors.grey[700]),
          ),
        ],
      ),
    );

Widget _buildFooter({
  required RxList<String> selectedReasonIds,
  required Map<String, dynamic> hotel,
  required HotelReportController controller,
}) {
  final TextEditingController customCtrl = TextEditingController();

  return Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: Colors.grey.shade50,
      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20)),
    ),
    child: Column(
      children: [
        CustomTextFormField(
          controller: customCtrl,
          hint: "تفاصيل إضافية (اختياري)...",
          maxLines: 3,
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: TextButton(
                onPressed: () => safeBack(),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: Colors.grey.shade400),
                  ),
                ),
                child: Text(
                  "إلغاء",
                  style: GoogleFonts.cairo(
                    color: Colors.grey[700],
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: () {
                  final customText = customCtrl.text.trim();
                  final hasReasons = selectedReasonIds.isNotEmpty;
                  final hasCustom = customText.isNotEmpty;

                  if (!hasReasons && !hasCustom) {
                    showSnackBar(
                      "خطأ",
                      "يرجى اختيار سبب واحد على الأقل أو كتابة تفاصيل",
                      backgroundColor: Colors.red.shade100,
                      colorText: Colors.red.shade800,
                    );
                    return;
                  }

                  controller.submitReport(
                    hotelId: hotel['id'],
                    reasonIds: selectedReasonIds.toList(),
                    reasonText: customText.isEmpty ? null : customText,
                  );
                  safeBack();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.redAccent,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 3,
                ),
                child: Text(
                  "إرسال الإبلاغ",
                  style: GoogleFonts.cairo(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

