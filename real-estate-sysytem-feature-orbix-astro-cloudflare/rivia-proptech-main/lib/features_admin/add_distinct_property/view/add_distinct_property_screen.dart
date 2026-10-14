// lib/features/properties/screens/properties_list_screen.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/no_data_with_refresh_indicator.dart';
import 'package:real_estate_app/features_admin/add_distinct_property/controller/add_distinct_controller.dart';
import 'package:real_estate_app/features_admin/add_distinct_property/widget/distinct_property_card.dart';

class AddDistinctPropertyScreen extends StatelessWidget {
  const AddDistinctPropertyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(AddDistinctController());

    return Scaffold(
      appBar: CustomAppBar(title: "إضافة عقار/فندق مميز"),
      body: Column(
        children: [
          // === حقل البحث ===
          // === شريط البحث ===
          // === حقل البحث ===
          Container(
            width: Get.width * 0.92,
            margin: const EdgeInsets.symmetric(vertical: 10),
            child: CustomTextFormField(
              controller: controller.searchController, // ← مهم جدًا
              hint: "ابحث بالمعرف أو العنوان...",
              prefixIcon: const Icon(Icons.search),
              onChanged: (value) {
                controller.search(value); // ← يُستدعى تلقائيًا
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

          // === قائمة العقارات ===
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value) {
                return LoadingDiscreteCircular();
              }

              if (controller.filteredProperties.isEmpty) {
                return NoDataWithRefreshIndicator(
                  noDataText: controller.searchQuery.value.isEmpty
                      ? "لا توجد عقارات أو فنادق بعد"
                      : "لا توجد نتائج لـ \"${controller.searchQuery.value}\"",
                  onRefresh: controller.loadAllItems,
                );
              }

              if (controller.properties.isEmpty) {
                return NoDataWithRefreshIndicator(
                  noDataText: "لا توجد عقارات أو فنادق بعد", 
                  onRefresh: () {
                    controller.loadAllItems();
                  }
                );
              }

              return RefreshIndicator(
                onRefresh: controller.loadAllItems,
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: controller.filteredProperties.length,
                  itemBuilder: (context, index) {
                    final property = controller.filteredProperties[index];
                    final docId = controller.filteredPropertyIds[index];
                    final itemType = controller.filteredItemTypes[index];
                    final isLoadingStar = false.obs;

                    return Obx(() => DistinctPropertyCard(
                      property: property,
                      docId: docId,
                      itemType: itemType,
                      isLoadingStar: isLoadingStar.value,
                      onToggleDistinct: (docId, itemType, value) async {
                        isLoadingStar.value = true;
                        await controller.toggleDistinct(docId, itemType, value);
                        isLoadingStar.value = false;
                      },
                    ));
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