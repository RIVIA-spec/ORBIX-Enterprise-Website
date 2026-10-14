

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/features_admin/identifiy_verfication_request_section/controller/identity_verification_request_controller.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';

void showRejectionDialog(
    BuildContext context, IdentityVerificationRequestController ctrl, String verifId) {
  final reasonCtrl = TextEditingController();
  RxBool isLoading = false.obs;

  Get.bottomSheet(
    Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text("سبب الرفض", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          TextField(
            controller: reasonCtrl,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: "أدخل سبب الرفض...",
              border: OutlineInputBorder(),
              filled: true,
              fillColor: Color(0xFFF5F5F5),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: CustomButton(
                  text: "إلغاء",
                  backgroundColor: Colors.green,
                  onPressed: () => safeBack(),
                  isLoading: isLoading,
                  padding: EdgeInsets.symmetric(horizontal: 5),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: Get.width * 0.6,
                child: CustomButton(
                  text: "تأكيد الرفض",
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                  isLoading: isLoading,
                  onPressed: () {
                    isLoading.value = true;
                    ctrl.reject(verifId, reasonCtrl.text.trim());
                    isLoading.value = false;
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
      ),
    ),
    isScrollControlled: true,
    enableDrag: true,
  );
}