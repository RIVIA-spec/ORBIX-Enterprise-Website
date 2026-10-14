import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/features/identify_section/widget/id_image_card.dart';
import '../controller/identity_controller.dart';
import '../widget/id_upload_card.dart';
import '../widget/id_status_card.dart';

class IdentityVerificationScreen extends StatelessWidget {
  IdentityVerificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final IdentityController identifyCtr = Get.put(IdentityController());

    return Scaffold(
      appBar: CustomAppBar(title: "التحقق من الهوية"),
      body: Obx(() {
        final status = identifyCtr.verificationStatus.value;
        final canSubmit = identifyCtr.canSubmitNewRequest.value;
        final frontUrl = identifyCtr.frontIdUrl.value;
        final backUrl = identifyCtr.backIdUrl.value;

        if (identifyCtr.isLoading.value) {
          return Center(
            child: LoadingDiscreteCircular(margin: EdgeInsets.only(top: Get.height * 0.3)),
          );
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // === 1. عرض الحالة دائمًا ===
              IdStatusCard(ctrl: identifyCtr),
              const SizedBox(height: 32),

              // === 2. عرض الصور إذا كان pending أو verified ===
              if (status == 'pending' || status == 'verified') ...[
                IdImageCard(title: "صورة الهوية (الوجه الأمامي)", imageUrl: frontUrl),
                const SizedBox(height: 16),
                IdImageCard(title: "صورة الهوية (الوجه الخلفي)", imageUrl: backUrl),
                const SizedBox(height: 32),
              ]

              // === 3. النموذج: فقط إذا كان null أو rejected ===
              else if (canSubmit) ...[
                IdUploadCard(
                  title: "صورة الهوية (الوجه الأمامي)",
                  image: identifyCtr.frontImage,
                  canSubmit: identifyCtr.canSubmitNewRequest.value,
                  onPick: () async {
                    final picker = ImagePicker();
                    final picked = await picker.pickImage(source: ImageSource.gallery);
                    if (picked != null) {
                      identifyCtr.frontImage.value = File(picked.path);
                    }
                  },
                ),
                const SizedBox(height: 16),
                IdUploadCard(
                  title: "صورة الهوية (الوجه الخلفي)",
                  image: identifyCtr.backImage,
                  canSubmit: identifyCtr.canSubmitNewRequest.value,
                  onPick: () async {
                    final picker = ImagePicker();
                    final picked = await picker.pickImage(source: ImageSource.gallery);
                    if (picked != null) {
                      identifyCtr.backImage.value = File(picked.path);
                    }
                  },
                ),
                const SizedBox(height: 32),
                CustomButton(
                  text: "إرسال الطلب",
                  onPressed: identifyCtr.isUploading.value ? null : identifyCtr.submitVerification,
                  isLoading: identifyCtr.isUploading,
                  backgroundColor: Colors.blue[700],
                  foregroundColor: Colors.white,
                  height: 56,
                  width: double.infinity,
                  borderRadius: 16,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ]

              // === 4. سبب الرفض + زر إعادة تقديم ===
              else if (status == 'rejected') ...[
                if (identifyCtr.rejectionReason.value != null)
                  Card(
                    color: Colors.red[50],
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 2,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Text(
                            "سبب الرفض:",
                            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red[800], fontSize: 16),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            identifyCtr.rejectionReason.value!,
                            style: TextStyle(color: Colors.red[700], fontSize: 14),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 24),
                OutlinedButton(
                  onPressed: identifyCtr.resetForm,
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: Colors.blue[700]!),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text("إعادة تقديم الطلب", style: TextStyle(color: Colors.blue[700], fontWeight: FontWeight.w600)),
                ),
              ],
            ],
          ),
        );
      }),
    );
  }
}