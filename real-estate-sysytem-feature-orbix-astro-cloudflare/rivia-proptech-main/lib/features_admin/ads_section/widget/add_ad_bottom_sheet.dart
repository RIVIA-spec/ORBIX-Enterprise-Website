// lib/features_admin/ads/widget/add_ad_bottom_sheet.dart

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import '../controller/ads_managment_controller.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class AddAdBottomSheet extends StatelessWidget {
  const AddAdBottomSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<AdsManagmentController>();

    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Center(
            child: Text(
              'إضافة إعلان جديد',
              style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 24),

          // منطقة اختيار الصورة
          GestureDetector(
            onTap: () async {
              final picker = ImagePicker();
              final picked = await picker.pickImage(
                source: ImageSource.gallery,
                imageQuality: 85,
              );
              if (picked != null) {
                controller.tempSelectedImage.value = File(picked.path);
              }
            },
            child: Obx(() => Container(
                  width: double.infinity,
                  height: 200,
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey.shade400, width: 2),
                    borderRadius: BorderRadius.circular(16),
                    color: Colors.grey[100],
                  ),
                  child: controller.tempSelectedImage.value != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: Image.file(
                            controller.tempSelectedImage.value!,
                            fit: BoxFit.cover,
                          ),
                        )
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_photo_alternate_outlined, size: 60, color: Colors.grey[600]),
                            const SizedBox(height: 12),
                            Text(
                              'اضغط لاختيار صورة من المعرض',
                              style: GoogleFonts.cairo(color: Colors.grey[700], fontSize: 16),
                            ),
                          ],
                        ),
                )),
          ),

          const SizedBox(height: 24),

          // حقل الرابط
          Row(
            children: [
              const Icon(Icons.link, color: Colors.blueAccent),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  onChanged: (value) => controller.tempLink.value = value.trim(),
                  decoration: InputDecoration(
                    labelText: 'رابط الإعلان (اختياري)',
                    hintText: 'https://example.com',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  keyboardType: TextInputType.url,
                ),
              ),
            ],
          ),

          const SizedBox(height: 32),

          // زر الإضافة
          Obx(() => CustomButton(
                  text: "إضافة الإعلان",
                  backgroundColor: Colors.blueAccent,
                  foregroundColor: Colors.white,
                  isLoading: controller.tempIsUploading,
                  width: double.infinity,
                  onPressed: controller.tempSelectedImage.value == null
                      ? null
                      : () async {
                          controller.tempIsUploading.value = true;
                          try {
                            await controller.uploadNewAd(
                              imageFile: controller.tempSelectedImage.value!,
                              link: controller.tempLink.value,
                            );
                            safeBack();
                            controller.clearTempAdData(); // تنظيف بعد النجاح
                          } catch (e) {
                            showSnackBar('خطأ', 'فشل إضافة الإعلان',
                                backgroundColor: Colors.red, colorText: Colors.white);
                          } finally {
                            controller.tempIsUploading.value = false;
                          }
                        },
                ),
          ),

          const SizedBox(height: 8),
        ],
      ),
    );
  }
}