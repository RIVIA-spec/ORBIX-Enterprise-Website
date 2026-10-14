// lib/features/user/my_property/controller/my_property_controller.dart
import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/mappers/property_mapper.dart';

class MyPropertyController extends GetxController {
  final userId = FirebaseAuth.instance.currentUser!.uid;

  var pendingCount = 0.obs;
  var properties = <Map<String, dynamic>>[].obs;
  var isLoading = true.obs;

  @override
  void onInit() {
    super.onInit();
    loadData();
  }

  Future<void> loadData() async {
    isLoading.value = true;
    await Future.wait([
      _loadPendingCount(),
      _loadApprovedProperties(),
    ]);
    isLoading.value = false;
  }

  Future<void> _loadPendingCount() async {
    try {
      final snap = await FirebaseFirestore.instance
          .collection('property_requests')
          .where('ownerId', isEqualTo: userId)
          .where('status', isEqualTo: 'pending')
          .get();
      pendingCount.value = snap.size;
    } catch (e, s) {
      log("خطأ في جلب الطلبات المعلقة", error: e, stackTrace: s);
      pendingCount.value = 0;
    }
  }

  Future<void> _loadApprovedProperties() async {
    try {
      final snap = await FirebaseFirestore.instance
          .collection('properties')
          .where('ownerId', isEqualTo: userId)
          .where('status', isEqualTo: 'approved')
          .get();

      final List<Map<String, dynamic>> allProps = [];
      final List<Future<void>> bookingFutures = [];

      final now = DateTime.now();

      for (final doc in snap.docs) {
        final data = normalizePropertyMap(doc.data(), id: doc.id);
        final isRent = isRentMap(data);
        final isSale = isSaleMap(data);

        // --- الحالة الأساسية (قبل جلب الحجوزات) ---
        if (isSale) {
          final isSold = data['isSold'] ?? false;
          data['book_status'] = isSold ? "تم البيع" : "متاح";
          data['statusColor'] =
              isSold ? Colors.orange.shade700 : Colors.green.shade400;
          allProps.add(data);
          continue; // لا داعي لجلب الحجوزات لعقارات البيع
        }

        if (!isRent) {
          data['book_status'] = "متاح";
          data['statusColor'] = Colors.green.shade400;
          allProps.add(data);
          continue;
        }

        // --- للإيجار فقط: نضع حالة مؤقتة ثم نُحدّثها لاحقًا ---
        data['book_status'] = "جاري التحقق...";
        data['statusColor'] = Colors.grey.shade400;
        allProps.add(data);

        // جلب الحجوزات
        final propertyId = doc.id;
        final future = FirebaseFirestore.instance
            .collection('properties')
            .doc(propertyId)
            .collection('bookings')
            .get()
            .then((bookingSnap) {
          final periods = bookingSnap.docs.map((d) => d.data()).toList();
          data['booked_periods'] = periods;

          DateTime? latestEnd; // أبعد تاريخ نهاية
          bool isCurrentlyBooked = false;

          for (final p in periods) {
            final from = _readBookingDate(p['from']);
            final to = _readBookingDate(p['to']);
            if (from == null || to == null) continue;

            // نضيف يومًا واحدًا للنهاية ليشمل اليوم الأخير كاملاً
            final effectiveEnd = to.add(const Duration(days: 1));

            // هل اليوم الحالي داخل الفترة (شامل البداية والنهاية)؟
            final isActive =
                (now.isAfter(from) || now.isAtSameMomentAs(from)) &&
                    now.isBefore(effectiveEnd);

            if (isActive) {
              isCurrentlyBooked = true;
              if (latestEnd == null || to.isAfter(latestEnd)) {
                latestEnd = to; // نحتفظ بأحدث تاريخ نهاية
              }
            }
          }

          if (isCurrentlyBooked && latestEnd != null) {
            data['book_status'] =
                "محجوز حتى ${latestEnd.day}/${latestEnd.month}/${latestEnd.year}";
            data['statusColor'] = Colors.red.shade700;
          } else {
            data['book_status'] = "متاح";
            data['statusColor'] = Colors.green.shade400;
          }
        }).catchError((e) {
          // في حال فشل جلب الحجوزات لعقار واحد
          log("خطأ في جلب الحجوزات للعقار $propertyId: $e");
          // data['book_status'] = "متاح";
          // data['statusColor'] = Colors.green.shade400;
        });

        bookingFutures.add(future);
      }

      // انتظر جلب جميع الحجوزات بالتوازي
      if (bookingFutures.isNotEmpty) {
        await Future.wait(bookingFutures);
      }

      // تحديث القائمة النهائية
      properties.value = allProps;
    } catch (e, s) {
      log("خطأ في جلب العقارات المعتمدة", error: e, stackTrace: s);
      properties.value = [];
      showSnackBar("خطأ", "فشل تحميل العقارات", backgroundColor: Colors.red);
    }
  }

  Future<void> refreshData() => loadData();

  DateTime? _readBookingDate(dynamic value) {
    if (value is Timestamp) return value.toDate();
    if (value is DateTime) return value;
    return null;
  }
}
