// lib/features_admin/report_section/controller/report_controller.dart
import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class ReportController extends GetxController {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  var isLoading = false.obs;

  var searchQuery = ''.obs;
  var selectedFilter = 'pending'.obs; // 'all', 'pending', 'closed'

  // تقارير الإبلاغ
  var reports = <Map<String, dynamic>>[].obs;
  // أسباب الإبلاغ (نحملها مرة واحدة)
  var reportReasons = <Map<String, dynamic>>[].obs;
  // التقارير المفلترة
  var filteredReports = <Map<String, dynamic>>[].obs;

  @override
  void onInit() {
    super.onInit();
    loadReportReasons();
    loadReports();
    ever(searchQuery, (_) => applyFilters());
    ever(selectedFilter, (_) => applyFilters());

  }

  void applyFilters() {
    List<Map<String, dynamic>> temp = reports;

    // فلتر الحالة
    if (selectedFilter.value == 'pending') {
      temp = temp.where((r) => r['status'] == 'pending').toList();
    } else if (selectedFilter.value == 'closed') {
      temp = temp.where((r) => r['status'] == 'closed').toList();
    }

    // البحث
    if (searchQuery.value.isNotEmpty) {
      final query = searchQuery.value.toLowerCase();
      temp = temp.where((r) {
        final id = (r['property_id'] ?? r['hotel_id'] ?? '').toString().toLowerCase();
        final title = (r['property_title'] ?? '').toString().toLowerCase();
        return id.contains(query) || title.contains(query);
      }).toList();
    }

    filteredReports.assignAll(temp);
  }

  // ---------- تحميل التقارير مع بيانات العقار والفندق ----------
  Future<void> loadReports() async {
    try {
      isLoading.value = true;

      // جلب إبلاغات العقارات
      final propertyReportsSnap = await _firestore
          .collection('property_reports')
          .orderBy('reported_at', descending: true)
          .get();

      // جلب إبلاغات الفنادق
      final hotelReportsSnap = await _firestore
          .collection('hotel_reports')
          .orderBy('reported_at', descending: true)
          .get();

      final List<Map<String, dynamic>> enrichedReports = [];

      // معالجة إبلاغات العقارات
      for (final doc in propertyReportsSnap.docs) {
        final reportData = doc.data();
        final propertyId = reportData['property_id'] as String?;

        Map<String, dynamic>? propertySummary;

        if (propertyId != null && propertyId.isNotEmpty) {
          try {
            final propertyDoc = await _firestore
                .collection('properties')
                .doc(propertyId)
                .get();

            if (propertyDoc.exists) {
              final pData = propertyDoc.data()!;
              propertySummary = {
                'title': pData['title'] ?? 'عقار بدون عنوان',
                'mainImage': pData['mainImage'] ?? '',
              };
            } else {
              propertySummary = {
                'title': 'العقار غير موجود',
                'mainImage': '',
              };
            }
          } catch (e) {
            propertySummary = {
              'title': 'العقار غير موجود',
              'mainImage': '',
            };
          }
        } else {
          propertySummary = {
            'title': 'معرف العقار مفقود',
            'mainImage': '',
          };
        }

        enrichedReports.add({
          'id': doc.id,
          'item_type': 'property',
          'collection': 'property_reports',
          ...reportData,
          'property_title': propertySummary['title'],
          'property_main_image': propertySummary['mainImage'],
        });
      }

      // معالجة إبلاغات الفنادق
      for (final doc in hotelReportsSnap.docs) {
        final reportData = doc.data();
        final hotelId = reportData['hotel_id'] as String?;

        Map<String, dynamic>? hotelSummary;

        if (hotelId != null && hotelId.isNotEmpty) {
          try {
            final hotelDoc = await _firestore
                .collection('hotels')
                .doc(hotelId)
                .get();

            if (hotelDoc.exists) {
              final hData = hotelDoc.data()!;
              hotelSummary = {
                'title': hData['hotel_name'] ?? hData['title'] ?? 'فندق بدون عنوان',
                'mainImage': hData['mainImage'] ?? '',
              };
            } else {
              hotelSummary = {
                'title': 'الفندق غير موجود',
                'mainImage': '',
              };
            }
          } catch (e) {
            hotelSummary = {
              'title': 'الفندق غير موجود',
              'mainImage': '',
            };
          }
        } else {
          hotelSummary = {
            'title': 'معرف الفندق مفقود',
            'mainImage': '',
          };
        }

        enrichedReports.add({
          'id': doc.id,
          'item_type': 'hotel',
          'collection': 'hotel_reports',
          ...reportData,
          'property_title': hotelSummary['title'],
          'property_main_image': hotelSummary['mainImage'],
        });
      }

      // ترتيب حسب التاريخ من الأحدث للأقدم
      enrichedReports.sort((a, b) {
        final aDate = a['reported_at'] as Timestamp?;
        final bDate = b['reported_at'] as Timestamp?;
        if (aDate == null && bDate == null) return 0;
        if (aDate == null) return 1;
        if (bDate == null) return -1;
        return bDate.compareTo(aDate);
      });

      reports.assignAll(enrichedReports);
      applyFilters();
    } catch (e) {
      log("e code : ${e}");
      showSnackBar('خطأ', 'فشل تحميل التقارير : $e');
    } finally {
      isLoading.value = false;
    }
  }

  // ---------- تحميل أسباب الإبلاغ ----------
  Future<void> loadReportReasons() async {
    try {
      final snap = await _firestore.collection('report_reasons').get();
      reportReasons.assignAll(
        snap.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList(),
      );
    } catch (e) {
      showSnackBar('خطأ', 'فشل تحميل أسباب الإبلاغ');
    }
  }

  // ---------- جلب بيانات العقار أو الفندق ----------
  Future<Map<String, dynamic>?> fetchProperty(String itemId, String itemType) async {
    try {
      final collection = itemType == 'hotel' ? 'hotels' : 'properties';
      final doc = await _firestore.collection(collection).doc(itemId).get();
      if (doc.exists) {
        return {'id': doc.id, ...doc.data()!};
      }
      return null;
    } catch (e) {
      showSnackBar('خطأ', 'فشل جلب البيانات');
      return null;
    }
  }

  // ---------- إغلاق التقرير ----------
  Future<void> closeReport(String reportId, String collection) async {
    try {
      await _firestore.collection(collection).doc(reportId).update({
        'status': 'closed',
      });
      await loadReports(); // تحديث القائمة
      showSnackBar('تم', 'تم إغلاق التقرير', backgroundColor: Colors.green);
    } catch (e) {
      showSnackBar('خطأ', 'فشل إغلاق التقرير');
    }
  }
}