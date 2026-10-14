import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/features/contracts_section/services/contract_service.dart';

class PaymentController extends GetxController {
  var checkIn = ''.obs;
  var checkOut = ''.obs;
  var guests = ''.obs;
  var isPreparingDeal = false.obs;
  var isLoadingBottomSheet = false.obs;

  var dailyRate = 100.obs;
  var nights = 0.obs;
  var total = 0.obs;

  @override
  void onInit() {
    super.onInit();
    ever(checkIn, (_) => _calculate());
    ever(checkOut, (_) => _calculate());
  }

  void _calculate() {
    if (checkIn.value.isNotEmpty && checkOut.value.isNotEmpty) {
      final inDate = DateFormat('dd/MM/yyyy').parse(checkIn.value);
      final outDate = DateFormat('dd/MM/yyyy').parse(checkOut.value);
      nights.value = outDate.difference(inDate).inDays;
      total.value = dailyRate.value * nights.value;
    }
  }

  showConfirm({
    required Map property,
    required String dealId,
  }) {
    return Padding(
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
            style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          Text(
            "سيتم إرسال طلب الحجز الخاص بك.\n"
            "سيتم حفظ الطلب وإرساله إلى إدارة ريفيا للمراجعة والمتابعة.",
            style: GoogleFonts.cairo(
              fontSize: 15,
              color: Colors.grey[700],
              height: 1.6,
            ),
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
                _summaryRow("تاريخ الوصول", checkIn.value),
                _summaryRow("تاريخ المغادرة", checkOut.value),
                _summaryRow("عدد الضيوف", "${guests.value} أشخاص"),
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
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    "إلغاء",
                    style: GoogleFonts.cairo(color: Colors.grey[700]),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Obx(
                  () => ElevatedButton.icon(
                    onPressed: () async {
                      final success = await submitBooking(
                        property: property,
                        dealId: dealId,
                      );

                      if (success) {
                        safeBack();
                        showSnackBar(
                          "تم الإرسال",
                          "تم حفظ طلب الحجز وإرساله إلى إدارة ريفيا",
                          backgroundColor: Colors.green,
                          colorText: Colors.white,
                        );
                      }
                    },
                    icon: const Icon(Icons.send, color: Colors.white),
                    label: isLoadingBottomSheet.value
                        ? LoadingProgressiveDots()
                        : Text(
                            "إرسال الطلب",
                            style: GoogleFonts.cairo(color: Colors.white),
                          ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: Get.height * 0.2),
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
          Text(
            label,
            style: GoogleFonts.cairo(fontSize: 13, color: Colors.grey[600]),
          ),
          Text(
            value,
            style: GoogleFonts.cairo(fontSize: 14, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Future<bool> submitBooking({
    required Map property,
    required String dealId,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      showSnackBar("خطأ", "يجب تسجيل الدخول أولاً");
      return false;
    }

    try {
      isLoadingBottomSheet.value = true;

      final propertyId = (property['id'] ?? '').toString();
      final ownerUserId = (property['ownerId'] ?? '').toString();

      if (propertyId.isEmpty) {
        throw Exception('propertyId غير موجود في العقار');
      }

      if (ownerUserId.isEmpty) {
        throw Exception('ownerId غير موجود في العقار');
      }

      if (dealId.trim().isEmpty) {
        throw Exception('dealId غير موجود لطلب الحجز');
      }

      final checkInDate = parseDate(checkIn.value);
      final checkOutDate = parseDate(checkOut.value);

      if (checkInDate == null || checkOutDate == null) {
        showSnackBar(
          "خطأ",
          "يرجى اختيار تاريخ حجز صالح",
          backgroundColor: Colors.red,
          colorText: Colors.white,
        );
        return false;
      }

      final DateTime expiryDate = checkOutDate.add(const Duration(days: 1));

      final userBookingRef = FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .collection('user_bookings')
          .doc();

      final propertyBookingRef = FirebaseFirestore.instance
          .collection('properties')
          .doc(propertyId)
          .collection('bookings')
          .doc(userBookingRef.id);

      final bookingData = {
        'bookingId': userBookingRef.id,
        'dealId': dealId,
        'propertyId': propertyId,
        'property_id': propertyId,
        'propertyTitle': property['title'] ?? 'غير محدد',
        'property_title': property['title'] ?? 'غير محدد',
        'propertyType': property['property_type'] ?? 'غير محدد',
        'property_type': property['property_type'] ?? 'غير محدد',
        'customerUserId': user.uid,
        'ownerUserId': ownerUserId,
        'checkIn': checkIn.value,
        'check_in': checkIn.value,
        'checkOut': checkOut.value,
        'check_out': checkOut.value,
        'guests': guests.value,
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
        'created_at': FieldValue.serverTimestamp(),
        'expiry': Timestamp.fromDate(expiryDate),
      };

      final batch = FirebaseFirestore.instance.batch();
      batch.set(userBookingRef, bookingData);
      batch.set(propertyBookingRef, bookingData);
      await batch.commit();

      final queueAdminEmail =
          FirebaseFunctions.instance.httpsCallable('queueAdminEmail');
      await queueAdminEmail.call({
        'emailType': 'property_booking',
        'dealId': dealId,
        'bookingId': userBookingRef.id,
        'propertyId': propertyId,
        'propertyTitle': property['title'] ?? 'غير محدد',
        'customerUserId': user.uid,
        'ownerUserId': ownerUserId,
        'checkIn': checkIn.value,
        'checkOut': checkOut.value,
        'guests': guests.value,
      });

      await ContractService().createDirectPartyContract(dealId: dealId);

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

  List<Map<String, dynamic>> getUpcomingBookings(Map property) {
    final periods = (property['booked_periods'] as List?) ?? [];
    final now = DateTime.now();

    final upcoming = <Map<String, dynamic>>[];

    for (final p in periods) {
      if (p is! Map) continue;

      final from = _readBookingDate(p['from']);
      final to = _readBookingDate(p['to']);

      if (from == null || to == null) continue;

      if (from.isAfter(now)) {
        upcoming.add({
          'from': from,
          'to': to,
          'fromStr': DateFormat('dd/MM/yyyy').format(from),
          'toStr': DateFormat('dd/MM/yyyy').format(to),
        });
      }
    }

    upcoming.sort((a, b) => a['from'].compareTo(b['from']));
    return upcoming;
  }

  DateTime? getNextAvailableDate(Map property) {
    final upcoming = getUpcomingBookings(property);
    return upcoming.isNotEmpty ? upcoming.first['from'] : null;
  }

  bool hasOverlap(Map property, DateTime checkIn, DateTime checkOut) {
    final periods = (property['booked_periods'] as List?) ?? [];

    for (final p in periods) {
      if (p is! Map) continue;

      final from = _readBookingDate(p['from']);
      final to = _readBookingDate(p['to']);

      if (from == null || to == null) continue;

      if (checkIn.isBefore(to) && checkOut.isAfter(from)) {
        return true;
      }
    }
    return false;
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

  DateTime? _readBookingDate(dynamic value) {
    if (value is Timestamp) return value.toDate();
    if (value is DateTime) return value;
    return null;
  }
}
