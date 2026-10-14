// features/capture_photo_section/view/capture_view.dart

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/features/capture_photo_section/controller/capture_controller.dart';
import 'package:real_estate_app/features/panorama_hotspot_editor_section/view/panorama_hotspot_editor_screen.dart';
import 'package:real_estate_app/features/panorama_tour_viewer_section/view/panorama_viewer_screen.dart';

class CaptureView extends StatelessWidget {
  final Map<String, dynamic>? initialTour;

  const CaptureView({Key? key, this.initialTour}) : super(key: key);

  // // دالة تجميع البيانات النهائية للجولة
  // Map<String, dynamic> _buildTourData(CaptureController controller) {
  //   return {
  //     'id': initialTour?['id'] ?? DateTime.now().millisecondsSinceEpoch,
  //     'title': initialTour?['title'] ?? 'جولة 360° جديدة',
  //     'createdAt': initialTour?['createdAt'] ?? DateTime.now().toIso8601String(),
  //     'panoramas': controller.panoramas.toList(), // نسخة آمنة
  //   };
  // }

  void safeBack({dynamic result}) {
    if (Get.isSnackbarOpen) {
      Get.closeCurrentSnackbar();
    }
    if (Navigator.canPop(Get.context!)) {
      Navigator.of(Get.context!).pop(result);
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(CaptureController());

    // تحميل البيانات القديمة إذا كنا في وضع التعديل
    if (initialTour != null && controller.panoramas.isEmpty) {
      controller.loadTourFromMap(initialTour!);
    }

    // دالة الرجوع الآمن مع إرجاع البيانات
    // void safeBackAndReturn() {
    //   final tourData = _buildTourData(controller);
    //   safeBack(result: tourData); // ← هنا المهم: ترجع البيانات!
    // }

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: CustomAppBar(
        title: initialTour == null ? 'إنشاء جولة 360°' : 'تعديل الجولة',
        onBack: () {
          if(controller.panoramas.isNotEmpty) {
            controller.saveAndReturnTour();
          }
          else {
            safeBack();
          }
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: controller.pickPanoramaImageFromGallery,
        icon: const Icon(Icons.add_a_photo_rounded),
        label: const Text("إضافة صورة"),
        backgroundColor: const Color(0xFF3C83F6),
        foregroundColor: Colors.white,
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFF8FAFF), Color(0xFFE8F0FE)],
          ),
        ),
        child: Obx(() {
          if (controller.panoramas.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.panorama, size: 90, color: Colors.grey[400]),
                  const SizedBox(height: 24),
                  Text("لم تتم إضافة أي صور بعد", style: TextStyle(fontSize: 18, color: Colors.grey[700])),
                  const SizedBox(height: 12),
                  Text("اضغط على الزر أدناه للبدء", style: TextStyle(color: Colors.grey[600])),
                ],
              ),
            );
          }
      
          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 120, 16, 100),
            itemCount: controller.panoramas.length,
            itemBuilder: (context, index) {
              final panorama = controller.panoramas[index];
              final name = panorama['name'] ?? 'غرفة ${index + 1}';
      
              return Card(
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                margin: const EdgeInsets.symmetric(vertical: 8),
                child: ListTile(
                  onTap: () => Get.to(() => PanoramaViewerScreen(
                    startIndex: index,
                    panoramas: controller.panoramas,
                  )),
                  leading: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: panorama['isNetwork'] == true ?
                    Image.network(panorama['path'], width: 70, height: 70, fit: BoxFit.cover) :
                    Image.file(File(panorama['path']), width: 70, height: 70, fit: BoxFit.cover),
                  ),
                  title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text("النقاط الساخنة: ${(panorama['buttons'] as List).length}"),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit_outlined, color: Colors.blue),
                        onPressed: () async {
                          final result = await Get.to<List<Map<String, dynamic>>>(
                            () => PanoramaHotspotEditor(
                              image: panorama['isNetwork'] == true ?
                              Image.network(panorama['path'])
                                : Image.file(File(panorama['path'])),
                              index: index,
                              total: controller.panoramas.length,
                              existingButtons: List.from(panorama['buttons']),
                            ),
                          );
                          if (result != null) controller.updateHotspots(index, result);
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, color: Colors.red),
                        onPressed: () => controller.removePanorama(index),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        }),
      ),

      // زر "تم" في الـ AppBar
      // persistentFooterButtons: [
      //   SizedBox(
      //     width: double.infinity,
      //     child: Padding(
      //       padding: const EdgeInsets.symmetric(horizontal: 20),
      //       child: ElevatedButton(
      //         style: ElevatedButton.styleFrom(
      //           backgroundColor: const Color(0xFF3C83F6),
      //           padding: const EdgeInsets.symmetric(vertical: 16),
      //           shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      //         ),
      //         onPressed: () {
      //           final tourData = _buildTourData(controller);
      //           if (controller.panoramas.isEmpty) {
      //             showSnackBar("تنبيه", "يجب إضافة صورة واحدة على الأقل", backgroundColor: Colors.orange);
      //             return;
      //           }
      //           controller.saveAndReturnTour();
      //         },
      //         child: const Text("حفظ الجولة وإنهاء", style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
      //       ),
      //     ),
      //   ),
      // ],
    );
  }
}