// lib/features/admin/users/controller/admin_users_controller.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';

class AdminUsersController extends GetxController {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  var users = <Map<String, dynamic>>[].obs;
  var userIds = <String>[].obs;
  var filteredUsers = <Map<String, dynamic>>[].obs;
  var filteredUserIds = <String>[].obs;
  var isLoading = false.obs;

  // خريطة لتتبع حالة التحميل لكل مستخدم (uid → isLoading)
  final Map<String, RxBool> _loadingStates = {};

  final searchController = TextEditingController();
  var searchQuery = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadUsers();
    searchController.addListener(() => search(searchController.text));
  }

  @override
  void onClose() {
    searchController.dispose();
    super.onClose();
  }

  // دالة للحصول على حالة التحميل لمستخدم معين
  RxBool getLoadingState(String uid) {
    return _loadingStates.putIfAbsent(uid, () => false.obs);
  }

  Future<void> loadUsers() async {
    try {
      isLoading.value = true;
      final snapshot = await _firestore
          .collection('users')
          .orderBy('created_at', descending: true)
          .get();

      final List<Map<String, dynamic>> userList = [];
      final List<String> ids = [];

      for (final doc in snapshot.docs) {
        final data = doc.data();
        if (data['role'] == "owner") continue;
        data['uid'] = doc.id;
        userList.add(data);
        ids.add(doc.id);
      }

      users.assignAll(userList);
      userIds.assignAll(ids);
      filteredUsers.assignAll(userList);
      filteredUserIds.assignAll(ids);
    } catch (e) {
      showSnackBar("خطأ", "فشل تحميل المستخدمين", backgroundColor: Colors.red);
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> toggleActive(String uid, bool newValue) async {
    final loading = getLoadingState(uid);
    loading.value = true;

    try {
      final user = users.firstWhere((u) => u['uid'] == uid);
      final currentReason = user['deactivation_reason'] as String?;

      dynamic result;

      if (newValue) {
        // === حالة التفعيل: نعرض Bottom Sheet مع السبب السابق إن وجد ===
        result = await Get.bottomSheet<dynamic>(
          backgroundColor: Colors.white,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          isScrollControlled: true,
          Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(Get.context!).viewInsets.bottom + 20,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "تفعيل الحساب",
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black87),
                ),
                const SizedBox(height: 16),
                const Text("هل أنت متأكد من تفعيل هذا الحساب؟", style: TextStyle(fontSize: 15)),
                const SizedBox(height: 20),

                // معلومات المستخدم
                _buildInfoRow('اسم المستخدم', user['username']),
                _buildInfoRow('الإيميل', user['email']),
                _buildInfoRow('التحقق من الهوية', user['isVerified'] == true ? 'نعم' : 'لا'),
                _buildInfoRow(
                  'تاريخ الإنشاء',
                  user['created_at'] != null
                      ? (user['created_at'] as Timestamp).toDate().toString().split('.').first
                      : 'غير معروف',
                ),

                // عرض سبب الإلغاء السابق إن وجد
                if (currentReason != null && currentReason.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      border: Border.all(color: Colors.red.shade200),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.info_outline, color: Colors.red, size: 20),
                            SizedBox(width: 8),
                            Text("سبب إلغاء التفعيل السابق:", style: TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          currentReason,
                          style: TextStyle(color: Colors.red.shade800, fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 24),

                // أزرار التحكم
                Row(
                  children: [
                    Expanded(
                      child: CustomButton(
                        text: "رجوع",
                        onPressed: () => safeBack(result: null),
                        isOutlined: true,
                        height: 50,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: CustomButton(
                        text: "تفعيل الحساب",
                        isOutlined: true,
                        height: 50,
                        onPressed: () => safeBack(result: true),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      } else {
        // === حالة إلغاء التفعيل: نطلب سبب جديد ===
        result = await _showDeactivationReasonDialog(user);
      }

      // إلغاء العملية من المستخدم
      if (result == null) {
        loading.value = false;
        return;
      }

      // تحضير البيانات للتحديث
      final updateData = <String, dynamic>{'isActive': newValue};

      if (newValue) {
        // تفعيل → حذف السبب
        updateData['deactivation_reason'] = FieldValue.delete();
      } else {
        // إلغاء تفعيل → حفظ السبب الجديد
        final String reason = result as String;
        updateData['deactivation_reason'] = reason.trim();
      }

      // تحديث Firestore
      await _firestore.collection('users').doc(uid).update(updateData);

      // تحديث محلي فوري
      final index = userIds.indexOf(uid);
      if (index != -1) {
        users[index]['isActive'] = newValue;
        if (newValue) {
          users[index].remove('deactivation_reason');
        } else {
          users[index]['deactivation_reason'] = newValue ? null : result;
        }
        users.refresh();
      }

      showSnackBar(
        newValue ? "تم التفعيل" : "تم إلغاء التفعيل",
        newValue
            ? "أصبح الحساب مفعلاً الآن"
            : "تم إلغاء تفعيل الحساب بنجاح",
        backgroundColor: Colors.green,
        colorText: Colors.white,
        duration: const Duration(seconds: 4),
      );
    } catch (e) {
      showSnackBar("فشل", "حدث خطأ أثناء العملية: $e", backgroundColor: Colors.red);
    } finally {
      loading.value = false;
    }
  }

  Future<String?> _showDeactivationReasonDialog(Map<String, dynamic> user) async {
    final controller = TextEditingController();
    return await Get.bottomSheet<String?>(
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      isScrollControlled: true,
      Container(
        height: Get.height * 0.5,
        padding: EdgeInsets.only(
          left: 20, right: 20, top: 20,
          bottom: MediaQuery.of(Get.context!).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("إلغاء تفعيل الحساب", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            _buildInfoRow('اسم المستخدم', user['username']),
            _buildInfoRow('الإيميل', user['email']),
            const SizedBox(height: 20),
            CustomTextFormField(
              controller: controller,
              hint: "اكتب سبب إلغاء التفعيل...",
              maxLines: 3,
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(child: CustomButton(text: "إلغاء", onPressed: () => safeBack(result: null), isOutlined: true)),
                const SizedBox(width: 12),
                Expanded(
                  child: CustomButton(
                    text: "تأكيد الإلغاء",
                    backgroundColor: Colors.red,
                    onPressed: () {
                      final text = controller.text.trim();
                      if (text.isEmpty) {
                        showSnackBar("مطلوب", "يرجى كتابة السبب", backgroundColor: Colors.orange);
                        return;
                      }
                      safeBack(result: text);
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String? value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: RichText(
        text: TextSpan(
          style: const TextStyle(color: Colors.black87, fontSize: 15),
          children: [
            TextSpan(text: "$label: ", style: const TextStyle(fontWeight: FontWeight.w600)),
            TextSpan(text: value ?? "غير محدد"),
          ],
        ),
      ),
    );
  }

  void search(String query) {
    searchQuery.value = query.trim();

    if (query.isEmpty) {
      filteredUsers.assignAll(users);
      filteredUserIds.assignAll(userIds);
      return;
    }

    final lowerQuery = query.toLowerCase();
    final List<Map<String, dynamic>> filtered = [];
    final List<String> filteredIds = [];

    for (int i = 0; i < users.length; i++) {
      final u = users[i];
      final username = u['username']?.toString().toLowerCase() ?? '';
      final email = u['email']?.toString().toLowerCase() ?? '';

      if (username.contains(lowerQuery) || email.contains(lowerQuery)) {
        filtered.add(u);
        filteredIds.add(userIds[i]);
      }
    }

    filteredUsers.assignAll(filtered);
    filteredUserIds.assignAll(filteredIds);
  }
}