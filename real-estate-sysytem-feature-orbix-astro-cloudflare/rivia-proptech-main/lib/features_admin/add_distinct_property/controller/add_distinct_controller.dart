// lib/features/properties/controllers/properties_controller.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/mappers/property_mapper.dart';

class AddDistinctController extends GetxController {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  var properties = <Map<String, dynamic>>[].obs;
  var propertyIds = <String>[].obs;
  var itemTypes = <String>[].obs; // 'property' or 'hotel'
  var filteredProperties = <Map<String, dynamic>>[].obs;
  var filteredPropertyIds = <String>[].obs;
  var filteredItemTypes = <String>[].obs;
  var isLoading = false.obs;

  final searchController = TextEditingController();
  var searchQuery = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadAllItems();
    searchController.addListener(() {
      search(searchController.text);
    });
  }

  @override
  void onClose() {
    searchController.dispose();
    super.onClose();
  }

  Future<void> loadAllItems() async {
    try {
      isLoading.value = true;

      // جلب العقارات
      final propertiesSnapshot =
          await _firestore.collection('properties').get();

      // جلب الفنادق
      final hotelsSnapshot = await _firestore
          .collection('hotels')
          .orderBy('created_at', descending: true)
          .get();

      final List<Map<String, dynamic>> allItems = [];
      final List<String> allIds = [];
      final List<String> allTypes = [];

      // إضافة العقارات
      for (final doc in propertiesSnapshot.docs) {
        final data = normalizePropertyMap(doc.data(), id: doc.id);
        data['id'] = doc.id;
        allItems.add(data);
        allIds.add(doc.id);
        allTypes.add('property');
      }

      // إضافة الفنادق
      for (final doc in hotelsSnapshot.docs) {
        final data = doc.data();
        data['id'] = doc.id;
        allItems.add(data);
        allIds.add(doc.id);
        allTypes.add('hotel');
      }

      // ترتيب حسب created_at من الأحدث للأقدم
      final List<Map<String, dynamic>> sortedItems = [];
      final List<String> sortedIds = [];
      final List<String> sortedTypes = [];

      // إنشاء قائمة مؤقتة مع التاريخ
      final List<Map<String, dynamic>> itemsWithDate = [];
      for (int i = 0; i < allItems.length; i++) {
        itemsWithDate.add({
          'item': allItems[i],
          'id': allIds[i],
          'type': allTypes[i],
          'created_at': allItems[i]['createdAt'] ?? allItems[i]['created_at'],
        });
      }

      // ترتيب حسب created_at
      itemsWithDate.sort((a, b) {
        final aDate = a['created_at'];
        final bDate = b['created_at'];
        if (aDate == null && bDate == null) return 0;
        if (aDate == null) return 1;
        if (bDate == null) return -1;
        if (aDate is Timestamp && bDate is Timestamp) {
          return bDate.compareTo(aDate);
        }
        return bDate.toString().compareTo(aDate.toString()); // الأحدث أولاً
      });

      // استخراج البيانات المرتبة
      for (final item in itemsWithDate) {
        sortedItems.add(item['item'] as Map<String, dynamic>);
        sortedIds.add(item['id'] as String);
        sortedTypes.add(item['type'] as String);
      }

      properties.assignAll(sortedItems);
      propertyIds.assignAll(sortedIds);
      itemTypes.assignAll(sortedTypes);
      filteredProperties.assignAll(sortedItems);
      filteredPropertyIds.assignAll(sortedIds);
      filteredItemTypes.assignAll(sortedTypes);
    } catch (e) {
      showSnackBar("خطأ", "فشل تحميل البيانات: $e",
          backgroundColor: Colors.red, colorText: Colors.white);
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> toggleDistinct(
      String docId, String itemType, bool newValue) async {
    try {
      final collection = itemType == 'hotel' ? 'hotels' : 'properties';
      await _firestore
          .collection(collection)
          .doc(docId)
          .update(itemType == 'hotel'
              ? {'isDistinct': newValue}
              : {
                  'isFeatured': newValue,
                  'featured': newValue,
                  'updatedAt': FieldValue.serverTimestamp(),
                });

      // تحديث محلي
      final index = propertyIds.indexOf(docId);
      if (index != -1) {
        properties[index]['isDistinct'] = newValue;
        properties.refresh();
      }

      // showSnackBar(
      //   newValue ? "تم التمييز" : "تم إلغاء التمييز",
      //   newValue ? "أصبح ${itemType == 'hotel' ? 'الفندق' : 'العقار'} مميزًا" : "تم إزالته من المميزات",
      //   backgroundColor: newValue ? Colors.amber : Colors.grey,
      //   colorText: Colors.white,
      // );
    } catch (e) {
      showSnackBar("خطأ", "فشل تحديث التمييز: $e",
          backgroundColor: Colors.red, colorText: Colors.white);
    }
  }

  void search(String query) {
    searchQuery.value = query.trim();

    if (query.isEmpty) {
      filteredProperties.assignAll(properties);
      filteredPropertyIds.assignAll(propertyIds);
      filteredItemTypes.assignAll(itemTypes);
      return;
    }

    final lowerQuery = query.toLowerCase();
    final List<Map<String, dynamic>> filtered = [];
    final List<String> filteredIds = [];
    final List<String> filteredTypes = [];

    for (int i = 0; i < properties.length; i++) {
      final p = properties[i];
      final id = p['id']?.toString().toLowerCase() ?? '';
      final title = p['title']?.toString().toLowerCase() ?? '';

      if (id.contains(lowerQuery) || title.contains(lowerQuery)) {
        filtered.add(p);
        filteredIds.add(propertyIds[i]);
        filteredTypes.add(itemTypes[i]);
      }
    }

    filteredProperties.assignAll(filtered);
    filteredPropertyIds.assignAll(filteredIds);
    filteredItemTypes.assignAll(filteredTypes);
  }
}
