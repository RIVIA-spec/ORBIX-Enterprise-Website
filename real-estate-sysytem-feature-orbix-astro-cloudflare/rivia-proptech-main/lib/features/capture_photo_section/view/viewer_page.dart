// =============================================
// FILE: viewer_page.dart (محدثة وتعمل 100%)
// =============================================
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:panorama_viewer/panorama_viewer.dart';
import 'package:real_estate_app/features/capture_photo_section/controller/capture_controller.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';

class ViewerPage extends StatelessWidget {
  final int startIndex;

  const ViewerPage({Key? key, required this.startIndex}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<CaptureController>();

    // حالة البانوراما الحالية
    return Obx(() {
      // إذا كانت القائمة فارغة
      if (controller.panoramas.isEmpty) {
        return Scaffold(
          appBar: AppBar(title: const Text('عرض الجولة')),
          body: const Center(child: Text('لا توجد صور في الجولة')),
        );
      }

      // الحصول على البانوراما الحالية
      final currentPanorama = controller.panoramas[startIndex.clamp(0, controller.panoramas.length - 1)];
      final String imagePath = currentPanorama['path'] as String;
      final List buttons = currentPanorama['buttons'] as List;

      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black54,
          title: Text(
            'الجولة الافتراضية • ${startIndex + 1} من ${controller.panoramas.length}',
            style: const TextStyle(color: Colors.white),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.close, color: Colors.white),
              onPressed: () => safeBack(),
            ),
          ],
        ),
        body: PanoramaViewer(
          sensorControl: SensorControl.none, // يعمل تمامًا مع panorama_viewer
          animSpeed: 2.0,
          child: Image.file(File(imagePath)),
          hotspots: buttons.map((button) {
            // كل زر إما next أو prev
            final Map<String, dynamic> nextData = button['next'] as Map<String, dynamic>? ?? {};
            final Map<String, dynamic> prevData = button['prev'] as Map<String, dynamic>? ?? {};

            final targetData = nextData.isNotEmpty ? nextData : prevData;
            final int? targetIndex = nextData.isNotEmpty
                ? (startIndex + 1 < controller.panoramas.length ? startIndex + 1 : null)
                : (startIndex - 1 >= 0 ? startIndex - 1 : null);

            if (targetIndex == null) return null; // لا نعرض زر إذا لا يوجد وجهة

            return Hotspot(
              latitude: double.parse(targetData['lat'] ?? '0'),
              longitude: double.parse(targetData['long'] ?? '0'),
              width: 100,
              height: 100,
              widget: GestureDetector(
                onTap: () {
                  // الانتقال إلى البانوراما التالية/السابقة
                  Get.off(
                    () => ViewerPage(startIndex: targetIndex),
                    transition: Transition.fadeIn,
                    duration: const Duration(milliseconds: 600),
                  );
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.9),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black45,
                        blurRadius: 10,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Icon(
                    nextData.isNotEmpty ? Icons.arrow_forward : Icons.arrow_back,
                    color: nextData.isNotEmpty ? Colors.orange : Colors.deepPurple,
                    size: 40,
                  ),
                ),
              ),
            );
          }).whereType<Hotspot>().toList(),
        ),
      );
    });
  }
}