// lib/features_admin/report_section/widget/report_card_widget.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/features/property_details_section/view/property_details_screen.dart';
import 'package:real_estate_app/features/hotel_section/view/hotel_details_screen.dart';
import 'package:real_estate_app/features_admin/report_section/controller/report_controller.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';

class ReportCardWidget extends StatelessWidget {
  final Map<String, dynamic> report;
  const ReportCardWidget({required this.report, super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<ReportController>();
    final isLoading = false.obs;

    // تحويل reason_ids إلى نصوص
    List<String> reasons = (report['reason_ids'] as List<dynamic>? ?? [])
        .map<String>((id) {
      final found = controller.reportReasons.firstWhere(
        (r) => r['id'] == id.toString(),
        orElse: () => {'reason': 'غير محدد'},
      );
      return found['reason'] as String;
    }).toList();

    // تنسيق التاريخ
    final date = report['reported_at'] != null
        ? (report['reported_at'] as Timestamp).toDate()
        : null;
    final formattedDate = date != null
        ? DateFormat('dd MMMM yyyy').format(date)
        : 'غير معروف';

    // حالة التقرير
    final status = report['status']?.toString() ?? 'pending';
    final isClosed = status == 'closed';
    final String propertyTitle = report['property_title'] ?? 'غير معروف';
    final String propertyImage = report['property_main_image'] ?? '';
    final String itemType = report['item_type'] ?? 'property';
    final bool isHotel = itemType == 'hotel';

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 6,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _openProperty(context, report, controller, isLoading),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // الرأس: صورة + حالة + تاريخ
              Row(
                children: [
                  // صورة العقار (صغيرة)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      width: 60,
                      height: 60,
                      color: Colors.grey[200],
                      child: (propertyImage != null || propertyImage.isNotEmpty)
                          ? Image.network(
                              propertyImage,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) =>
                                  const Icon(Icons.image, color: Colors.grey),
                            )
                          : const Icon(Icons.image, color: Colors.grey),
                    ),
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Badge للنوع
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: isHotel ? Colors.purple.shade100 : Colors.blue.shade100,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            isHotel ? 'فندق' : 'عقار',
                            style: GoogleFonts.cairo(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isHotel ? Colors.purple.shade700 : Colors.blue.shade700,
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          propertyTitle,
                          style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 14),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),

                  // الحالة والتاريخ
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              isClosed ? Icons.check_circle : Icons.flag,
                              size: 18,
                              color: isClosed ? Colors.green : Colors.orangeAccent,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              isClosed ? 'مغلق' : 'قيد المراجعة',
                              style: GoogleFonts.cairo(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: isClosed ? Colors.green : Colors.orangeAccent,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          formattedDate,
                          style: GoogleFonts.cairo(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // الأسباب
              if (reasons.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.orange.shade200),
                  ),
                  child: Text(
                    'أسباب الإبلاغ: ${reasons.join('، ')}',
                    style: GoogleFonts.cairo(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.orange.shade800,
                    ),
                  ),
                ),

              const SizedBox(height: 10),

              // الوصف
              if (report['reason_text'] != null && report['reason_text'].toString().isNotEmpty)
                Text(
                  'الوصف: ${report['reason_text']}',
                  style: GoogleFonts.cairo(fontSize: 14, color: Colors.black87),
                ),

              const SizedBox(height: 16),

              // الأزرار
              Row(
                children: [
                  // إغلاق التقرير
                  if (!isClosed)
                    Expanded(
                      child: CustomButton(
                        text: 'إغلاق التقرير',
                        backgroundColor: Colors.green.shade600,
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.zero,
                        height: 70,
                        onPressed: () => _showCloseDialog(context, report['id'], report['collection'] ?? 'property_reports', controller),
                      ),
                    ),

                  if (!isClosed) const SizedBox(width: 12),

                  // عرض العقار/الفندق
                  Expanded(
                    child: Obx(() => CustomButton(
                          text: isLoading.value ? '' : (report['item_type'] == 'hotel' ? 'عرض الفندق' : 'عرض العقار'),
                          backgroundColor: Colors.blue.shade600,
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.zero,
                          height: 70,
                          isLoading: isLoading,
                          onPressed: () => _openProperty(context, report, controller, isLoading),
                        )),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // فتح صفحة العقار أو الفندق
  void _openProperty(
    BuildContext context,
    Map<String, dynamic> report,
    ReportController controller,
    RxBool isLoading,
  ) async {
    final itemType = report['item_type'] ?? 'property';
    final itemId = report['property_id'] ?? report['hotel_id'] as String?;
    
    if (itemId == null || itemId.isEmpty) {
      showSnackBar('خطأ', 'المعرف غير موجود');
      return;
    }

    isLoading.value = true;
    final item = await controller.fetchProperty(itemId, itemType);
    isLoading.value = false;

    if (item == null) {
      showSnackBar('تنبيه', '${itemType == 'hotel' ? 'الفندق' : 'العقار'} غير موجود أو تم حذفه', backgroundColor: Colors.orange);
      return;
    }

    if (itemType == 'hotel') {
      Get.to(() => HotelDetailsScreen(hotel: item));
    } else {
      Get.to(() => PropertyDetailsScreen(property: item));
    }
  }

  // تأكيد إغلاق التقرير
  void _showCloseDialog(BuildContext context, String reportId, String collection, ReportController controller) {
    Get.dialog(
      AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.green),
            const SizedBox(width: 8),
            Text('تأكيد الإغلاق', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text('هل أنت متأكد من إغلاق هذا التقرير؟', style: GoogleFonts.cairo()),
        actions: [
          TextButton(
            onPressed: () => safeBack(),
            child: Text('إلغاء', style: GoogleFonts.cairo(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            onPressed: () async {
              safeBack();
              await controller.closeReport(reportId, collection);
            },
            child: Text('إغلاق', style: GoogleFonts.cairo(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}