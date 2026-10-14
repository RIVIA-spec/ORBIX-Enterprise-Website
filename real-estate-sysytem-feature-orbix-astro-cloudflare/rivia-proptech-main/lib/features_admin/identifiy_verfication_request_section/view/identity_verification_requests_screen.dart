// identity_verification_requests_screen.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/core/widgets/image_preview_widget.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/no_data_with_refresh_indicator.dart';
import 'package:real_estate_app/features_admin/identifiy_verfication_request_section/controller/identity_verification_request_controller.dart';
import 'package:real_estate_app/features_admin/identifiy_verfication_request_section/widget/show_rejection_dialog.dart';

class IdentityVerificationRequestsScreen extends StatelessWidget {
  const IdentityVerificationRequestsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ctrl = Get.put(IdentityVerificationRequestController());

    return Scaffold(
      appBar: CustomAppBar(title: "طلبات التحقق من الهوية"),
      body: Obx(() {
        if (ctrl.isLoading.value) {
          return const LoadingDiscreteCircular();
        }
        if (ctrl.requests.isEmpty) {
          return NoDataWithRefreshIndicator(
            noDataText: "لا توجد طلبات تحقق معلقة", onRefresh: () {
              ctrl.listenToPendingVerifications();
            }
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(12),
          itemCount: ctrl.requests.length,
          itemBuilder: (context, index) {
            final req = ctrl.requests[index];

            return Card(
              margin: const EdgeInsets.symmetric(vertical: 8),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("المستخدم: ${req['name']}", style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text("البريد: ${req['email']}"),
                    const SizedBox(height: 8),

                    // صور الهوية مع تكبير
                    Row(
                      children: [
                        Expanded(child: ImagePreviewWidget(imageUrl: req['frontIdUrl'])),
                        const SizedBox(width: 8),
                        Expanded(child: ImagePreviewWidget(imageUrl: req['backIdUrl'])),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // أزرار مخصصة
                    Row(
                      children: [
                        Expanded(
                          child: CustomButton(
                            text: "موافقة",
                            leadingIcon: Icons.check,
                            padding: EdgeInsets.symmetric(horizontal: 0, vertical: 5),
                            foregroundColor: Colors.green,
                            onPressed: () => ctrl.approve(req['id'], req['userId']),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: CustomButton(
                            text: "رفض",
                            padding: EdgeInsets.symmetric(horizontal: 0, vertical: 5),
                            leadingIcon: Icons.close,
                            onPressed: () => showRejectionDialog(context, ctrl, req['id']),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      }),
    );
  }
}