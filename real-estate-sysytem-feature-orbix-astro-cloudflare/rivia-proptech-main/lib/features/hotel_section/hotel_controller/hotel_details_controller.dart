import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:url_launcher/url_launcher.dart';

class HotelDetailsController extends GetxController {
  var currentImageIndex = 0.obs;
  var images = <String>[].obs;
  var isLoadingBottomSheet = false.obs;
  var roomTypes = <Map<String, dynamic>>[].obs;
  var isLoadingRoomTypes = false.obs;

  Future<void> loadRoomTypes(String hotelId) async {
    try {
      isLoadingRoomTypes.value = true;
      final snapshot = await FirebaseFirestore.instance
          .collection('hotels')
          .doc(hotelId)
          .collection('room_types')
          .where('isVisible', isEqualTo: true)
          .where('status', isEqualTo: 'approved')
          .get();

      final List<Map<String, dynamic>> loadedRoomTypes = [];

      for (var doc in snapshot.docs) {
        final data = doc.data();
        data['id'] = doc.id;

        final totalCount = data['total_count'] ?? 0;
        final availableCount = data['available_count'] ?? totalCount;
        data['available_count'] = availableCount.clamp(0, totalCount);

        loadedRoomTypes.add(data);
      }

      roomTypes.value = loadedRoomTypes;
    } catch (e) {
      showSnackBar("خطأ", "فشل تحميل أنواع الغرف: $e",
          backgroundColor: Colors.red, colorText: Colors.white);
      roomTypes.clear();
    } finally {
      isLoadingRoomTypes.value = false;
    }
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
          : "مرحباً، أود الاستفسار عن الفندق المعروض.",
    );

    final url = "https://wa.me/$countryCode$cleanPhone?text=$encodedMessage";
    final uri = Uri.parse(url);

    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        // إذا لم يتمكن من التحقق، حاول فتحه مباشرة
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

  void _showWhatsAppError() {
    showSnackBar(
      "فشل فتح واتساب",
      "تأكد من تثبيت تطبيق واتساب أو حاول مرة أخرى.",
      backgroundColor: Colors.red,
      colorText: Colors.white,
    );
  }

  Future<bool> submitRoomBooking({
    required String hotelId,
    required Map<String, dynamic> roomType,
    required Function() onWhatsApp,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      showSnackBar("خطأ", "يجب تسجيل الدخول أولاً",
          backgroundColor: Colors.red, colorText: Colors.white);
      return false;
    }

    // التحقق من توفر الغرف
    final availableCount = roomType['available_count'] ?? 0;
    if (availableCount <= 0) {
      showSnackBar("عذراً", "لا توجد غرف متاحة من هذا النوع",
          backgroundColor: Colors.orange, colorText: Colors.white);
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
        'hotel_id': hotelId,
        'room_type_id': roomType['id'],
        'room_type_title': roomType['title'] ?? 'غير محدد',
        'property_type': 'إيجار',
        'daily_price': roomType['daily_price'] ?? "غير محدد",
        'daily_price_currency': roomType['daily_price_currency'] ?? "غير محدد",
        'nightly_price': roomType['nightly_price'] ?? "غير محدد",
        'nightly_currency': roomType['nightly_currency'] ?? "غير محدد",
        'status': 'pending',
        'created_at': FieldValue.serverTimestamp(),
      });

      // تحديث القائمة المحلية
      final index = roomTypes.indexWhere((r) => r['id'] == roomType['id']);
      if (index != -1) {
        roomTypes[index]['available_count'] = availableCount - 1;
        roomTypes.refresh();
      }

      onWhatsApp();
      return true;
    } catch (e) {
      showSnackBar("فشل", "تعذر إرسال الطلب: $e",
          backgroundColor: Colors.red, colorText: Colors.white);
      return false;
    } finally {
      isLoadingBottomSheet.value = false;
    }
  }

  void showBookingConfirm({
    required Map<String, dynamic> hotel,
    required Map<String, dynamic> roomType,
    required Function() sendToWhatsApp,
  }) {
    Get.bottomSheet(
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
              "سوف يتواصل معك الفندق عبر واتساب لتأكيد الحجز وإتمام الدفع.",
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
                  _summaryRow("الفندق", hotel['hotel_name'] ?? 'غير محدد'),
                  _summaryRow("نوع الغرفة", roomType['title'] ?? 'غير محدد'),
                  _summaryRow("السعر اليومي",
                      "${roomType['daily_price'] ?? "غير محدد"} ${roomType['daily_price_currency'] ?? ""}"),
                  _summaryRow("السعر الليلي",
                      "${roomType['nightly_price'] ?? "غير محدد"} ${roomType['nightly_currency'] ?? ""}"),
                  _summaryRow("الغرف المتاحة",
                      "${roomType['available_count'] ?? 0} من ${roomType['total_count'] ?? 0}"),
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
                        final success = await submitRoomBooking(
                          hotelId: hotel['id'],
                          roomType: roomType,
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
}
