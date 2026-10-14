// lib/features/user/my_property/view/my_property_screen.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/proprty_card.dart';
import 'package:real_estate_app/features/add_property_section/view/add_property_screen.dart';
import 'package:real_estate_app/features/my_property_section/controller/my_property_controller.dart';
import 'package:real_estate_app/features/my_property_section/view/pending_property_requests_screen.dart';
import 'package:real_estate_app/features/my_property_section/widget/my_property_card.dart';
import 'package:real_estate_app/features/my_property_section/widget/pending_requests_header.dart';
import 'package:real_estate_app/features/property_details_section/widget/price_and_booking.dart';

class MyPropertyScreen extends StatelessWidget {
  const MyPropertyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ctrl = Get.put(MyPropertyController());

    return Scaffold(
      appBar: CustomAppBar(title: "عقاراتي"),
      body: Obx(() {
        if (ctrl.isLoading.value) {
          return const LoadingDiscreteCircular();
        }

        return RefreshIndicator(
          onRefresh: ctrl.refreshData,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              children: [
                // === الطلبات المعلقة ===
                if (ctrl.pendingCount.value > 0)
                  PendingRequestsHeader(
                    count: ctrl.pendingCount.value,
                    onTap: () {
                      Get.to(() => const PendingPropertyRequestsScreen());
                    },
                  ),

                // === العقارات المعتمدة ===
                if (ctrl.properties.isEmpty)
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Text(
                        "لا توجد عقارات منشورة بعد",
                        style: TextStyle(color: Colors.grey[600], fontSize: 16),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  )
                else
                  // استخدم نفس PropertyCard الموجودة في الصفحة الرئيسية
                  ...ctrl.properties.map((prop) => Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: MyPropertyCard(property: prop),
                      )),

                const SizedBox(height: 100), // مساحة للزر السفلي
              ],
            ),
          ),
        );
      }),

      // === زر إضافة عقار جديد ===
      floatingActionButton: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Colors.blue.shade600,
              Colors.blue.shade800,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: CustomButton(
          text: "إضافة عقار جديد",
          leadingIcon: Icons.add_home,
          backgroundColor: Colors.transparent, // سيتم استخدام التدرج
          foregroundColor: Colors.white,
          width: double.infinity,
          height: 60,
          padding: const EdgeInsets.symmetric(horizontal: 0),
          onPressed: () {
            Get.to(() => AddPropertyScreen());
          },
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }
}
