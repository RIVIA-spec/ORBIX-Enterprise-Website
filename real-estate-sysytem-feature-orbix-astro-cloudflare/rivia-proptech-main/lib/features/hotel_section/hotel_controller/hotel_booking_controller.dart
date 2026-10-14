import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/features/contracts_section/services/contract_service.dart';

class HotelBookingController extends GetxController {
  var checkIn = ''.obs;
  var checkOut = ''.obs;
  var guests = ''.obs;
  var bookingType = 'ليلي'.obs; // ليلي أو نهاري
  var isLoadingBottomSheet = false.obs;

  var dailyRate = 0.obs;
  var nightlyRate = 0.obs;
  var nights = 0.obs;
  var total = 0.obs;

  @override
  void onInit() {
    super.onInit();
    ever(checkIn, (_) => _calculate());
    ever(checkOut, (_) => _calculate());
    ever(bookingType, (_) => _calculate());
    ever(dailyRate, (_) => _calculate());
    ever(nightlyRate, (_) => _calculate());
  }

  void _calculate() {
    if (checkIn.value.isNotEmpty && checkOut.value.isNotEmpty) {
      try {
        final inDate = DateFormat('dd/MM/yyyy').parse(checkIn.value);
        final outDate = DateFormat('dd/MM/yyyy').parse(checkOut.value);
        
        // التحقق من أن تاريخ المغادرة بعد تاريخ الوصول
        if (outDate.isAfter(inDate)) {
          // إضافة 1 لأن difference().inDays لا يشمل يوم البداية
          // مثال: من 22/11 إلى 24/11 = 3 أيام (22، 23، 24)
          nights.value = outDate.difference(inDate).inDays + 1;
          
          // حساب السعر بناءً على نوع الحجز
          if (bookingType.value == 'ليلي') {
            total.value = nightlyRate.value * nights.value;
          } else {
            total.value = dailyRate.value * nights.value;
          }
        } else {
          // إذا كان تاريخ المغادرة قبل أو يساوي تاريخ الوصول
          nights.value = 0;
          total.value = 0;
        }
      } catch (e) {
        // في حالة خطأ في تحليل التاريخ
        nights.value = 0;
        total.value = 0;
      }
    } else {
      // إذا كان أحد التواريخ فارغاً
      nights.value = 0;
      total.value = 0;
    }
  }

  void setRates(int daily, int nightly) {
    dailyRate.value = daily;
    nightlyRate.value = nightly;
    _calculate();
  }

  showConfirm({
    required Map<String, dynamic> hotel,
    required Map<String, dynamic> roomType,
    required Function() sendToWhatsApp,
  }) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // مقبض السحب
          Container(
            width: 50,
            height: 5,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 20),

          // أيقونة تأكيد
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_circle, size: 50, color: Colors.green),
          ),
          const SizedBox(height: 20),

          // العنوان
          Text(
            "تأكيد طلب الحجز",
            style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),

          // الرسالة
          Text(
            "سيتم إرسال طلب الحجز الخاص بك.\n"
            "سوف يتواصل معك الفندق عبر واتساب لتأكيد الحجز وإتمام الدفع.",
            style: GoogleFonts.cairo(fontSize: 15, color: Colors.grey[700], height: 1.6),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),

          // ملخص سريع
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
                _summaryRow("نوع الحجز", bookingType.value),
                _summaryRow("تاريخ الوصول", checkIn.value),
                _summaryRow("تاريخ المغادرة", checkOut.value),
                _summaryRow("عدد الضيوف", "${guests.value} أشخاص"),
                _summaryRow("عدد الليالي/الأيام", "${nights.value} ${bookingType.value == 'ليلي' ? 'ليلة' : 'يوم'}"),
                if (total.value > 0)
                  _summaryRow(
                    "المبلغ الإجمالي",
                    "${_formatNumber(total.value)} ${bookingType.value == 'ليلي' ? (roomType['nightly_currency'] ?? '') : (roomType['daily_price_currency'] ?? '')}",
                  ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // الأزرار
          Row(
            children: [
              // إلغاء
              Expanded(
                child: OutlinedButton(
                  onPressed: () => safeBack(),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: Colors.grey),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text("إلغاء", style: GoogleFonts.cairo(color: Colors.grey[700])),
                ),
              ),
              const SizedBox(width: 12),

              // إرسال
              Expanded(
                child: Obx(
                  () => ElevatedButton.icon(
                    onPressed: () async {
                      final success = await submitBooking(
                        hotel: hotel,
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
                        : Text("إرسال الطلب", style: GoogleFonts.cairo(color: Colors.white)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: Get.height * 0.2), // للكيبورد
        ],
      ),
    );
  }

  Widget _summaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.cairo(fontSize: 13, color: Colors.grey[600])),
          Text(value, style: GoogleFonts.cairo(fontSize: 14, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  String _formatNumber(int number) {
    return number.toString().replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
      (match) => '${match.group(1)},',
    );
  }

  Future<bool> submitBooking({
    required Map<String, dynamic> hotel,
    required Map<String, dynamic> roomType,
    required Function() onWhatsApp,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      showSnackBar("خطأ", "يجب تسجيل الدخول أولاً", backgroundColor: Colors.red, colorText: Colors.white);
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

      // حساب تاريخ الانتهاء (checkOut + يوم واحد)
      final DateFormat dateFormat = DateFormat('dd/MM/yyyy');
      DateTime checkOutDate = dateFormat.parse(checkOut.value);
      DateTime expiryDate = checkOutDate.add(const Duration(days: 1));

      await bookingRef.set({
        'bookingId': bookingRef.id,
        'hotelId': hotel['id'],
        'hotel_id': hotel['id'],
        'ownerUserId': hotel['ownerUserId'] ?? hotel['ownerId'] ?? hotel['userId'] ?? hotel['createdBy'] ?? '',
        'customerUserId': user.uid,
        'currency': roomType['nightly_currency'] ?? roomType['daily_price_currency'] ?? 'usd',
        'hotel_name': hotel['hotel_name'] ?? 'غير محدد',
        'room_type_id': roomType['id'],
        'room_type_title': roomType['title'] ?? 'غير محدد',
        'property_type': 'إيجار',
        'booking_type': bookingType.value, // ليلي أو نهاري
        'check_in': checkIn.value,
        'check_out': checkOut.value,
        'guests': guests.value,
        'nights': nights.value,
        'daily_price': roomType['daily_price'] ?? "غير محدد",
        'daily_price_currency': roomType['daily_price_currency'] ?? "غير محدد",
        'nightly_price': roomType['nightly_price'] ?? "غير محدد",
        'nightly_currency': roomType['nightly_currency'] ?? "غير محدد",
        'total_amount': total.value > 0 ? total.value.toString() : '',
        'status': 'pending',
        'created_at': FieldValue.serverTimestamp(),
        'expiry': Timestamp.fromDate(expiryDate), // الحقل الجديد لـ TTL
      });

      // تقليل available_count
      await FirebaseFirestore.instance
          .collection('hotels')
          .doc(hotel['id'])
          .collection('room_types')
          .doc(roomType['id'])
          .update({
        'available_count': FieldValue.increment(-1),
      });

      // إرسال واتساب بعد الحفظ
      onWhatsApp();

      await ContractService().createDirectPartyContract(bookingId: bookingRef.id);

      return true;
    } catch (e) {
      showSnackBar("فشل", "تعذر إرسال الطلب: $e",
          backgroundColor: Colors.red, colorText: Colors.white);
      return false;
    } finally {
      isLoadingBottomSheet.value = false;
    }
  }

  DateTime? parseDate(String dateStr) {
    try {
      final parts = dateStr.split('/');
      if (parts.length != 3) return null;
      final day = int.tryParse(parts[0]);
      final month = int.tryParse(parts[1]);
      final year = int.tryParse(parts[2]);
      if (day == null || month == null || year == null) return null;
      return DateTime(year, month, day);
    } catch (e) {
      return null;
    }
  }
}

