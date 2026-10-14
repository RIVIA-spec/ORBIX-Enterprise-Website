// lib/features/property_categories/controller/property_categories_controller.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../services/property_categories_service.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';

class PropertyCategoriesController extends GetxController {
  final PropertyCategoriesService _service = PropertyCategoriesService();
  final RxList<Map<String, dynamic>> categories = <Map<String, dynamic>>[].obs;
  final RxBool isLoading = true.obs;

  @override
  void onInit() {
    super.onInit();
    loadCategories();
  }

  Future<void> loadCategories() async {
    try {
      isLoading(true);
      final data = await _service.getAllCategoriesOnce();
      categories.assignAll(data);
    } catch (e) {
      showSnackBar("خطأ", "فشل تحميل الفئات: $e");
    } finally {
      isLoading(false);
    }
  }

  Future<void> addCategory(String title) async {
    if (title.trim().isEmpty) {
      showSnackBar("خطأ", "يرجى كتابة اسم الفئة");
      return;
    }
    try {
      await _service.addCategory(title);
      await loadCategories();
      showSnackBar("تم", "تمت الإضافة بنجاح", backgroundColor: Colors.green.shade100);
    } catch (e) {
      showSnackBar("خطأ", e.toString());
    }
  }

  Future<void> updateCategory(String id, String newTitle) async {
    if (newTitle.trim().isEmpty) return;
    try {
      await _service.updateCategory(id, newTitle);
      await loadCategories();
      showSnackBar("تم", "تم التعديل بنجاح");
    } catch (e) {
      showSnackBar("خطأ", e.toString());
    }
  }

  Future<void> deleteCategory(String id) async {
    try {
      await _service.deleteCategory(id);
      await loadCategories();
      showSnackBar("تم", "تم الحذف بنجاح");
    } catch (e) {
      showSnackBar("خطأ", e.toString());
    }
  }

  Future<void> resetDefaultCategories() async {
    Get.dialog(
      AlertDialog(
        title: const Text("تأكيد إعادة التعيين"),
        content: const Text("هل تريد حذف جميع الفئات وإعادة الافتراضية؟"),
        actions: [
          TextButton(onPressed: () => safeBack(), child: const Text("إلغاء")),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              safeBack();
              try {
                await _service.seedDefaultCategories();
                await loadCategories();
                showSnackBar("تم", "تم إعادة تعيين الفئات بنجاح");
              } catch (e) {
                showSnackBar("خطأ", "فشل إعادة التعيين: $e");
              }
            },
            child: const Text("تأكيد"),
          ),
        ],
      ),
    );
  }
}