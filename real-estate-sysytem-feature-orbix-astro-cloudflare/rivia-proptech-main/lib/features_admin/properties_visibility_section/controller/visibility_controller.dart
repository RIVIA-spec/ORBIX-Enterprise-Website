// lib/features/admin/visibility/controller/visibility_controller.dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/mappers/property_mapper.dart';

class VisibilityController extends GetxController {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  var properties = <Map<String, dynamic>>[].obs;
  var filteredProperties = <Map<String, dynamic>>[].obs;
  var isLoading = false.obs;
  var searchQuery = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadProperties();
  }

  void loadProperties() async {
    try {
      isLoading.value = true;
      final snap = await _firestore.collection('properties').get();

      final List<Map<String, dynamic>> data = snap.docs.map((doc) {
        return normalizePropertyMap(doc.data(), id: doc.id);
      }).toList();

      properties.assignAll(data);
      filteredProperties.assignAll(data);
    } catch (e) {
      showSnackBar('خطأ', 'فشل تحميل العقارات');
    } finally {
      isLoading.value = false;
    }
  }

  void search(String query) {
    searchQuery.value = query;
    if (query.isEmpty) {
      filteredProperties.assignAll(properties);
      return;
    }

    final lowerQuery = query.toLowerCase();
    filteredProperties.assignAll(properties.where((p) {
      final id = p['id']?.toString().toLowerCase() ?? '';
      final title = p['title']?.toString().toLowerCase() ?? '';
      return id.contains(lowerQuery) || title.contains(lowerQuery);
    }).toList());
  }

  Future<void> toggleVisibility(String docId, bool currentValue) async {
    try {
      await _firestore.collection('properties').doc(docId).update({
        'isVisible': !currentValue,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      final index = properties.indexWhere((p) => p['id'] == docId);
      if (index != -1) {
        properties[index]['isVisible'] = !currentValue;
        properties.refresh();
        search(searchQuery.value); // تحديث الفلترة
      }
    } catch (e) {
      showSnackBar('خطأ', 'فشل تحديث الرؤية');
    }
  }
}
