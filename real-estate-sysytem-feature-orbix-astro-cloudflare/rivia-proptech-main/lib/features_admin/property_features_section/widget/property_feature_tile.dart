// lib/features/features/widget/feature_tile.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import '../controller/property_features_controller.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';

class FeatureTile extends StatelessWidget {
  final String feature;
  final PropertyFeaturesController controller;

  const FeatureTile({required this.feature, required this.controller, super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: ListTile(
        title: Text(
          feature,
          style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit, color: Colors.blueAccent),
              onPressed: () {
                _showEditDialog(feature);
              },
            ),
            IconButton(
              icon: const Icon(Icons.delete, color: Colors.red),
              onPressed: () {
                Get.dialog(
                  AlertDialog(
                    title: const Text("تأكيد الحذف"),
                    content: Text("هل تريد حذف الميزة \"$feature\"؟"),
                    actions: [
                      TextButton(onPressed: () => safeBack(), child: const Text("إلغاء")),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                        onPressed: () {
                          safeBack();
                          controller.deleteFeature(feature);
                        },
                        child: const Text("حذف", style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showEditDialog(String oldTitle) {
    final TextEditingController editCtrl = TextEditingController(text: oldTitle);

    Get.dialog(
      AlertDialog(
        title: Text("تعديل الميزة", style: GoogleFonts.cairo()),
        content: TextField(
          controller: editCtrl,
          decoration: const InputDecoration(hintText: "اسم الميزة الجديد"),
        ),
        actions: [
          TextButton(onPressed: () => safeBack(), child: const Text("إلغاء")),
          ElevatedButton(
            onPressed: () {
              final newTitle = editCtrl.text.trim();
              if (newTitle.isNotEmpty && newTitle != oldTitle) {
                controller.updateFeature(oldTitle, newTitle);
              }
              safeBack();
            },
            child: const Text("حفظ"),
          ),
        ],
      ),
    );
  }
}