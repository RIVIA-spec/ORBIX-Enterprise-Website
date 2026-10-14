// lib/features/property_categories/view/property_categories_screen.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/no_data_with_refresh_indicator.dart';
import '../controller/property_categories_controller.dart';
import '../widget/property_category_tile.dart';
import '../widget/show_add_category_bottom_sheet.dart';

class PropertyCategoriesScreen extends StatelessWidget {
  final PropertyCategoriesController categoryCtr = Get.put(PropertyCategoriesController());

  PropertyCategoriesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: CustomAppBar(
          title: "فئات العقارات",
          // backgroundColor: Colors.blueAccent,
        ),
        body: Obx(() {
          if (categoryCtr.isLoading.value) {
            return const LoadingDiscreteCircular();
          }
          if (categoryCtr.categories.isEmpty) {
            return NoDataWithRefreshIndicator(
              noDataText: "لا توجد فئات بعد",
              onRefresh: categoryCtr.loadCategories,
            );
          }

          return RefreshIndicator(
            onRefresh: categoryCtr.loadCategories,
            child: ListView.builder(
              itemCount: categoryCtr.categories.length,
              itemBuilder: (context, index) {
                final cat = categoryCtr.categories[index];
                return PropertyCategoryTile(category: cat, controller: categoryCtr);
              },
            ),
          );
        }),
        floatingActionButton: FloatingActionButton(
          backgroundColor: Colors.blueAccent,
          child: const Icon(Icons.add, color: Colors.white),
          onPressed: () {
            showAddCategoryBottomSheet(controller: categoryCtr);
          },
        ),
      ),
    );
  }
}