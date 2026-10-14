import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

DateTime? _readBookingDate(dynamic value) {
  if (value is Timestamp) return value.toDate();
  if (value is DateTime) return value;
  return null;
}


Future<void> selectDate({
  required BuildContext context,
  required RxString dateObs,
  required String label,
  required Map property,
  DateTime? checkInDate, // ← تاريخ الوصول (إذا كان label = المغادرة)
}) async {
  if (label == "Ø§Ù„Ù…ØºØ§Ø¯Ø±Ø©" && checkInDate == null) {
    showSnackBar("ØªÙ†Ø¨ÙŠÙ‡", "ÙŠØ±Ø¬Ù‰ Ø§Ø®ØªÙŠØ§Ø± ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¨Ø¯Ø¡ Ø£ÙˆÙ„Ø§Ù‹");
    return;
  }

  final periods = (property['booked_periods'] as List?) ?? [];
  final now = DateTime.now();

  // 🔹 إيجاد أول حجز قادم
  DateTime? firstUpcomingStart;
  for (final p in periods) {
    if (p is! Map) continue;

    final from = _readBookingDate(p['from']);
    if (from == null) continue;

    if (from.isAfter(now) && (firstUpcomingStart == null || from.isBefore(firstUpcomingStart))) {
      firstUpcomingStart = from;
    }
  }

  // 🔹 آخر يوم يمكن الحجز إليه (يسمح باختيار اليوم السابق لأول حجز)
  final maxAllowedDate = firstUpcomingStart != null
      ? firstUpcomingStart.subtract(const Duration(days: 1))
      : DateTime.now().add(const Duration(days: 365));

  // 🔹 إذا كان هذا تاريخ المغادرة → الحد الأدنى هو يوم الوصول نفسه
  final minDateForCheckout = checkInDate;

  final effectiveFirstDate = minDateForCheckout ?? DateTime.now();

  bool isSelectable(DateTime day) {
    final currentDay = DateTime(day.year, day.month, day.day);

    // 1️⃣ منع الأيام المحجوزة
    for (final p in periods) {
      if (p is! Map) continue;

      final from = _readBookingDate(p['from']);
      final to = _readBookingDate(p['to']);

      if (from == null || to == null) continue;

      final fromDay = DateTime(from.year, from.month, from.day);
      final toDay = DateTime(to.year, to.month, to.day);

      if (currentDay.isAfter(fromDay.subtract(const Duration(days: 1))) &&
          currentDay.isBefore(toDay.add(const Duration(days: 1)))) {
        return false;
      }
    }

    // 2️⃣ منع الأيام بعد أول حجز قادم
    if (firstUpcomingStart != null) {
      final firstStartDay = DateTime(
        firstUpcomingStart.year,
        firstUpcomingStart.month,
        firstUpcomingStart.day,
      );
      if (currentDay.isAfter(firstStartDay)) {
        return false;
      }
    }

    // 3️⃣ إذا كان check-out → لا يمكن أن يكون قبل check-in
    if (minDateForCheckout != null) {
      final minDay = DateTime(
        minDateForCheckout.year,
        minDateForCheckout.month,
        minDateForCheckout.day,
      );
      if (currentDay.isBefore(minDay)) {
        return false;
      }
    }

    return true;
  }

  // ✅ تأكد أن initialDate صالحة
  DateTime safeInitialDate = effectiveFirstDate;
  while (!isSelectable(safeInitialDate) && safeInitialDate.isBefore(maxAllowedDate)) {
    safeInitialDate = safeInitialDate.add(const Duration(days: 1));
  }

  // إذا لم يوجد أي يوم متاح → لا تفتح picker
  if (!isSelectable(safeInitialDate)) {
    showSnackBar("تنبيه", "لا توجد أيام متاحة للحجز حاليًا");
    return;
  }

  final DateTime? picked = await showDatePicker(
    context: context,
    initialDate: safeInitialDate,
    firstDate: effectiveFirstDate,
    lastDate: maxAllowedDate,
    selectableDayPredicate: isSelectable,
    builder: (context, child) {
      return Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(
            primary: Colors.blue,
            onPrimary: Colors.white,
          ),
        ),
        child: child!,
      );
    },
  );

  if (picked != null) {
    dateObs.value = DateFormat('dd/MM/yyyy').format(picked);
  }
}
