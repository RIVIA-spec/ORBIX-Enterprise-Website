// lib/features/panorama_hotspot_editor/view/panorama_hotspot_editor.dart

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:panorama_viewer/panorama_viewer.dart';
import 'package:real_estate_app/features/capture_photo_section/controller/capture_controller.dart';
import 'package:real_estate_app/features/panorama_hotspot_editor_section/controller/panorama_hotspot_editor_controller.dart';
import 'dart:ui';

class PanoramaHotspotEditor extends StatelessWidget {
  final Image image;
  final int index;
  final int total;
  final List<Map<String, dynamic>> existingButtons;

  const PanoramaHotspotEditor({
    Key? key,
    required this.image,
    required this.index,
    required this.total,
    this.existingButtons = const [],
  }) : super(key: key);

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
    final hotspotController = Get.put(HotspotEditorController());
    final captureController = Get.find<CaptureController>();

    hotspotController.loadExistingButtons(existingButtons);

    final currentRoomName = captureController.panoramas[index]['name'] ?? 'غرفة ${index + 1}';

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(100),
        child: ClipRRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
            child: Container(
              height: 100,
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.4),
                border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.2), width: 1)),
              ),
              padding: const EdgeInsets.only(top: 40, left: 16, right: 16),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () {
                      safeBack();
                    },
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text("محرر النقاط", style: TextStyle(color: Colors.white70, fontSize: 14)),
                        Text(
                          currentRoomName,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 19),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      final result = hotspotController.buttons.map((b) => b.toJson()).toList();
                      // safeBack(result: result);
                      safeBack(result: result);
                    },
                    child: const Text("حفظ", style: TextStyle(color: Colors.cyan, fontSize: 18, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: Stack(
        children: [
          // البانوراما
          Obx(() => PanoramaViewer(
            sensorControl: SensorControl.none,
            animSpeed: 0,
            onViewChanged: (long, lat, tilt) {},
            onTap: (long, lat, tilt) {
              HapticFeedback.mediumImpact();

              final existing = hotspotController.buttons.cast<HotspotButton?>().firstWhere(
                (b) => b != null && (b.long - long).abs() < 30 && (b.lat - lat).abs() < 30,
                orElse: () => null,
              );

              if (existing != null) {
                _showEditMenu(hotspotController, captureController, existing, long, lat);
              } else {
                _showAddMenu(hotspotController, captureController, index, total, long, lat);
              }
            },
            hotspots: hotspotController.buttons.map((b) {
              final text = b.label;   // أو النص الذي تريد حسابه
              final length = text.length;

              // 🔹 حساب العرض
              double width;
              double height = 0;
              int estimatedLines = (length / 18).ceil();
              
              if (length < 10) {
                width = 70;
                // height = 20 + (estimatedLines * 18);
              } else if (length < 20) {
                width = 110;
              } else if (length < 35) {
                width = 140;
              } else {
                width = 160;
              }

              // 🔹 حساب الطول (عدد الأسطر التقريبي)
              
              if(height == 0)
                height = 30 + (estimatedLines * 18);

              return Hotspot(
                latitude: b.lat,
                longitude: b.long,

                width: width,
                height: height,

                widget: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.blueAccent, width: 1.8),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black26,
                        blurRadius: 10,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text( 
                      text,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: Colors.black87,
                        height: 1.2,
                      ),
                      softWrap: true,
                      overflow: TextOverflow.visible,
                    ),
                  ),
                ),
              );
            }).toList(),
            child: image,
          )),

          // تعليمات علوية أنيقة
          Positioned(
            top: 110,
            left: 16,
            right: 16,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withOpacity(0.2)),
                  ),
                  child: Obx(() => Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("اضغط في أي مكان لإضافة نقطة", style: TextStyle(color: Colors.white, fontSize: 15)),
                          Text("اسحب للتنقل في البانوراما", style: TextStyle(color: Colors.white70, fontSize: 13)),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.cyan.withOpacity(0.3),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.cyan, width: 1.5),
                        ),
                        child: Text(
                          "${hotspotController.buttons.length} نقطة",
                          style: const TextStyle(color: Colors.cyan, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  )),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // تم إصلاح المشكلة بالكامل هنا (Obx + تحديث فوري + تفعيل الزر ديناميكيًا)
  void _showAddMenu(HotspotEditorController c, CaptureController cap, int currentIndex, int total, double long, double lat) {
    c.reset();

    Get.bottomSheet(
      backgroundColor: Colors.transparent,
      ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(color: Colors.white),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Container(width: 50, height: 5, decoration: BoxDecoration(color: Colors.grey[400], borderRadius: BorderRadius.circular(10))),
              const SizedBox(height: 20),
              const Text("إضافة نقطة انتقال جديدة", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 24),

              DropdownButtonFormField<int>(
                value: c.selectedTargetIndex.value == -1 ? null : c.selectedTargetIndex.value,
                decoration: InputDecoration(
                  labelText: "الانتقال إلى الغرفة",
                  filled: true,
                  fillColor: Colors.grey[100],
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                ),
                items: List.generate(total, (i) => i)
                    .where((i) => i != currentIndex)
                    .map((i) {
                  final roomName = cap.panoramas[i]['name'] ?? 'غرفة ${i + 1}';
                  return DropdownMenuItem(value: i, child: Text(roomName, style: const TextStyle(fontWeight: FontWeight.w600)));
                }).toList(),
                onChanged: (val) {
                  if (val != null) c.selectedTargetIndex.value = val;
                },
              ),
              const SizedBox(height: 16),

              TextField(
                decoration: InputDecoration(
                  labelText: "اسم الزر (مثال: المطبخ، الصالة)",
                  filled: true,
                  fillColor: Colors.grey[100],
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                ),
                onChanged: (val) => c.labelText.value = val,
              ),
              const SizedBox(height: 28),

              // الإصلاح الرئيسي: Obx لتحديث حالة الزر فورًا عند تغيير الحقول
              Obx(() => SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: c.canAdd ? const Color(0xFF3C83F6) : Colors.grey,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  icon: const Icon(Icons.add_location_alt, size: 26),
                  label: Text(c.canAdd ? "إضافة النقطة" : "املأ الحقول أولاً", style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                  onPressed: c.canAdd
                      ? () {
                          HapticFeedback.selectionClick();
                          final targetName = cap.panoramas[c.selectedTargetIndex.value]['name'] ?? 'غرفة ${c.selectedTargetIndex.value + 1}';
                          c.addButton(c.selectedTargetIndex.value, c.labelText.value.trim().isEmpty ? targetName : c.labelText.value.trim(), long, lat);
                          safeBack(); // يغلق الـ BottomSheet فورًا ويظهر النقطة مباشرة
                        }
                      : null,
                ),
              )),
              const SizedBox(height: 12),
              TextButton(onPressed: () => safeBack(), child: const Text("إلغاء", style: TextStyle(fontSize: 16))),
              SizedBox(height: MediaQuery.of(Get.context!).viewInsets.bottom + 20),
            ]),
          ),
        ),
      ),
      isScrollControlled: true,
    );
  }

  // تم إصلاح التعديل والحذف أيضًا (Obx غير ضروري هنا لأن الأزرار دائمًا مفعلة)
  void _showEditMenu(HotspotEditorController c, CaptureController cap, HotspotButton button, double long, double lat) {
    final textCtrl = TextEditingController(text: button.label);
    final targetName = 
    (button.targetIndex >= 0 && button.targetIndex < cap.panoramas.length)
        ? (cap.panoramas[button.targetIndex]['name'] ?? 'غرفة ${button.targetIndex + 1}')
        : 'غرفة ${button.targetIndex + 1}';


    Get.bottomSheet(
      backgroundColor: Colors.transparent,
      ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(color: Colors.white),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Container(width: 50, height: 5, decoration: BoxDecoration(color: Colors.grey[400], borderRadius: BorderRadius.circular(10))),
              const SizedBox(height: 20),
              Text("تعديل النقطة", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Text("إلى $targetName", style: TextStyle(color: Colors.blue.shade700, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextField(
                controller: textCtrl,
                decoration: InputDecoration(
                  labelText: "اسم الزر الجديد",
                  filled: true,
                  fillColor: Colors.grey[100],
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                      icon: const Icon(Icons.edit),
                      label: const Text("تحديث"),
                      onPressed: () {
                        HapticFeedback.selectionClick();
                        c.updateButton(button, textCtrl.text.trim().isEmpty ? "إلى $targetName" : textCtrl.text.trim(), long, lat);
                        safeBack();
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                      icon: const Icon(Icons.delete_forever),
                      label: const Text("حذف"),
                      onPressed: () {
                        HapticFeedback.heavyImpact();
                        c.removeButton(button);
                        safeBack();
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextButton(onPressed: () => safeBack(), child: const Text("إلغاء")),
              SizedBox(height: MediaQuery.of(Get.context!).viewInsets.bottom + 20),
            ]),
          ),
        ),
      ),
      isScrollControlled: true,
    );
  }
}