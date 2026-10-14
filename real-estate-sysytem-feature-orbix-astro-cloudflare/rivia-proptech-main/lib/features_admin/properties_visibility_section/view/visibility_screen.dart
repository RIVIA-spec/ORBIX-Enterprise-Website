// lib/features/admin/visibility/view/visibility_screen.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/no_data_with_refresh_indicator.dart';
import 'package:real_estate_app/features_admin/properties_visibility_section/controller/visibility_controller.dart';
import 'package:real_estate_app/features_admin/properties_visibility_section/widget/visibility_property_card.dart';

class VisibilityScreen extends StatelessWidget {
  const VisibilityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final visibiltyCtr = Get.put(VisibilityController());

    return Scaffold(
      appBar: CustomAppBar(title: "إدارة رؤية العقارات"),
      body: Column(
        children: [
          // === شريط البحث ===
          Container(
            width: Get.width * 0.92,
            margin: EdgeInsets.symmetric(vertical: 10),
            child: CustomTextFormField(hint: "ابحث بالمعرف أو العنوان...",
              prefixIcon: const Icon(Icons.search),
              onChanged: visibiltyCtr.search,
            ),
          ),

          // === القائمة ===
          Expanded(
            child: Obx(() {
              if (visibiltyCtr.isLoading.value) {
                return LoadingDiscreteCircular();
              }

              if (visibiltyCtr.filteredProperties.isEmpty) {
                return NoDataWithRefreshIndicator(
                  noDataText: "لا توجد عقارات بعد", 
                  onRefresh: () {
                    visibiltyCtr.loadProperties();
                  },
                );
              }

              return RefreshIndicator(
                onRefresh: () async {
                    visibiltyCtr.loadProperties();
                  },
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: visibiltyCtr.filteredProperties.length,
                  itemBuilder: (context, index) {
                    final prop = visibiltyCtr.filteredProperties[index];
                    final docId = prop['id'] as String;
                    final isLoadingIcon = false.obs;
                
                    return Obx(
                      () => VisibilityPropertyCard(
                        property: prop,
                        docId: docId,
                        isLoading: isLoadingIcon.value,
                        onToggleVisibility: (id, current) async {
                          // تحديث محلي فوري
                          isLoadingIcon.value = true;
                          final idx = visibiltyCtr.properties.indexWhere((p) => p['id'] == id);
                          if (idx != -1) {
                            visibiltyCtr.properties[idx]['isVisible'] = !current;
                            visibiltyCtr.properties.refresh();
                            visibiltyCtr.search(visibiltyCtr.searchQuery.value);
                          }
                          // تحديث في Firestore
                          await visibiltyCtr.toggleVisibility(id, current);
                          isLoadingIcon.value = false;
                        },
                      ),
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