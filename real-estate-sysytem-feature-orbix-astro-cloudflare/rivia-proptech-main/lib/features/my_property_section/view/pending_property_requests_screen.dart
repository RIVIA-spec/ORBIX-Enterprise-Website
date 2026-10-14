// lib/features/user/my_property/view/pending_property_requests_screen.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/features/my_property_section/controller/pending_property_requests_controller.dart';
import 'package:real_estate_app/features/my_property_section/widget/compact_property_request_card.dart';

class PendingPropertyRequestsScreen extends StatelessWidget {
  const PendingPropertyRequestsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ctrl = Get.put(PendingPropertyRequestsController());

    return Scaffold(
      appBar: CustomAppBar(title: "طلبات النشر المعلقة"),
      body: Obx(() {
        if (ctrl.isLoading.value) {
          return const LoadingDiscreteCircular();
        }

        if (ctrl.requests.isEmpty) {
          return RefreshIndicator(
            onRefresh: ctrl.refreshData,
            child: SingleChildScrollView(
              physics : AlwaysScrollableScrollPhysics(),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.hourglass_empty, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    "لا توجد طلبات نشر معلقة",
                    style: TextStyle(color: Colors.grey[600], fontSize: 16),
                  ),
                ],
              ),
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: ctrl.refreshData,
          child: 
          ListView.builder(
            padding: const EdgeInsets.only(top: 8, bottom: 80),
            itemCount: ctrl.requests.length,
            itemBuilder: (context, index) {
              return CompactPropertyRequestCard(request: ctrl.requests[index]);
            },
          ),
        );
      }),

      // زر إضافة طلب جديد
      floatingActionButton: CustomButton(
        text: "إضافة طلب جديد",
        leadingIcon: Icons.add_home,
        backgroundColor: Colors.blue,
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        onPressed: () {
          Get.toNamed('/add-property-request'); // أو أي مسار
        },
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }
}