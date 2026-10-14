import 'dart:io';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:real_estate_app/core/widgets/section_container.dart';
import 'package:real_estate_app/features/add_property_section/controller/add_proprety_controller.dart';
import 'package:real_estate_app/features/capture_photo_section/view/capture_view.dart';
import 'package:real_estate_app/features/panorama_tour_viewer_section/view/panorama_viewer_screen.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class PropertyPhotos extends StatelessWidget {
  const PropertyPhotos({super.key});

  @override
  Widget build(BuildContext context) {
    final AddPropretyController addPropertyCtr = Get.find<AddPropretyController>();
    final Color primaryBlue = const Color(0xFF3C83F6);

    return SectionContainer(
      title: "صور العقار",
      subtitle: "حمل صور للعقار ويجب أن تكون الصورة الاولى هي الصورة الرئيسية",
      color: primaryBlue,
      child: Column(
        children: [
          // ---------------------- صور العقار ----------------------
          Obx(
            () => GridView.builder(
              shrinkWrap: true,
              physics: NeverScrollableScrollPhysics(),
              itemCount: addPropertyCtr.images.length + 1,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemBuilder: (context, index) {
                // زر الإضافة
                if (index == addPropertyCtr.images.length) {
                  return GestureDetector(
                    onTap: () async {
                      final pickedFile = await ImagePicker().pickImage(source: ImageSource.gallery);
                      if (pickedFile != null) {
                        addPropertyCtr.images.add(File(pickedFile.path));
                      }
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.grey.shade300),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.grey.withOpacity(0.15),
                            blurRadius: 6,
                            offset: Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_circle_outline, size: 42, color: primaryBlue),
                          SizedBox(height: 6),
                          Text(
                            "إضافة صورة",
                            style: GoogleFonts.cairo(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                              color: Colors.grey[700],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                // عرض الصور المختارة
                return Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: Image.file(
                        addPropertyCtr.images[index],
                        fit: BoxFit.cover,
                        width: double.infinity,
                        height: double.infinity,
                      ),
                    ),

                    // زر الحذف
                    Positioned(
                      top: 6,
                      left: 6,
                      child: GestureDetector(
                        onTap: () => addPropertyCtr.images.removeAt(index),
                        child: Container(
                          padding: const EdgeInsets.all(5),
                          decoration: BoxDecoration(
                            color: Colors.red.shade600,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.35),
                                blurRadius: 5,
                              ),
                            ],
                          ),
                          child: Icon(Icons.close, size: 16, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),

          SizedBox(height: 16),

          // ---------------------- زر تحميل صور الجولة ----------------------
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: primaryBlue, width: 1.4),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                padding: EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: () async {
                if(addPropertyCtr.panoramaTour.value != null && 
                  addPropertyCtr.panoramaTour.value!.isNotEmpty){
                    final result = await Get.to(
                      () => CaptureView(initialTour: addPropertyCtr.panoramaTour.value),
                    );
                    if (result != null) {
                      addPropertyCtr.panoramaTour.value = result;
                    }
                }
                else
                {
                  final result = await Get.to(() => CaptureView());

                  if (result is Map<String, dynamic> && result['images'] != null) {
                    addPropertyCtr.panoramaTour.value = result;
                    showSnackBar("تم", "تم إنشاء جولة 360 بنجاح!", backgroundColor: Colors.green);
                  }
                }
              },
              child: Text(
                addPropertyCtr.panoramaTour.value == null
                    ? "تحميل صور الجولة البانورامية"
                    : "تم إنشاء الجولة (اضغط للتعديل)",
                style: GoogleFonts.cairo(
                  color: addPropertyCtr.panoramaTour.value == null ? primaryBlue : Colors.green.shade700,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ),
          ),

          SizedBox(height: 20),

          // ---------------------- بطاقة جولة 360 ----------------------
          Obx(
            () => addPropertyCtr.panoramaTour.value == null
                ? SizedBox.shrink()
                : Container(
                    padding: EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: primaryBlue.withOpacity(0.4)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.blueGrey.withOpacity(0.1),
                          blurRadius: 10,
                          offset: Offset(0, 4),
                        )
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // header row
                        Row(
                          children: [
                            Container(
                              padding: EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: primaryBlue.withOpacity(0.15),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(Icons.vrpano, color: primaryBlue, size: 26),
                            ),
                            SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                "جولة بانوراما 360°",
                                style: GoogleFonts.cairo(
                                  fontSize: 17,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black87,
                                ),
                              ),
                            ),
                            Text(
                              "${addPropertyCtr.panoramaTour.value!['images'].length} غرفة",
                              style: GoogleFonts.cairo(
                                color: primaryBlue,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),

                        SizedBox(height: 16),

                        // preview images
                        SizedBox(
                          height: 110,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: addPropertyCtr.panoramaTour.value!['images'].length,
                            itemBuilder: (ctx, i) {
                              final imgData = addPropertyCtr.panoramaTour.value!['images'][i];
                              final path = imgData['path'] as String;
                              final name = imgData['name'] ?? 'غرفة ${i + 1}';

                              return Container(
                                width: 110,
                                margin: EdgeInsets.only(right: 12),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.grey.shade300),
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Stack(
                                    children: [
                                      Image.file(File(path), fit: BoxFit.cover, width: 110, height: 110),
                                      Positioned(
                                        bottom: 0,
                                        child: Container(
                                          width: 110,
                                          padding: EdgeInsets.symmetric(vertical: 4),
                                          color: Colors.black.withOpacity(0.45),
                                          child: Text(
                                            name,
                                            style: GoogleFonts.cairo(
                                              color: Colors.white,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                            ),
                                            textAlign: TextAlign.center,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),

                        SizedBox(height: 18),

                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            // معاينة
                            ElevatedButton.icon(
                              icon: Icon(Icons.visibility, size: 18),
                              label: Text("معاينة"),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: primaryBlue,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                              ),
                              onPressed: () {
                                Get.to(() => PanoramaViewerScreen(
                                  panoramas: addPropertyCtr.panoramaTour.value!['images'],
                                  startIndex: 0,
                                ));
                              },
                            ),

                            // تعديل النقاط
                            ElevatedButton.icon(
                              icon: Icon(Icons.edit, size: 18),
                              label: Text("تعديل النقاط"),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.orange.shade700,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                padding: EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                              ),
                              onPressed: () async {
                                final result = await Get.to(
                                  () => CaptureView(initialTour: addPropertyCtr.panoramaTour.value),
                                );
                                if (result != null) {
                                  addPropertyCtr.panoramaTour.value = result;
                                }
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
