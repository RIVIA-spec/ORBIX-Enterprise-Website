// lib/features/admin/pending_properties/view/admin_pending_property_requests_screen.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import '../controller/admin_pending_property_controller.dart';
import '../widget/admin_pending_property_card.dart';

class AdminPendingPropertyRequestsScreen extends StatelessWidget {
  const AdminPendingPropertyRequestsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ctrl = Get.put(AdminPendingPropertyController());

    return Scaffold(
      appBar: CustomAppBar(title: "طلبات نشر العقارات المعلقة"),
      body: Obx(() {
        if (ctrl.isLoading.value) return const LoadingDiscreteCircular();
        if (ctrl.requests.isEmpty) {
          return RefreshIndicator(
            onRefresh: () async {
              ctrl.loadPendingRequests();
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: Get.height, // يجعل الصفحة بنفس طول الشاشة → scoll يعمل حتى لو المحتوى قليل
                width: Get.width,
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.event_available,
                          size: 80, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        "لا توجد طلبات نشر عقارات معلقة",
                        style: GoogleFonts.cairo(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.only(bottom: 20),
          itemCount: ctrl.requests.length,
          itemBuilder: (context, i) => AdminPendingPropertyCard(request: ctrl.requests[i], ctrl: ctrl),
        );
      }),
    );
  }
}