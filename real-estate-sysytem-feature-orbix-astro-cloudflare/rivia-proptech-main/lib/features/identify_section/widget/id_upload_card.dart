import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import '../controller/identity_controller.dart';

class IdUploadCard extends StatelessWidget {
  final String title;
  final Rxn<File> image;
  final VoidCallback onPick;
  final bool canSubmit;

  const IdUploadCard({
    super.key,
    required this.title,
    required this.image,
    required this.onPick,
    required this.canSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 12),
            Obx(() => Container(
                  height: 200,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey.shade200),
                    borderRadius: BorderRadius.circular(16),
                    color: Colors.grey.shade50,
                  ),
                  child: image.value == null
                      ? const Center(
                          child: Icon(Icons.camera_alt_outlined, size: 64, color: Colors.grey),
                        )
                      : ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.file(image.value!, fit: BoxFit.cover),
                        ),
                )),
            const SizedBox(height: 16),
            if (canSubmit)
              Center(
                child: ElevatedButton.icon(
                  onPressed: onPick,
                  icon: const Icon(Icons.upload_file_outlined),
                  label: Text(image.value == null ? "رفع صورة" : "تغيير الصورة"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue[700],
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    elevation: 2,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}