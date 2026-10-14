// lib/features_admin/admin_users/controller/add_admin_controller.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class AddAdminController extends GetxController {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  var users = <Map<String, dynamic>>[].obs;
  var userIds = <String>[].obs;

  var filteredUsers = <Map<String, dynamic>>[].obs;
  var filteredUserIds = <String>[].obs;

  var isLoading = false.obs;

  final searchController = TextEditingController();
  var searchQuery = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadUsers();
    searchController.addListener(() {
      search(searchController.text);
    });
  }

  @override
  void onClose() {
    searchController.dispose();
    super.onClose();
  }

  // ========= تحميل المستخدمين =========
  Future<void> loadUsers() async {
    try {
      isLoading.value = true;

      final snapshot = await _firestore.collection('users').get();

      final List<Map<String, dynamic>> tempUsers = [];
      final List<String> tempIds = [];

      for (final doc in snapshot.docs) {
        // اقرأ بيانات المستند كما هي — لا تضف أو تغيّر حقل role هنا
        final data = doc.data() as Map<String, dynamic>;
        data['id'] = doc.id;
        if(data['role'] == "owner") {
          continue;
        }
        tempUsers.add(Map<String, dynamic>.from(data));
        tempIds.add(doc.id);
      }

      users.assignAll(tempUsers);
      userIds.assignAll(tempIds);

      filteredUsers.assignAll(tempUsers);
      filteredUserIds.assignAll(tempIds);
    } catch (e) {
      showSnackBar(
        "خطأ",
        "فشل تحميل المستخدمين: $e",
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    } finally {
      isLoading.value = false;
    }
  }

  // ========= البحث =========
  void search(String query) {
    searchQuery.value = query.trim();

    if (query.isEmpty) {
      filteredUsers.assignAll(users);
      filteredUserIds.assignAll(userIds);
      return;
    }

    final q = query.toLowerCase();
    final List<Map<String, dynamic>> filtered = [];
    final List<String> filteredIds = [];

    for (int i = 0; i < users.length; i++) {
      final u = users[i];

      final username = u['username']?.toString().toLowerCase() ?? '';
      final email = u['email']?.toString().toLowerCase() ?? '';

      if (username.contains(q) || email.contains(q)) {
        filtered.add(u);
        filteredIds.add(userIds[i]);
      }
    }

    filteredUsers.assignAll(filtered);
    filteredUserIds.assignAll(filteredIds);
  }

  // ========= تعيين المستخدم كـ Admin (مع تحديث محلي سريع) =========
  Future<void> makeAdmin(String userId) async {

    try {
      await _firestore.collection('users').doc(userId).update({
        'role': 'admin',
      });

      loadUsers();
    } catch (e) {

      showSnackBar(
        "خطأ",
        "فشل تعيين المشرف: $e",
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    }
  }

  // ========= إزالة المشرف (حذف حقل role) مع تحديث محلي =========
  Future<void> removeAdmin(String userId) async {
    try {
      await _firestore.collection('users').doc(userId).update({
        'role': FieldValue.delete(),
      });
      
      loadUsers();
    } catch (e) {
      showSnackBar(
        "خطأ",
        "فشل إزالة المشرف: $e",
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    }
  }

  // ===== بديل بسيط: إعادة تحميل كامل القائمة بعد التعديل =====
  // إذا رغبت بالحل الأسهل (يعيد كل البيانات من السيرفر بدلاً من تحديث محلي):
  Future<void> refreshAfterChange() async {
    await loadUsers();
  }
}
