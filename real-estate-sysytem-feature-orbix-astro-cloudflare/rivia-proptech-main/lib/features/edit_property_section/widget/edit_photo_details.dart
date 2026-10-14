import 'dart:developer';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:real_estate_app/core/widgets/section_container.dart';
import 'package:real_estate_app/features/capture_photo_section/view/capture_view.dart';
import 'package:real_estate_app/features/edit_property_section/controller/edit_property_controller.dart';
import 'package:real_estate_app/features/panorama_tour_viewer_section/view/panorama_viewer_screen.dart';

class EditPhotoDetails extends StatelessWidget {
  const EditPhotoDetails({super.key});

  @override
  Widget build(BuildContext context) {
    final ctr = Get.find<EditPropertyController>();
    final Color primaryBlue = const Color(0xFF3C83F6);

    return SectionContainer(
      title: "صور العقار",
      subtitle: "قم بتعديل الصور — الصورة الأولى هي الصورة الأساسية",
      color: primaryBlue,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          // ===== عنوان =====
          Text("صور العقار", style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),

          // ===== Grid الصور القديمة + الجديدة =====
          Obx(
            () => GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: ctr.existingImageUrls.length + ctr.newImages.length + 1,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.0,
              ),
              itemBuilder: (context, index) {
                final existingCount = ctr.existingImageUrls.length;

                // زر الإضافة
                if (index == existingCount + ctr.newImages.length) {
                  return GestureDetector(
                    onTap: () async {
                      final picked = await ImagePicker().pickImage(source: ImageSource.gallery);

                      if (picked != null) ctr.addNewImage(File(picked.path));
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.add_circle_outline, size: 42),
                          SizedBox(height: 6),
                          Text("إضافة صورة"),
                        ],
                      ),
                    ),
                  );
                }

                // صور قديمة من URL
                if (index < existingCount) {
                  final url = ctr.existingImageUrls[index];
                  return Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Image.network(
                          url,
                          fit: BoxFit.cover,
                          width: double.infinity,
                          height: double.infinity,
                        ),
                      ),
                      Positioned(
                        top: 6,
                        left: 6,
                        child: GestureDetector(
                          onTap: () => ctr.removeExistingImageAt(index),
                          child: Container(
                            padding: const EdgeInsets.all(5),
                            decoration: BoxDecoration(color: Colors.red.shade600, shape: BoxShape.circle),
                            child: const Icon(Icons.close, size: 16, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  );
                }

                // صور جديدة
                final newIndex = index - existingCount;
                final file = ctr.newImages[newIndex];

                return Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: Image.file(
                        file,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        height: double.infinity,
                      ),
                    ),
                    Positioned(
                      top: 6,
                      left: 6,
                      child: GestureDetector(
                        onTap: () => ctr.removeNewImageAt(newIndex),
                        child: Container(
                          padding: const EdgeInsets.all(5),
                          decoration: BoxDecoration(color: Colors.red.shade600, shape: BoxShape.circle),
                          child: const Icon(Icons.close, size: 16, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),

          const SizedBox(height: 20),

          // ======================================================
          //               🔵 Panorama Tour Section
          // ======================================================

          Obx(() {
            final tour = ctr.panoramaTour.value;

            if (tour == null) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("جولة بانوراما: لا توجد جولة", style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.upload_file),
                    label: const Text("إنشاء / رفع جولة"),
                    onPressed: () async {
                      final result = await Get.to(() => CaptureView());

                      if (result != null && result is Map<String, dynamic>) {
                        ctr.panoramaTour.value = result;
                      }
                    },
                  ),
                ],
              );
            }

            final images = tour['images'] ?? [];

            if (images.isEmpty) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("جولة بانوراما: لا توجد صور", style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.upload_file),
                    label: const Text("تعديل الجولة"),
                    onPressed: () async {
                      final result = await Get.to(() => CaptureView(initialTour: tour));
                      if (result != null) ctr.panoramaTour.value = result;
                    },
                  ),
                ],
              );
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("جولة بانوراما — ${images.length} مشاهد",
                    style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),

                // الصور
                SizedBox(
                  height: 110,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: images.length,
                    itemBuilder: (ctx, i) {
                      final img = images[i];
                      final name = img['name'] ?? 'غرفة ${i + 1}';

                      final isNetwork = img.containsKey('url');
                      final imgSrc = isNetwork ? img['url'] : img['path'];

                      return Container(
                        width: 110,
                        margin: const EdgeInsets.only(right: 12),
                        child: GestureDetector(
                          onTap: () => Get.to(() =>
                              PanoramaViewerScreen(panoramas: images, startIndex: i)),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Stack(
                              children: [
                                isNetwork
                                    ? Image.network(imgSrc, width: 110, height: 110, fit: BoxFit.cover)
                                    : Image.file(File(imgSrc), width: 110, height: 110, fit: BoxFit.cover),

                                Positioned(
                                  bottom: 0,
                                  child: Container(
                                    width: 110,
                                    color: Colors.black.withOpacity(0.45),
                                    padding: const EdgeInsets.symmetric(vertical: 4),
                                    child: Text(
                                      name,
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(color: Colors.white),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),

                const SizedBox(height: 8),

                // أزرار تعديل وحذف
                Row(
                  children: [
                    ElevatedButton.icon(
                      icon: const Icon(Icons.edit),
                      label: const Text("تعديل الجولة"),
                      onPressed: () async {
                        final result = await Get.to(() => CaptureView(initialTour: tour));
                        if (result != null) ctr.panoramaTour.value = result;

                        log("panorama result: ${result}");
                      },
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton.icon(
                      icon: const Icon(Icons.delete_forever),
                      label: const Text("حذف الجولة"),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
                      onPressed: () async {
                        ctr.panoramaTour.value = null;
                      },
                    ),
                  ],
                ),
              ],
            );
          }),
        ],
      ),
    );
  }
}
