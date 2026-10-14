// lib/features/admin/users/screens/admin_users_screen.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/widgets/custom_input_field.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/no_data_with_refresh_indicator.dart';
import 'package:real_estate_app/features_admin/admin_users_section/controller/admin_users_controller.dart';
import 'package:real_estate_app/features_admin/admin_users_section/widget/admin_user_card.dart';

class AdminUsersScreen extends StatelessWidget {
  const AdminUsersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(AdminUsersController());

    // استقبال الـ arguments فور تحميل الشاشة
    ever(controller.isLoading, (bool loading) {
      if (!loading) {
        final args = Get.arguments;
        if (args != null && args is Map && args['search_email'] != null) {
          final String email = args['search_email'].toString().trim();
          
          // نضع الإيميل في شريط البحث
          controller.searchController.text = email;
          controller.searchQuery.value = email;

          // نبحث فورًا
          controller.search(email);

          // نُظهر رسالة توضيحية (اختياري)
          if (controller.filteredUsers.isEmpty) {
            Future.delayed(const Duration(milliseconds: 300), () {
              showSnackBar(
                "غير موجود",
                "لم يتم العثور على مستخدم بالبريد: $email",
                backgroundColor: Colors.orange.shade700,
                duration: const Duration(seconds: 4),
              );
            });
          }
        }
      }
    });

    return Scaffold(
      appBar: CustomAppBar(title: "إدارة المستخدمين"),
      body: Column(
        children: [
          // === شريط البحث ===
          Container(
            width: Get.width * 0.92,
            margin: const EdgeInsets.symmetric(vertical: 10),
            child: CustomTextFormField(
              controller: controller.searchController,
              hint: "ابحث بالاسم أو الإيميل...",
              prefixIcon: const Icon(Icons.search),
              onChanged: (value) {
                controller.search(value);
              },
              suffixIcon: Obx(() => controller.searchQuery.value.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        controller.searchController.clear();
                        controller.search('');
                        FocusScope.of(context).unfocus();
                      },
                    )
                  : const SizedBox.shrink()),
            ),
          ),

          // === قائمة المستخدمين ===
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value) {
                return LoadingDiscreteCircular();
              }

              if (controller.filteredUsers.isEmpty) {
                return NoDataWithRefreshIndicator(
                  noDataText: controller.searchQuery.value.isEmpty
                      ? "لا توجد مستخدمين بعد"
                      : "لا توجد نتائج لـ \"${controller.searchQuery.value}\"",
                  onRefresh: controller.loadUsers,
                );
              }

              return RefreshIndicator(
                onRefresh: controller.loadUsers,
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: controller.filteredUsers.length,
                  itemBuilder: (context, index) {
                    final user = controller.filteredUsers[index];
                    final uid = controller.filteredUserIds[index];

                    return AdminUserCard(
                      user: user,
                      uid: uid,
                      isLoadingToggle: controller.getLoadingState(uid).value,
                      onToggleActive: (uid, value) async {
                        await controller.toggleActive(uid, value);
                      },
                    );
                  },
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}