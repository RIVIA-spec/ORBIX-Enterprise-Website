// lib/features_admin/admin_users/screens/user_admin_screen.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/no_data_with_refresh_indicator.dart';
import 'package:real_estate_app/features_admin/add_admin_section/widget/user_card.dart';
import '../controller/add_admin_controller.dart';

class AddAdminScreen extends StatelessWidget {
  const AddAdminScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(AddAdminController());

    return Scaffold(
      appBar: CustomAppBar(title: "إدارة المستخدمين"),
      body: Column(
        children: [
          // ================== شريط البحث ==================
          Container(
            width: Get.width * 0.92,
            margin: const EdgeInsets.symmetric(vertical: 10),
            child: CustomTextFormField(
              controller: controller.searchController,
              hint: "ابحث بالاسم أو البريد...",
              prefixIcon: const Icon(Icons.search),
              onChanged: controller.search,
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

          // ================== قائمة المستخدمين ==================
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value) {
                return LoadingDiscreteCircular();
              }

              if (controller.filteredUsers.isEmpty) {
                return NoDataWithRefreshIndicator(
                  noDataText: controller.searchQuery.value.isEmpty
                      ? "لا يوجد مستخدمون"
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
                    final String userId = controller.filteredUserIds[index];

                    return UserCard(
                      user: user,
                      userId: userId,
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
