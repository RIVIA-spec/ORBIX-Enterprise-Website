// lib/features/features/controller/features_controller.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../services/property_features_service.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class PropertyFeaturesController extends GetxController {
  final FeaturesService _service = FeaturesService();
  final RxList<String> features = <String>[].obs;
  final RxBool isLoading = true.obs;

  @override
  void onInit() {
    super.onInit();
    loadFeatures();
  }

  Future<void> loadFeatures() async {
    try {
      isLoading(true);
      final data = await _service.getAllFeatures();
      features.assignAll(data);
    } catch (e) {
      showSnackBar("خطأ", "فشل تحميل المميزات: $e");
    } finally {
      isLoading(false);
    }
  }

  Future<void> addFeature(String title) async {
    if (title.trim().isEmpty) {
      showSnackBar("خطأ", "يرجى كتابة اسم الميزة");
      return;
    }
    try {
      await _service.addFeature(title);
      await loadFeatures();
      showSnackBar("تم", "تمت الإضافة بنجاح", backgroundColor: Colors.green.shade100);
    } catch (e) {
      showSnackBar("خطأ", e.toString());
    }
  }

  Future<void> updateFeature(String oldTitle, String newTitle) async {
    if (newTitle.trim().isEmpty) {
      showSnackBar("خطأ", "اسم الميزة لا يمكن أن يكون فارغًا");
      return;
    }
    try {
      await _service.updateFeature(oldTitle, newTitle);
      await loadFeatures();
      showSnackBar("تم", "تم التعديل بنجاح");
    } catch (e) {
      showSnackBar("خطأ", e.toString());
    }
  }

  Future<void> deleteFeature(String title) async {
    try {
      await _service.deleteFeature(title);
      await loadFeatures();
      showSnackBar("تم", "تم الحذف بنجاح");
    } catch (e) {
      showSnackBar("خطأ", e.toString());
    }
  }

}