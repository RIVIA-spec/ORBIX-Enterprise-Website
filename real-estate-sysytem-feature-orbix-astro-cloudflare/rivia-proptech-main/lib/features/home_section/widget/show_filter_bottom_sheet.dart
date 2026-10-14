import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/features/home_section/controller/home_controller.dart';

void showFilterBottomSheet() {
  Get.bottomSheet(
    FilterBottomSheet(),
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
    ),
    backgroundColor: Colors.white, // إضافة لون خلفية أبيض
  );
}

class FilterBottomSheet extends StatelessWidget {
  final HomeController homeCtr = Get.find<HomeController>();

  FilterBottomSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.8,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (_, scrollController) {
        return SingleChildScrollView(
          controller: scrollController,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 50,
                    height: 5,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text("فلتر العقارات والفنادق",
                    style: GoogleFonts.cairo(
                        fontSize: 22, fontWeight: FontWeight.bold)),
                const SizedBox(height: 20),

                // القسم الأول: نوع العقار (بيع، إيجار) في Row
                Text("نوع العقار",
                    style: GoogleFonts.cairo(
                        fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 10),
                Obx(() => Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: ['بيع', 'إيجار'].map((type) {
                        final isSelected =
                            homeCtr.selectedPropertyTypes.contains(type);
                        Color color = isSelected
                            ? (type == 'بيع'
                                ? Colors.orange.shade200
                                : Colors.green.shade200)
                            : Colors.grey.shade300;
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            child: ElevatedButton(
                              onPressed: () {
                                if (isSelected) {
                                  homeCtr.selectedPropertyTypes.remove(type);
                                } else {
                                  homeCtr.selectedPropertyTypes.add(type);
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: color,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12)),
                              ),
                              child: Text(type,
                                  style:
                                      GoogleFonts.cairo(color: Colors.black87)),
                            ),
                          ),
                        );
                      }).toList(),
                    )),
                const SizedBox(height: 20),

                // القسم الثاني: فئات العقار والفنادق (منزل، شاليه، فندق، إلخ) في Wrap
                Text("فئة العقار والفندق",
                    style: GoogleFonts.cairo(
                        fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 10),
                Obx(() => Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        // إضافة خيار "فنادق"
                        FilterChip(
                          label: Text("فنادق", style: GoogleFonts.cairo()),
                          selected: homeCtr.selectedCategoryIds.contains('hotels'),
                          selectedColor: Colors.purple.shade200,
                          onSelected: (value) {
                            if (value) {
                              homeCtr.selectedCategoryIds.add('hotels');
                            } else {
                              homeCtr.selectedCategoryIds.remove('hotels');
                            }
                          },
                        ),
                        // فئات العقارات
                        ...homeCtr.propertyCategories.map((cat) {
                          final id = cat['id'] as String;
                          final title = cat['title'] as String;
                          final isSelected =
                              homeCtr.selectedCategoryIds.contains(id);
                          return FilterChip(
                            label: Text(title, style: GoogleFonts.cairo()),
                            selected: isSelected,
                            selectedColor: Colors.blue.shade200,
                            onSelected: (value) {
                              if (value) {
                                homeCtr.selectedCategoryIds.add(id);
                              } else {
                                homeCtr.selectedCategoryIds.remove(id);
                              }
                            },
                          );
                        }).toList(),
                      ],
                    )),
                const SizedBox(height: 20),

                // القسم الثالث: الميزات
                Text("الميزات",
                    style: GoogleFonts.cairo(
                        fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 10),
                Obx(() => Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ToggleButtons(
                          isSelected: [
                            homeCtr.featuresFilterMode.value == 'OR',
                            homeCtr.featuresFilterMode.value == 'AND',
                          ],
                          onPressed: (index) {
                            homeCtr.featuresFilterMode.value =
                                index == 0 ? 'OR' : 'AND';
                          },
                          borderRadius: BorderRadius.circular(12),
                          selectedColor: Colors.white,
                          fillColor: Colors.blue,
                          color: Colors.black87,
                          children: [
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                              child: Text('أو (أي ميزة)',
                                  style: GoogleFonts.cairo()),
                            ),
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                              child: Text('و (جميع الميزات)',
                                  style: GoogleFonts.cairo()),
                            ),
                          ],
                        ),
                      ],
                    )),
                const SizedBox(height: 10),
                Obx(() => Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: homeCtr.features.map((feature) {
                        final isSelected =
                            homeCtr.selectedFeatures.contains(feature);
                        return FilterChip(
                          label: Text(feature, style: GoogleFonts.cairo()),
                          selected: isSelected,
                          selectedColor: Colors.green.shade200,
                          checkmarkColor: Colors.green.shade800,
                          backgroundColor: Colors.grey.shade200,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                            side: BorderSide(color: Colors.grey.shade300),
                          ),
                          onSelected: (value) {
                            if (value) {
                              homeCtr.selectedFeatures.add(feature);
                            } else {
                              homeCtr.selectedFeatures.remove(feature);
                            }
                          },
                        );
                      }).toList(),
                    )),
                const SizedBox(height: 30),

// === فلتر الموقع ===
                Text(
                  "العقارات والفنادق القريبة مني",
                  style: GoogleFonts.cairo(
                      fontSize: 18, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 12),

                Obx(() => Column(
                      children: [
                        // مفتاح تشغيل/إيقاف
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              "تفعيل فلتر المسافة",
                              style: GoogleFonts.cairo(fontSize: 15),
                            ),
                            Switch(
                              value: homeCtr.isLocationFilterEnabled.value,
                              activeColor: Colors.blue.shade600,
                              onChanged: (value) async {
                                if (!value) {
                                  homeCtr.isLocationFilterEnabled.value = false;
                                  return;
                                }

                                // التحقق من الخدمة أولًا
                                bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
                                if (!serviceEnabled) {
                                  showSnackBar("خطأ", "يرجى تفعيل خدمات الموقع في الجهاز", backgroundColor: Colors.red, colorText: Colors.white);
                                  return;
                                }

                                // طلب الصلاحية
                                LocationPermission permission = await Geolocator.checkPermission();
                                if (permission == LocationPermission.denied) {
                                  permission = await Geolocator.requestPermission();
                                }
                                if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
                                  showSnackBar("خطأ", "يرجى منح صلاحيات الموقع من إعدادات التطبيق", backgroundColor: Colors.red, colorText: Colors.white);
                                  return;
                                }

                                // جلب الموقع
                                try {
                                  final position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
                                  homeCtr.userLocation.value = LatLng(position.latitude, position.longitude);
                                  homeCtr.isLocationFilterEnabled.value = true;
                                  showSnackBar("تم", "تم تحديد موقعك بنجاح", backgroundColor: Colors.green, colorText: Colors.white);
                                } catch (e) {
                                  showSnackBar("خطأ", "فشل جلب الموقع: $e", backgroundColor: Colors.red, colorText: Colors.white);
                                }
                              },
                            ),
                          ],
                        ),

                        if (homeCtr.isLocationFilterEnabled.value) ...[
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade50,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.blue.shade200),
                            ),
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text("المسافة القصوى",
                                        style: GoogleFonts.cairo(
                                            fontWeight: FontWeight.bold)),
                                    Text(
                                      "${homeCtr.maxDistanceKm.value.toInt()} كم",
                                      style: GoogleFonts.cairo(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.blue.shade700),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Slider(
                                  value: homeCtr.maxDistanceKm.value,
                                  min: 1,
                                  max: 10,
                                  divisions: 9, // 1,2,3,...,10
                                  activeColor: Colors.blue.shade600,
                                  inactiveColor: Colors.blue.shade200,
                                  onChanged: (value) {
                                    homeCtr.maxDistanceKm.value = value;
                                  },
                                ),
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: List.generate(
                                      10,
                                      (i) => Text(
                                            "${i + 1}",
                                            style: GoogleFonts.cairo(
                                                fontSize: 10,
                                                color: Colors.grey.shade600),
                                          )),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    )),
                const SizedBox(height: 30),

                // زر تطبيق الفلتر
                CustomButton(
                  text: "تطبيق الفلتر",
                  borderRadius: 20,
                  padding: EdgeInsets.all(5),
                  width: Get.width * 0.9,
                  onPressed: () async {
                    await homeCtr.applyFilters();
                    safeBack();
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
