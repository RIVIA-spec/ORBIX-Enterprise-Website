// capture_controller.dart
import 'dart:developer';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class CaptureController extends GetxController {
  final ImagePicker _picker = ImagePicker();

  // هيكل البيانات المطلوب تمامًا كما طلبت
  final panoramas = <Map<String, dynamic>>[].obs;
  final isLoading = false.obs;

  void loadTourFromMap(Map<String, dynamic> tourData) {
    panoramas.clear();

    final List images = tourData['images'] ?? [];

    for (var img in images) {
      final String? url = img['url'];
      final String? path = img['path'];

      panoramas.add({
        'path': url ?? path,
        'isNetwork': url != null,
        'name': img['name'] ?? 'غير معروف',
        'buttons': List<Map<String, dynamic>>.from(img['buttons'] ?? []),
      });
    }

    panoramas.refresh();
  }

  void safeBack({dynamic result}) {
    if (Get.isSnackbarOpen) {
      Get.closeCurrentSnackbar();
    }
    if (Navigator.canPop(Get.context!)) {
      Navigator.of(Get.context!).pop(result);
    }
  }

  void fixHotspotsAfterDelete(int deletedIndex) {
    for (var pano in panoramas) {
      final buttons = pano["buttons"] as List<dynamic>?;

      if (buttons == null) continue;

      // 1) حذف الأزرار التي كانت تشير للغرفة المحذوفة
      buttons.removeWhere((btn) {
        final key = btn.keys.first;
        final target = int.parse(key);
        return target == deletedIndex;
      });

      // 2) تعديل targetIndex للأزرار الكبيرة
      for (int i = 0; i < buttons.length; i++) {
        final entry = buttons[i].entries.first;
        final oldTarget = int.parse(entry.key);
        final data = entry.value;

        if (oldTarget > deletedIndex) {
          final newTarget = oldTarget - 1;

          // إعادة بناء الزر بشكل صحيح
          buttons[i] = {
            "$newTarget": data,
          };
        }
      }
    }
  }

  // دالة لحفظ الجولة والرجوع
  void saveAndReturnTour() {
    if (panoramas.isEmpty) {
      showSnackBar("تنبيه", "لا توجد صور للحفظ", backgroundColor: Colors.red);
      return;
    }

    final tourData = {
      'images': panoramas.map((p) {
        final isNetwork = p['isNetwork'] == true;

        return {
          if (isNetwork) 'url': p['path'] else 'path': p['path'],
          'name': p['name'],
          'buttons': p['buttons'],
        };
      }).toList(),
    };

    if (Get.isSnackbarOpen == true) {
      ScaffoldMessenger.of(Get.context!).clearSnackBars();
    }

    safeBack(result: tourData);
    // safeBack(result: tourData);
  }

  void pickPanoramaImageFromGallery() async {
    try {
      final pickedFile = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        maxWidth: 4096,
        imageQuality: 95,
      );

      if (pickedFile == null) {
        // المستخدم ألغى → لا تظهر أي شيء
        return;
      }

      final file = File(pickedFile.path);

      final TextEditingController nameCtrl = TextEditingController();

      final String? roomName = await Get.bottomSheet<String>(
        backgroundColor: Colors.white,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        isScrollControlled: true,
        Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(Get.context!).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 50,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                "اسم الغرفة أو المكان",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: nameCtrl,
                textAlign: TextAlign.center,
                autofocus: true,
                decoration: InputDecoration(
                  hintText: "مثال: الصالة الرئيسية، غرفة النوم، المطبخ",
                  filled: true,
                  fillColor: Colors.grey[100],
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: () {
                        final name = nameCtrl.text.trim();
                        if (name.isEmpty) {
                          showSnackBar("مطلوب", "يرجى كتابة اسم الغرفة",
                              backgroundColor: Colors.red,
                              colorText: Colors.white);
                        } else {
                          safeBack(result: name);
                          // safeBack(result: name);
                        }
                      },
                      child: const Text("حفظ", style: TextStyle(fontSize: 16)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextButton(
                      onPressed: () => safeBack(),
                      child:
                          const Text("إلغاء", style: TextStyle(fontSize: 16)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );

      if (roomName != null && roomName.isNotEmpty) {
        panoramas.add({
          'path': file.path,
          'name': roomName,
          'buttons': <Map<String, dynamic>>[],
        });
        panoramas.refresh();

        // نجاح → لا نُظهر شيئًا (الهدوء هو الفخامة)
        // لو حابب تعرف المستخدم إنه تم → ممكن تعمل animation خفيفة في القائمة بدل السناك بار
      }
    } catch (e) {
      // فقط عند الفشل الحقيقي نظهر رسالة
      showSnackBar(
        "فشل في التحميل",
        "تعذر تحميل الصورة، تأكد من أنها صورة بانوراما صالحة",
        backgroundColor: Colors.red,
        colorText: Colors.white,
        snackPosition: SnackPosition.TOP,
        margin: const EdgeInsets.all(16),
        borderRadius: 12,
        icon: const Icon(Icons.error_outline, color: Colors.white),
      );
    }
  }

  /// تحديث النقاط الساخنة (Hotspots) لبانوراما معينة حسب الـ index
  void updateHotspots(int index, List<Map<String, dynamic>> newButtons) {
    if (index >= 0 && index < panoramas.length) {
      panoramas[index]['buttons'] = newButtons;
      panoramas.refresh(); // تحديث الـ Obx في الواجهة

      // اختياري: حفظ الجولة تلقائيًا في الـ SharedPreferences أو الملف المحلي
      // saveTourLocally();
    }
  }

  /// حذف بانوراما معينة
  void removePanorama(int index) {
    if (index >= 0 && index < panoramas.length) {
      panoramas.removeAt(index);
      fixHotspotsAfterDelete(index);
      panoramas.refresh();

      showSnackBar(
        "تم الحذف",
        "تم حذف الصورة وجميع النقاط الخاصة بها",
        backgroundColor: Colors.orange[700],
        colorText: Colors.white,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
        borderRadius: 12,
      );
    }
  }

  /// إعادة ترتيب الصور (مثلاً بعد Drag & Drop)
  void reorderPanoramas(int oldIndex, int newIndex) {
    if (oldIndex < newIndex) {
      newIndex -= 1;
    }
    final item = panoramas.removeAt(oldIndex);
    panoramas.insert(newIndex, item);
    panoramas.refresh();
  }

  /// تحديث اسم الغرفة
  void updatePanoramaName(int index, String newName) {
    if (index >= 0 && index < panoramas.length && newName.trim().isNotEmpty) {
      panoramas[index]['name'] = newName.trim();
      panoramas.refresh();
    }
  }

  /// مسح كل الجولة (مفيد عند زر "مسح الكل")
  void clearTour() {
    panoramas.clear();
    panoramas.refresh();
    showSnackBar("تم المسح", "تم حذف جميع الصور والنقاط",
        backgroundColor: Colors.red[600]);
  }

  void addButton(int panoramaIndex, String type, double long, double lat) {
    final panorama = panoramas[panoramaIndex];

    // إزالة الزر القديم من نفس النوع (لا يوجد أكثر من واحد)
    panorama['buttons'].removeWhere((b) => b[type] != null);

    // إضافة الزر الجديد
    final newButton = <String, dynamic>{
      type: {
        'long': long.toStringAsFixed(2),
        'lat': lat.toStringAsFixed(2),
      }
    };

    panorama['buttons'].add(newButton);
    panoramas.refresh();
  }

  // للمعاينة لاحقًا
  Map<String, dynamic> toJson() => {
        "tour": panoramas
            .map((p) => {
                  "index": p['index'],
                  "path": p['path'],
                  "buttons": p['buttons'],
                })
            .toList(),
      };
}