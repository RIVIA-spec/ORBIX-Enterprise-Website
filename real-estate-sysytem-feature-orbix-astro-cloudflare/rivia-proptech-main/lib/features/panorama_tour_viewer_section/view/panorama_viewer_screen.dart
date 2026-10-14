// lib/features/panorama_tour_viewer/view/panorama_tour_viewer.dart

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:panorama_viewer/panorama_viewer.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class PanoramaViewerScreen extends StatelessWidget {
  final int startIndex;
  final List panoramas; // ← حدد النوع بوضوح

  const PanoramaViewerScreen({
    Key? key,
    required this.panoramas,
    this.startIndex = 0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final totalImages = panoramas.length;
    final RxInt currentIndex = startIndex.obs;

    if (totalImages == 0) {
      return Scaffold(
        appBar: AppBar(title: const Text('الجولة الافتراضية')),
        body: const Center(child: Text('لا توجد صور في الجولة')),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black54,
        title: Obx(() => Text(
              panoramas[currentIndex.value]['name'] ??
                  'غرفة ${currentIndex.value + 1}',
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18),
            )),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.close, color: Colors.white),
            onPressed: () => Get.back(closeOverlays: true),
          ),
        ],
      ),
      body: Obx(() {
        final currentPanorama = panoramas[currentIndex.value];
        final buttons =
            List<Map<String, dynamic>>.from(currentPanorama['buttons'] ?? []);

        // تحديد نوع الصورة: محلية أو من الإنترنت
        final String? localPath = currentPanorama['path'] as String?;
        final String? networkUrl = currentPanorama['url'] as String? ;
        final bool? isNetwork = currentPanorama['isNetwork'];

        Widget imageWidget;

        if(isNetwork == true){
          imageWidget = Image.network(
            currentPanorama['path'],
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child;
              return const Center(
                child: CircularProgressIndicator(
                    color: Colors.cyan, strokeWidth: 3),
              );
            },
            errorBuilder: (context, error, stackTrace) {
              return const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.error, color: Colors.red, size: 60),
                    SizedBox(height: 16),
                    Text("فشل تحميل الصورة",
                        style: TextStyle(color: Colors.white)),
                  ],
                ),
              );
            },
          );
        }
        else if (networkUrl != null && networkUrl.isNotEmpty) {
          // صورة من الإنترنت (الأدمن أو الزائر)
          imageWidget = Image.network(
            networkUrl,
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child;
              return const Center(
                child: CircularProgressIndicator(
                    color: Colors.cyan, strokeWidth: 3),
              );
            },
            errorBuilder: (context, error, stackTrace) {
              return const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.error, color: Colors.red, size: 60),
                    SizedBox(height: 16),
                    Text("فشل تحميل الصورة",
                        style: TextStyle(color: Colors.white)),
                  ],
                ),
              );
            },
          );
        } else if (localPath != null && localPath.isNotEmpty) {
          // صورة محلية (عند الإنشاء أو التعديل)
          imageWidget = Image.file(
            File(localPath),
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
            errorBuilder: (context, error, stackTrace) {
              return const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.broken_image, color: Colors.red, size: 60),
                    SizedBox(height: 16),
                    Text("الصورة غير موجودة",
                        style: TextStyle(color: Colors.white)),
                  ],
                ),
              );
            },
          );
        } else {
          imageWidget = const Center(
            child: Text("لا توجد صورة",
                style: TextStyle(color: Colors.white70, fontSize: 18)),
          );
        }

        return Stack(
          children: [
            // البانوراما
            PanoramaViewer(
              sensorControl: SensorControl.none,
              animSpeed: 0.0,
              hotspots: buttons.map((buttonMap) {
                final entry = buttonMap.entries.first;
                final targetIndexStr = entry.key;
                final data = entry.value as Map<String, dynamic>;

                final int targetIndex = int.tryParse(targetIndexStr) ?? -1;
                final String label = data['label'] ?? 'غرفة ${targetIndex + 1}';
                final double long = double.tryParse(data['long'] ?? '0') ?? 0;
                final double lat = double.tryParse(data['lat'] ?? '0') ?? 0;

                final bool isValidTarget =
                    targetIndex >= 0 && targetIndex < totalImages;

                // 🔹 حساب العرض والارتفاع حسب طول النص
                int estimatedLines = (label.length / 18).ceil();
                double width = (label.length * 9).clamp(90, 180).toDouble();
                double height = 30 + (estimatedLines * 18);

                // 🔹 حجم الخط حسب طول النص
                double fontSize;
                int maxLines;
                if (label.length <= 12) {
                  fontSize = 14;
                  maxLines = 1;
                } else if (label.length <= 20) {
                  fontSize = 12;
                  maxLines = 2;
                } else if (label.length <= 30) {
                  fontSize = 11;
                  maxLines = 3;
                } else {
                  fontSize = 10;
                  maxLines = 4;
                }

                return Hotspot(
                  latitude: lat,
                  longitude: long,
                  width: width,
                  height: height,
                  widget: GestureDetector(
                    onTap: isValidTarget
                        ? () {
                            currentIndex.value = targetIndex;
                            showSnackBar(
                              "انتقال",
                              "إلى: ${panoramas[targetIndex]['name'] ?? 'غرفة ${targetIndex + 1}'}",
                              duration: const Duration(milliseconds: 800),
                              backgroundColor: Colors.black87,
                              colorText: Colors.cyan,
                              margin: const EdgeInsets.all(16),
                              borderRadius: 12,
                            );
                          }
                        : null,
                    child: Opacity(
                      opacity: isValidTarget ? 1.0 : 0.55,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 160),
                        // padding: const EdgeInsets.symmetric(
                        //     horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.white, // خلفية مثل CustomTextFormField
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: isValidTarget
                                ? Colors.cyan.shade700
                                : Colors.grey.shade400,
                            width: isValidTarget ? 2.4 : 1.8,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.15),
                              blurRadius: 10,
                              spreadRadius: 1,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            label,
                            textAlign: TextAlign.center,
                            maxLines: maxLines,
                            softWrap: true,
                            overflow: TextOverflow.visible,
                            style: TextStyle(
                              fontSize: fontSize,
                              fontWeight: FontWeight.bold,
                              color: isValidTarget
                                  ? Colors.black87
                                  : Colors.grey.shade700,
                              height: 1.25,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
              child: imageWidget as Image,
            ),

            // مؤشر النقاط في الأسفل
            Positioned(
              bottom: 30,
              left: 0,
              right: 0,
              child: Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: List.generate(totalImages, (i) {
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      margin: const EdgeInsets.symmetric(horizontal: 5),
                      width: i == currentIndex.value ? 18 : 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: i == currentIndex.value
                            ? Colors.cyan
                            : Colors.white38,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    );
                  }),
                ),
              ),
            ),
          ],
        );
      }),
    );
  }
}
