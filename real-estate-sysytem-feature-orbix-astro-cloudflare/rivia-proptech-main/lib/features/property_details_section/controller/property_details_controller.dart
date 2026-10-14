import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/business/business_rules.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/mappers/property_mapper.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/features_admin/report_reason_section/services/report_reasons_service.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class PropertyDetailsController extends GetxController {
  var currentImageIndex = 0.obs;
  var images = <String>[].obs;
  var isLoadingBottomSheet = false.obs;
  final ReportReasonsService _reportService = ReportReasonsService();
  final RxList<Map<String, dynamic>> reportReasons =
      <Map<String, dynamic>>[].obs;
  final RxBool isLoadingReasons = true.obs;
  final TextEditingController commentController = TextEditingController();

  @override
  void onInit() {
    super.onInit();
    loadReportReasons();
  }

  Future<void> openWhatsApp(
    String phone, {
    String? message,
    String countryCode = "963",
  }) async {
    final cleanPhone = phone.replaceAll(RegExp(r'\D'), '');
    final encodedMessage = Uri.encodeComponent(
      message?.trim().isNotEmpty == true
          ? message!
          : "مرحباً، أود الاستفسار عن العقار المعروض.",
    );

    final url = "https://wa.me/$countryCode$cleanPhone?text=$encodedMessage";
    final uri = Uri.parse(url);

    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        try {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } catch (e) {
          _showWhatsAppError();
        }
      }
    } catch (e) {
      _showWhatsAppError();
    }
  }

  Future<void> submitReport({
    required String propertyId,
    required List<String> reasonIds,
    String? reasonText,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      showSnackBar("خطأ", "يجب تسجيل الدخول");
      return;
    }

    try {
      await FirebaseFirestore.instance.collection('property_reports').add({
        'property_id': propertyId,
        'reporter_id': user.uid,
        'reason_ids': reasonIds,
        'reason_text': reasonText,
        'status': 'pending',
        'reported_at': FieldValue.serverTimestamp(),
      });

      showSnackBar(
        "تم الإبلاغ",
        "شكراً لك، تم استلام بلاغك بنجاح",
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

  void _showWhatsAppError() {
    showSnackBar(
      "فشل فتح واتساب",
      "تأكد من تثبيت تطبيق واتساب أو حاول مرة أخرى.",
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.red.withOpacity(0.1),
      colorText: Colors.red[700],
      icon: const Icon(Icons.error, color: Colors.red),
      duration: const Duration(seconds: 4),
    );
  }

  String getBookingStatus(Map<String, dynamic> property) {
    property = normalizePropertyMap(property);
    final isRent = isRentProperty(property);
    final isSale = isSaleProperty(property);

    if (isSale && property['isSold'] == true) {
      return "تم البيع";
    }

    if (isRent) {
      final periods = (property['booked_periods'] as List?) ?? [];
      final now = DateTime.now();
      DateTime? currentEnd;

      for (final p in periods) {
        if (p is! Map) continue;

        final from = _readTimestampDate(p['from']);
        final to = _readTimestampDate(p['to']);

        if (from == null || to == null) {
          continue;
        }

        final effectiveEnd = DateTime(to.year, to.month, to.day, 23, 59, 59);

        if ((now.isAfter(from) || now.isAtSameMomentAs(from)) &&
            (now.isBefore(effectiveEnd) ||
                now.isAtSameMomentAs(effectiveEnd))) {
          if (currentEnd == null || to.isAfter(currentEnd)) {
            currentEnd = to;
          }
        }
      }

      if (currentEnd != null) {
        return "محجوز حتى ${formatDate(currentEnd)}";
      }
    }

    return "متاح";
  }

  DateTime? _readTimestampDate(dynamic value) {
    if (value is Timestamp) return value.toDate();
    if (value is DateTime) return value;
    return null;
  }

  String formatDate(DateTime date) {
    return "${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}";
  }

  showConfirm({
    required Map property,
    required Function() sendToWhatsApp,
  }) {
    property = normalizePropertyMap(Map<String, dynamic>.from(property));
    return Get.bottomSheet(
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 50,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                shape: BoxShape.circle,
              ),
              child:
                  const Icon(Icons.check_circle, size: 50, color: Colors.green),
            ),
            const SizedBox(height: 20),
            Text(
              "تأكيد طلب الحجز",
              style:
                  GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              "سيتم إرسال طلب الحجز الخاص بك.\n"
              "سوف يتواصل معك الوسيط عبر واتساب لتأكيد الحجز وإتمام الدفع.",
              style: GoogleFonts.cairo(
                  fontSize: 15, color: Colors.grey[700], height: 1.6),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Column(
                children: [
                  _summaryRow("العقار", property['title'] ?? 'غير محدد'),
                  _summaryRow(
                    "السعر",
                    "${property['selling_price'] ?? "غير محدد"} ${property['selling_price_currency'] ?? "غير محدد"}",
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => safeBack(),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(color: Colors.grey),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text("إلغاء",
                        style: GoogleFonts.cairo(color: Colors.grey[700])),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Obx(
                    () => ElevatedButton.icon(
                      onPressed: () async {
                        final success = await submitBooking(
                          property: property,
                          onWhatsApp: sendToWhatsApp,
                        );

                        if (success) {
                          safeBack();
                          showSnackBar(
                            "تم الإرسال",
                            "تم حفظ الطلب وسيتم التواصل معك",
                            backgroundColor: Colors.green,
                            colorText: Colors.white,
                          );
                        }
                      },
                      icon: const Icon(Icons.send, color: Colors.white),
                      label: isLoadingBottomSheet.value
                          ? LoadingProgressiveDots()
                          : Text("إرسال الطلب",
                              style: GoogleFonts.cairo(color: Colors.white)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: Get.height * 0.2),
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: GoogleFonts.cairo(fontSize: 13, color: Colors.grey[600])),
          Text(value,
              style:
                  GoogleFonts.cairo(fontSize: 14, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Future<bool> submitBooking({
    required Map property,
    required Function() onWhatsApp,
  }) async {
    property = normalizePropertyMap(Map<String, dynamic>.from(property));
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      showSnackBar("خطأ", "يجب تسجيل الدخول أولاً");
      return false;
    }

    try {
      isLoadingBottomSheet.value = true;

      final bookingRef = FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .collection('user_bookings')
          .doc();

      await bookingRef.set({
        'property_id': property['id'] ?? '',
        'property_title': property['title'] ?? 'غير محدد',
        'property_type': property['property_type'] ?? 'غير محدد',
        'selling_price':
            normalizedPropertyPrice(Map<String, dynamic>.from(property)) ??
                "غير محدد",
        'selling_price_currency':
            normalizedPropertyCurrency(Map<String, dynamic>.from(property)) ??
                "غير محدد",
        'status': 'pending',
        'created_at': FieldValue.serverTimestamp(),
      });

      onWhatsApp();
      return true;
    } catch (e) {
      showSnackBar(
        "فشل",
        "تعذر إرسال الطلب: $e",
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return false;
    } finally {
      isLoadingBottomSheet.value = false;
    }
  }

  Future<void> submitComment({
    required String propertyId,
    required Map<String, dynamic> currentUser,
  }) async {
    final comment = commentController.text.trim();
    if (comment.isEmpty) {
      showSnackBar("خطأ", "لا يمكن إرسال تعليق فارغ");
      return;
    }
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        showSnackBar("خطأ", "يجب تسجيل الدخول");
        return;
      }

      final hasBooked =
          await _checkIfUserHasConfirmedBooking(user.uid, propertyId);

      final commentRef = FirebaseFirestore.instance
          .collection('properties')
          .doc(propertyId)
          .collection('comments')
          .doc();

      await commentRef.set({
        'id': commentRef.id,
        'userId': user.uid,
        'userName': currentUser['name'] ?? 'مستخدم مجهول',
        'comment': comment,
        'hasBooked': hasBooked,
        'createdAt': FieldValue.serverTimestamp(),
      });

      commentController.clear();
      safeBack();
      showSnackBar("تم", "تم إضافة تعليقك بنجاح",
          backgroundColor: Colors.green, colorText: Colors.white);
    } catch (e) {
      showSnackBar("فشل", "تعذر إضافة التعليق: $e",
          backgroundColor: Colors.red, colorText: Colors.white);
    }
  }

  Future<bool> _checkIfUserHasConfirmedBooking(
      String userId, String propertyId) async {
    try {
      final snapshot = await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .collection('user_bookings')
          .where('property_id', isEqualTo: propertyId)
          .where('status', isEqualTo: 'confirmed')
          .limit(1)
          .get();

      return snapshot.docs.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  Stream<QuerySnapshot> getCommentsStream(String propertyId) {
    return FirebaseFirestore.instance
        .collection('properties')
        .doc(propertyId)
        .collection('comments')
        .orderBy('createdAt', descending: true)
        .snapshots();
  }
}
