// lib/features/admin/controller/admin_bookings_controller.dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'dart:developer' as dev;
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/mappers/property_mapper.dart';

class AdminBookingsController extends GetxController {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  final RxList pendingBookings = [].obs;
  final RxBool isLoading = true.obs;

  @override
  void onInit() {
    super.onInit();
    loadPendingBookings();
  }

  Future<void> loadPendingBookings() async {
    try {
      isLoading(true);
      final List result = [];

      // جلب جميع المستخدمين
      final usersSnap = await _firestore.collection('users').get();

      for (final userDoc in usersSnap.docs) {
        final userId = userDoc.id;
        final userData = userDoc.data();
        final userName = userData['username'] ?? 'غير معروف';
        final userEmail = userData['email'] ?? 'غير معروف';

        // جلب الحجوزات المعلقة
        final bookingsSnap = await _firestore
            .collection('users')
            .doc(userId)
            .collection('user_bookings')
            .where('status', isEqualTo: 'pending')
            .get();

        for (final bookingDoc in bookingsSnap.docs) {
          final bookingData = bookingDoc.data();
          final propertyId =
              bookingData['property_id'] ?? bookingData['propertyId'];
          final hotelId = bookingData['hotel_id'];

          // التحقق إذا كان حجز فندق
          if (hotelId != null) {
            // حجز فندق
            String hotelName = bookingData['hotel_name'] ?? 'غير معروف';
            String roomTypeTitle =
                bookingData['room_type_title'] ?? 'غير معروف';
            String hotelImage = '';

            // جلب معلومات الفندق
            try {
              final hotelSnap =
                  await _firestore.collection('hotels').doc(hotelId).get();
              if (hotelSnap.exists) {
                final hotelData = hotelSnap.data()!;
                hotelName = hotelData['hotel_name'] ?? hotelName;
                hotelImage = hotelData['mainImage'] ?? '';
              }
            } catch (e) {
              dev.log("خطأ في جلب معلومات الفندق: $e");
            }

            Map<String, dynamic> hotelBookingData = {
              'bookingId': bookingDoc.id,
              'userId': userId,
              'userName': userName,
              'email': userEmail,
              'hotelId': hotelId,
              'hotelName': hotelName,
              'hotelImage': hotelImage,
              'roomTypeId': bookingData['room_type_id'],
              'roomTypeTitle': roomTypeTitle,
              'property_type': 'فندق',
              'booking_type': bookingData['booking_type'] ?? 'ليلي',
              'check_in': bookingData['check_in'],
              'check_out': bookingData['check_out'],
              'guests': bookingData['guests'] ?? 'غير محدد',
              'nights': bookingData['nights'] ?? 0,
              'total_amount': bookingData['total_amount'] ?? '',
              'daily_price': bookingData['daily_price'] ?? '',
              'daily_price_currency': bookingData['daily_price_currency'] ?? '',
              'nightly_price': bookingData['nightly_price'] ?? '',
              'nightly_currency': bookingData['nightly_currency'] ?? '',
              'created_at': bookingData['created_at']?.toDate(),
            };
            result.add(hotelBookingData);
          } else if (propertyId != null) {
            // حجز عقار عادي
            String propertyTitle = 'غير معروف';
            String propertyImage = '';
            String propertyType = 'غير محدد';

            if (propertyId != null) {
              final propSnap = await _firestore
                  .collection('properties')
                  .doc(propertyId)
                  .get();
              if (propSnap.exists) {
                final propData =
                    normalizePropertyMap(propSnap.data()!, id: propSnap.id);
                propertyTitle = propData['title'] ?? 'غير معروف';
                propertyImage = propData['mainImage'] ?? '';
                propertyType =
                    propData['property_type'] ?? propData['type'] ?? 'غير محدد';
              }
            }

            Map<String, dynamic> sharedData = {
              'bookingId': bookingDoc.id,
              'userId': userId,
              'userName': userName,
              "email": userEmail,
              'propertyId': propertyId,
              'propertyTitle': propertyTitle,
              'propertyImage': propertyImage,
              'property_type': propertyType,
              'created_at': bookingData['created_at']?.toDate(),
            };

            if (propertyType == "إيجار") {
              sharedData.addAll({
                'check_in': bookingData['check_in'],
                'check_out': bookingData['check_out'],
                'guests': bookingData['guests'] ?? 'غير محدد',
              });
              result.add(sharedData);
            } else if (propertyType == "بيع") {
              sharedData.addAll({
                'selling_price': bookingData['selling_price'],
                'selling_price_currency': bookingData['selling_price_currency'],
              });
              result.add(sharedData);
            }
          }
        }
      }

      pendingBookings.assignAll(result);
    } catch (e, s) {
      dev.log("خطأ في جلب الحجوزات المعلقة", error: e, stackTrace: s);
      showSnackBar("خطأ", "فشل تحميل الحجوزات");
    } finally {
      isLoading(false);
    }
  }

  DateTime? parseDateString(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return null;

    // تنسيق: DD/MM/YYYY
    final parts = dateStr.split('/');
    if (parts.length != 3) return null;

    final day = int.tryParse(parts[0]);
    final month = int.tryParse(parts[1]);
    final year = int.tryParse(parts[2]);

    if (day == null || month == null || year == null) return null;

    return DateTime(year, month, day);
  }

  // تأكيد الحجز + إشعار (type: accept)
  Future<void> confirmRentBooking(
    String userId,
    String bookingId,
    String propertyId,
    String propertyTitle,
    DateTime checkIn,
    DateTime checkOut,
  ) async {
    bool canBook = await canBookProperty(propertyId, checkIn, checkOut);

    if (!canBook) {
      showSnackBar("فشل", "تعارض في الأوقات، الرجاء اختيار وقت آخر",
          backgroundColor: Colors.red);
      return;
    }

    final batch = _firestore.batch();

    try {
      final bookingRef = _firestore
          .collection('users')
          .doc(userId)
          .collection('user_bookings')
          .doc(bookingId);

      final propertyRef = _firestore.collection('properties').doc(propertyId);

      // 1. تحديث الحجز
      batch.update(bookingRef, {'status': 'confirmed'});

      // 2. إضافة الفترة كـ document جديد في subcollection 'bookings' تحت العقار
      final propertyBookingRef =
          propertyRef.collection('bookings').doc(bookingId);

      final expiryDate =
          checkOut.add(const Duration(days: 1)); // إضافة يوم واحد لـ expiry

      // 2. إضافة الفترة إلى العقار
      final newPeriod = {
        'from': Timestamp.fromDate(checkIn),
        'to': Timestamp.fromDate(checkOut),
        'bookingId': bookingId,
        'userId': userId,
        'expiry': Timestamp.fromDate(expiryDate), // الحقل الجديد لـ TTL
      };

      batch.set(propertyBookingRef, newPeriod);

      await batch.commit();

      // 6. إرسال الإشعار
      await _firestore
          .collection('users')
          .doc(userId)
          .collection('notifications')
          .add({
        'title': 'تم قبول حجزك',
        'message': 'مبروك! تم قبول حجزك لـ "$propertyTitle"',
        'type': 'accept',
        'bookingId': bookingId,
        'propertyId': propertyId,
        'propertyTitle': propertyTitle,
        'read': false,
        'created_at': FieldValue.serverTimestamp(),
      });

      showSnackBar("تم", "تم تأكيد الحجز وحجز العقار",
          backgroundColor: Colors.green, colorText: Colors.white);

      loadPendingBookings();
    } catch (e) {
      showSnackBar("خطأ", "فشل تأكيد الحجز أو حجز العقار: $e",
          backgroundColor: Colors.red, colorText: Colors.white);
    }
  }

  Future<void> confirmSaleBooking(
    String userId,
    String bookingId,
    String propertyId,
    String propertyTitle,
  ) async {
    final batch = _firestore.batch();

    try {
      final bookingRef = _firestore
          .collection('users')
          .doc(userId)
          .collection('user_bookings')
          .doc(bookingId);

      final propertyRef = _firestore.collection('properties').doc(propertyId);

      // 1. تحديث حالة الحجز إلى "مؤكد"
      batch.update(bookingRef, {
        'status': 'confirmed',
        'confirmed_at': FieldValue.serverTimestamp(),
      });

      // 2. تحديث العقار: تم بيعه
      batch.update(propertyRef, {
        'availability': 'sold',
        'selled_to_user_id': userId, // من اشتراه
        'selled_booking_id': bookingId, // رقم الحجز
        'selled_at': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

      // تنفيذ الدفعة
      await batch.commit();

      // 3. إرسال إشعار للمشتري
      await _firestore
          .collection('users')
          .doc(userId)
          .collection('notifications')
          .add({
        'title': 'تم شراء العقار بنجاح!',
        'message': 'مبروك! أنت الآن تمتلك "$propertyTitle"',
        'type': 'accept',
        'bookingId': bookingId,
        'propertyId': propertyId,
        'propertyTitle': propertyTitle,
        'read': false,
        'created_at': FieldValue.serverTimestamp(),
      });

      // رسالة نجاح
      showSnackBar(
        "تم البيع",
        "تم تأكيد شراء العقار بنجاح",
        backgroundColor: Colors.green,
        colorText: Colors.white,
        icon: const Icon(Icons.check_circle, color: Colors.white),
      );

      // تحديث القوائم
      loadPendingBookings();
    } catch (e) {
      showSnackBar(
        "خطأ",
        "فشل تأكيد عملية البيع: $e",
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    }
  }

  Future<bool> canBookProperty(
      String propertyId, DateTime checkIn, DateTime checkOut) async {
    final propertySnap =
        await _firestore.collection('properties').doc(propertyId).get();
    if (!propertySnap.exists) return false;

    final data = propertySnap.data()!;
    final periods = (data['booked_periods'] as List?) ?? [];

    for (final period in periods) {
      final from = (period['from'] as Timestamp).toDate();
      final to = (period['to'] as Timestamp).toDate();

      if (checkIn.isBefore(to) && checkOut.isAfter(from)) {
        return false; // تداخل
      }
    }
    return true;
  }

  // تأكيد حجز فندق
  Future<void> confirmHotelBooking(
    String userId,
    String bookingId,
    String hotelId,
    String roomTypeId,
    String hotelName,
  ) async {
    try {
      // جلب بيانات الحجز أولاً
      final bookingDoc = await _firestore
          .collection('users')
          .doc(userId)
          .collection('user_bookings')
          .doc(bookingId)
          .get();

      if (!bookingDoc.exists) {
        showSnackBar("خطأ", "الحجز غير موجود");
        return;
      }

      final bookingData = bookingDoc.data()!;

      // جلب بيانات المستخدم
      final userDoc = await _firestore.collection('users').doc(userId).get();
      final userData = userDoc.exists ? userDoc.data() : {};
      final userName =
          userData?['username'] ?? bookingData['userName'] ?? 'غير معروف';
      final userEmail =
          userData?['email'] ?? bookingData['email'] ?? 'غير محدد';

      final batch = _firestore.batch();

      // 1. تحديث الحجز في users/{userId}/bookings/{bookingId}
      final bookingRef = _firestore
          .collection('users')
          .doc(userId)
          .collection('user_bookings')
          .doc(bookingId);
      batch.update(bookingRef, {
        'status': 'confirmed',
        'confirmed_at': FieldValue.serverTimestamp(),
      });

      // 2. إضافة سجل في hotels/{hotelId}/room_types/{roomTypeId}/bookings/{bookingId}
      final roomBookingRef = _firestore
          .collection('hotels')
          .doc(hotelId)
          .collection('room_types')
          .doc(roomTypeId)
          .collection('bookings')
          .doc(bookingId);

      batch.set(roomBookingRef, {
        'bookingId': bookingId,
        'userId': userId,
        'userName': userName,
        'userEmail': userEmail,
        'hotelId': hotelId,
        'hotelName': hotelName,
        'roomTypeId': roomTypeId,
        'roomTypeTitle': bookingData['room_type_title'] ?? 'غير محدد',
        'booking_type': bookingData['booking_type'] ?? 'ليلي',
        'check_in': bookingData['check_in'] ?? '',
        'check_out': bookingData['check_out'] ?? '',
        'guests': bookingData['guests'] ?? 'غير محدد',
        'nights': bookingData['nights'] ?? 0,
        'total_amount': bookingData['total_amount'] ?? '',
        'daily_price': bookingData['daily_price'] ?? '',
        'daily_price_currency': bookingData['daily_price_currency'] ?? '',
        'nightly_price': bookingData['nightly_price'] ?? '',
        'nightly_currency': bookingData['nightly_currency'] ?? '',
        'status': 'confirmed',
        'created_at': bookingData['created_at'] ?? FieldValue.serverTimestamp(),
        'confirmed_at': FieldValue.serverTimestamp(),
      });

      await batch.commit();

      // 3. إرسال الإشعار
      await _firestore
          .collection('users')
          .doc(userId)
          .collection('notifications')
          .add({
        'title': 'تم قبول حجزك',
        'message': 'مبروك! تم قبول حجزك في "$hotelName"',
        'type': 'accept',
        'bookingId': bookingId,
        'hotelId': hotelId,
        'hotelName': hotelName,
        'read': false,
        'created_at': FieldValue.serverTimestamp(),
      });

      showSnackBar("تم", "تم تأكيد حجز الفندق",
          backgroundColor: Colors.green, colorText: Colors.white);

      loadPendingBookings();
    } catch (e) {
      showSnackBar("خطأ", "فشل تأكيد حجز الفندق: $e",
          backgroundColor: Colors.red, colorText: Colors.white);
      dev.log("فشل تأكيد حجز الفندق", error: e);
    }
  }

  // رفض الحجز + إشعار (type: reject)
  Future<void> rejectBooking(String userId, String bookingId, String? reason,
      String propertyTitle) async {
    try {
      // جلب بيانات الحجز أولاً للتحقق من نوعه
      final bookingDoc = await _firestore
          .collection('users')
          .doc(userId)
          .collection('user_bookings')
          .doc(bookingId)
          .get();

      if (!bookingDoc.exists) {
        showSnackBar("خطأ", "الحجز غير موجود");
        return;
      }

      final bookingData = bookingDoc.data()!;
      final hotelId = bookingData['hotel_id'];
      final roomTypeId = bookingData['room_type_id'];

      // 1. تحديث الحجز
      final updateData = {'status': 'rejected'};
      if (reason != null && reason.trim().isNotEmpty) {
        updateData['reject_reason'] = reason.trim();
      }

      final batch = _firestore.batch();
      final bookingRef = _firestore
          .collection('users')
          .doc(userId)
          .collection('user_bookings')
          .doc(bookingId);
      batch.update(bookingRef, updateData);

      // 2. إذا كان حجز فندق، استعادة available_count
      if (hotelId != null && roomTypeId != null) {
        final roomTypeRef = _firestore
            .collection('hotels')
            .doc(hotelId)
            .collection('room_types')
            .doc(roomTypeId);
        batch.update(roomTypeRef, {
          'available_count': FieldValue.increment(1),
        });
      }

      await batch.commit();

      // 2. إرسال إشعار: نوع reject
      final message = reason != null && reason.trim().isNotEmpty
          ? 'تم رفض حجزك لـ "$propertyTitle". السبب: $reason'
          : 'تم رفض حجزك لـ "$propertyTitle"';

      await _firestore
          .collection('users')
          .doc(userId)
          .collection('notifications')
          .add({
        'title': 'تم رفض حجزك',
        'message': message,
        'type': 'reject', // الحالة: رفض
        'bookingId': bookingId,
        'propertyTitle': propertyTitle,
        'read': false,
        'created_at': FieldValue.serverTimestamp(),
      });

      showSnackBar("تم", "تم رفض الحجز وإرسال الإشعار",
          backgroundColor: Colors.red, colorText: Colors.white);

      loadPendingBookings();
    } catch (e) {
      showSnackBar("خطأ", "فشل رفض الحجز");
    }
  }
}
