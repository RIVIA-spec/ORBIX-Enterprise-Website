// lib/features/panorama_hotspot_editor/controller/hotspot_editor_controller.dart

import 'package:get/get.dart';

class HotspotButton {
  final int targetIndex;
  final String label;
  final double long;
  final double lat;

  HotspotButton({
    required this.targetIndex,
    required this.label,
    required this.long,
    required this.lat,
  });

  Map<String, dynamic> toJson() => {
        "$targetIndex": {
          "label": label,
          "long": long.toStringAsFixed(2),
          "lat": lat.toStringAsFixed(2),
        }
      };
}

class HotspotEditorController extends GetxController {
  final RxList<HotspotButton> buttons = <HotspotButton>[].obs;

  // للـ Bottom Sheet
  final RxInt selectedTargetIndex = (-1).obs;
  final RxString labelText = ''.obs;

  // تحميل الأزرار القديمة
  void loadExistingButtons(List<Map<String, dynamic>> existing) {
    buttons.clear();

    for (var btn in existing) {
      try {
        final entry = btn.entries.first;
        final key = entry.key.toString();
        final data = entry.value as Map;

        final targetIndex = int.tryParse(key) ?? 0;

        final label = (data['label'] ?? 'غرفة ${targetIndex + 1}').toString();

        final long = double.tryParse(data['long'] ?? '') ?? 0.0;
        final lat = double.tryParse(data['lat'] ?? '') ?? 0.0;

        buttons.add(
          HotspotButton(
            targetIndex: targetIndex,
            label: label,
            long: long,
            lat: lat,
          ),
        );
      } catch (e) {
        // نتخطى أي خطأ لكي لا ينهار المحرر
        print("⚠️ تجاهل زر غير صالح: $e");
      }
    }
  }

  // إضافة زر جديد
  void addButton(int targetIndex, String label, double long, double lat) {
    buttons.add(HotspotButton(
      targetIndex: targetIndex,
      label: label,
      long: long,
      lat: lat,
    ));
  }

  // تحديث زر موجود
  void updateButton(
      HotspotButton old, String newLabel, double long, double lat) {
    final index = buttons.indexOf(old);
    if (index != -1) {
      buttons[index] = HotspotButton(
        targetIndex: old.targetIndex,
        label: newLabel,
        long: long,
        lat: lat,
      );
    }
  }

  // حذف زر
  void removeButton(HotspotButton button) => buttons.remove(button);

  // تحقق من صلاحية زر الإضافة
  bool get canAdd =>
      selectedTargetIndex.value != -1 && labelText.value.trim().isNotEmpty;

  // تنظيف عند الخروج
  void reset() {
    selectedTargetIndex.value = -1;
    labelText.value = '';
  }
}
