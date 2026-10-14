// lib/features/features/view/features_screen.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/no_data_with_refresh_indicator.dart';
import '../controller/property_features_controller.dart';
import '../widget/property_feature_tile.dart';
import '../widget/show_add_feature_bottom_sheet.dart';

class PropertyFeaturesScreen extends StatelessWidget {
  final PropertyFeaturesController featureCtr = Get.put(PropertyFeaturesController());

  PropertyFeaturesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: CustomAppBar(
          title: "المميزات",
          // backgroundColor: Colors.blueAccent,
        ),
        body: Obx(() {
          if (featureCtr.isLoading.value) {
            return const LoadingDiscreteCircular();
          }
          if (featureCtr.features.isEmpty) {
            return NoDataWithRefreshIndicator(
              noDataText: "لا توجد مميزات بعد",
              onRefresh: featureCtr.loadFeatures,
            );
          }

          return RefreshIndicator(
            onRefresh: featureCtr.loadFeatures,
            child: Container(
              margin: EdgeInsets.only(top: 20),
              child: ListView.builder(
                itemCount: featureCtr.features.length,
                itemBuilder: (context, index) {
                  final feature = featureCtr.features[index];
                  return FeatureTile(feature: feature, controller: featureCtr);
                },
              ),
            ),
          );
        }),
        floatingActionButton: FloatingActionButton(
          backgroundColor: Colors.blueAccent,
          child: const Icon(Icons.add, color: Colors.white),
          onPressed: () {
            showAddFeatureBottomSheet(controller: featureCtr);
          },
        ),
      ),
    );
  }
}