import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:real_estate_app/core/functions/arabic_to_english_numbers.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/custom_dropdown.dart';
import 'package:real_estate_app/core/widgets/section_container.dart';
import 'package:real_estate_app/features_admin/add_hotel_sectoin/add_hotel_controller/add_hotel_controller.dart';
import 'package:real_estate_app/features/capture_photo_section/view/capture_view.dart';
import 'package:real_estate_app/features/panorama_tour_viewer_section/view/panorama_viewer_screen.dart';

class RoomGroupWidget extends StatelessWidget {
  final RoomGroup roomGroup;
  final int index;

  const RoomGroupWidget({
    super.key,
    required this.roomGroup,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    final AddHotelController hotelCtr = Get.find<AddHotelController>();
    final Color primaryBlue = const Color(0xFF3C83F6);

    return SectionContainer(
      title: "مجموعة الغرف ${index + 1}",
      subtitle: "أدخل معلومات الغرفة وعدد الغرف التي تحوي نفس المعلومات",
      color: primaryBlue,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // زر حذف المجموعة
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              if (hotelCtr.roomGroups.length > 1)
                IconButton(
                  icon: Icon(Icons.delete, color: Colors.red),
                  onPressed: () => hotelCtr.removeRoomGroup(index),
                  tooltip: "حذف هذه المجموعة",
                ),
            ],
          ),

          // بادئة رقم الغرفة
          CustomTextFormField(
            label: "بادئة رقم الغرفة",
            hint: "غرفة، Suite، Deluxe...",
            prefixIcon: const Icon(Icons.numbers, color: Colors.blueAccent),
            controller: roomGroup.roomNumberPrefixController,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return "هذا الحقل مطلوب";
              }
              return null;
            },
          ),

          const SizedBox(height: 10),
          Divider(color: Colors.grey.shade300, height: 20),

          // عدد الغرف التي تحوي نفس المعلومات
          CustomTextFormField(
            label: "عدد الغرف التي تحوي نفس المعلومات",
            hint: "مثال: 4 (يعني 4 غرف بنفس المواصفات)",
            prefixIcon: const Icon(Icons.hotel, color: Colors.green),
            controller: roomGroup.roomCountController,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            validator: (value) {
              if (value == null || value.isEmpty) {
                return "هذا الحقل مطلوب";
              }
              final count = int.tryParse(value.trim());
              if (count == null || count <= 0) {
                return "يجب أن يكون رقماً أكبر من صفر";
              }
              return null;
            },
          ),

          const SizedBox(height: 10),
          Divider(color: Colors.grey.shade300, height: 20),

          // وصف الغرفة
          CustomTextFormField(
            label: "وصف الغرفة",
            hint: "أدخل وصفاً للغرفة",
            prefixIcon: const Icon(Icons.description_outlined,
                color: Colors.blueAccent),
            controller: roomGroup.descriptionController,
            maxLines: 3,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return "هذا الحقل مطلوب";
              }
              return null;
            },
          ),

          const SizedBox(height: 10),
          Divider(color: Colors.grey.shade300, height: 20),

          // المساحة
          Row(
            children: [
              SizedBox(
                width: Get.width * 0.5,
                child: CustomTextFormField(
                  label: "المساحة",
                  hint: "100",
                  prefixIcon:
                      const Icon(Icons.square_foot, color: Colors.blueAccent),
                  controller: roomGroup.areaController,
                  validator: (value) {
                    if (value == null || value.isEmpty) return "الحقل مطلوب";
                    if (int.tryParse(value.trim()) == null) {
                      if (int.tryParse(arabicToEnglish(value.trim())) != null) {
                        roomGroup.areaController.text =
                            arabicToEnglish(value.trim());
                        return null;
                      }
                      return "المساحة يجب أن تكون رقماً";
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Obx(
                  () => CustomDropdown<String>(
                    label: "الواحدة",
                    value: roomGroup.selectedAreaUnit.value,
                    iconColor: Colors.blueAccent,
                    fontSize: 12,
                    items: const [
                      DropdownOption(value: "متر مربع", title: "متر مربع"),
                      DropdownOption(value: "دونم", title: "دونم"),
                      DropdownOption(value: "هكتار", title: "هكتار"),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        roomGroup.selectedAreaUnit.value = value;
                      }
                    },
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),
          Divider(color: Colors.grey.shade300, height: 20),

          // عدد الغرف والحمامات
          Row(
            children: [
              Expanded(
                child: CustomTextFormField(
                  controller: roomGroup.bedRoomsController,
                  label: "عدد الأسرة",
                  hint: "2",
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "هذا الحقل مطلوب";
                    }
                    if (int.tryParse(value.trim()) == null) {
                      if (int.tryParse(arabicToEnglish(value.trim())) != null) {
                        roomGroup.bedRoomsController.text =
                            arabicToEnglish(value.trim());
                        return null;
                      }
                      return "يجب أن يكون رقماً";
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: CustomTextFormField(
                  controller: roomGroup.bathRoomsController,
                  label: "عدد الحمامات",
                  hint: "1",
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "هذا الحقل مطلوب";
                    }
                    if (int.tryParse(value.trim()) == null) {
                      if (int.tryParse(arabicToEnglish(value.trim())) != null) {
                        roomGroup.bathRoomsController.text =
                            arabicToEnglish(value.trim());
                        return null;
                      }
                      return "يجب أن يكون رقماً";
                    }
                    return null;
                  },
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),
          Divider(color: Colors.grey.shade300, height: 20),

          // الأسعار
          Row(
            children: [
              SizedBox(
                width: Get.width * 0.5,
                child: CustomTextFormField(
                  label: "السعر اليومي",
                  hint: "500",
                  prefixIcon: const Icon(Icons.sunny, color: Colors.blueAccent),
                  controller: roomGroup.dailyPriceController,
                  validator: (value) {
                    if (value == null || value.isEmpty) return "الحقل مطلوب";
                    if (int.tryParse(value.trim()) == null) {
                      if (int.tryParse(arabicToEnglish(value.trim())) != null) {
                        roomGroup.dailyPriceController.text =
                            arabicToEnglish(value.trim());
                        return null;
                      }
                      return "السعر يجب أن يكون رقم";
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Obx(
                  () => CustomDropdown<String>(
                    label: "العملة",
                    value: roomGroup.dailySelectedCurrency.value,
                    iconColor: Colors.blueAccent,
                    fontSize: 12,
                    items: const [
                      DropdownOption(value: "دولار", title: "دولار"),
                      DropdownOption(value: "ليرة سورية", title: "ليرة سورية"),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        roomGroup.dailySelectedCurrency.value = value;
                      }
                    },
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          Row(
            children: [
              SizedBox(
                width: Get.width * 0.5,
                child: CustomTextFormField(
                  label: "السعر الليلي",
                  hint: "500",
                  prefixIcon:
                      const Icon(Icons.nightlight_round, color: Colors.blueAccent),
                  controller: roomGroup.nightlyPriceController,
                  validator: (value) {
                    if (value == null || value.isEmpty) return "الحقل مطلوب";
                    if (int.tryParse(value.trim()) == null) {
                      if (int.tryParse(arabicToEnglish(value.trim())) != null) {
                        roomGroup.nightlyPriceController.text =
                            arabicToEnglish(value.trim());
                        return null;
                      }
                      return "السعر يجب أن يكون رقم";
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Obx(
                  () => CustomDropdown<String>(
                    label: "العملة",
                    value: roomGroup.nightlySelectedCurrency.value,
                    iconColor: Colors.blueAccent,
                    fontSize: 12,
                    items: const [
                      DropdownOption(value: "دولار", title: "دولار"),
                      DropdownOption(value: "ليرة سورية", title: "ليرة سورية"),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        roomGroup.nightlySelectedCurrency.value = value;
                      }
                    },
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),
          Divider(color: Colors.grey.shade300, height: 20),

          // الميزات
          Text(
            "اختيار الميزات المتاحة:",
            style: GoogleFonts.cairo(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 6),
          Obx(
            () {
              // التأكد من أن selectedFeaturesCtr بنفس طول features
              if (roomGroup.selectedFeaturesCtr.length !=
                  hotelCtr.features.length) {
                // تحديث selectedFeaturesCtr إذا كان الطول مختلفاً
                final currentLength = roomGroup.selectedFeaturesCtr.length;
                final newLength = hotelCtr.features.length;

                if (newLength > currentLength) {
                  // إضافة ميزات جديدة
                  for (int i = currentLength; i < newLength; i++) {
                    roomGroup.selectedFeaturesCtr.add(false.obs);
                  }
                } else if (newLength < currentLength) {
                  // إزالة الميزات الزائدة
                  roomGroup.selectedFeaturesCtr
                      .removeRange(newLength, currentLength);
                }
              }

              return Column(
                children: [
                  for (var i = 0; i < hotelCtr.features.length; i++)
                    Obx(
                      () => Container(
                        margin: const EdgeInsets.symmetric(vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: i < roomGroup.selectedFeaturesCtr.length &&
                                    roomGroup.selectedFeaturesCtr[i].value
                                ? primaryBlue.withOpacity(0.8)
                                : Colors.grey.shade300,
                            width: 1.2,
                          ),
                        ),
                        child: Theme(
                          data: Theme.of(context).copyWith(
                            splashColor: Colors.transparent,
                            highlightColor: Colors.transparent,
                            hoverColor: Colors.transparent,
                          ),
                          child: CheckboxListTile(
                            dense: true,
                            contentPadding:
                                const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
                            title: Text(
                              hotelCtr.features[i],
                              style: GoogleFonts.cairo(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            value: i < roomGroup.selectedFeaturesCtr.length
                                ? roomGroup.selectedFeaturesCtr[i].value
                                : false,
                            checkboxShape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(4),
                            ),
                            activeColor: primaryBlue,
                            checkColor: Colors.white,
                            onChanged: (val) {
                              if (i < roomGroup.selectedFeaturesCtr.length) {
                                roomGroup.selectedFeaturesCtr[i].value =
                                    !roomGroup.selectedFeaturesCtr[i].value;
                              }
                            },
                          ),
                        ),
                      ),
                    ),
                ],
              );
            },
          ),

          const SizedBox(height: 10),
          Divider(color: Colors.grey.shade300, height: 20),

          // صور الغرفة
          Text(
            "صور الغرفة",
            style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          Obx(
            () => GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: roomGroup.existingImageUrls.length + roomGroup.images.length + 1,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.0,
              ),
              itemBuilder: (context, index) {
                final existingCount = roomGroup.existingImageUrls.length;

                // زر الإضافة
                if (index == existingCount + roomGroup.images.length) {
                  return GestureDetector(
                    onTap: () async {
                      final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
                      if (picked != null) roomGroup.images.add(File(picked.path));
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

                // صور قديمة من URL
                if (index < existingCount) {
                  final url = roomGroup.existingImageUrls[index];
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
                          onTap: () => roomGroup.existingImageUrls.removeAt(index),
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
                final file = roomGroup.images[newIndex];

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
                        onTap: () => roomGroup.images.removeAt(newIndex),
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

          const SizedBox(height: 16),

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
                if(roomGroup.panoramaTour.value != null && 
                  roomGroup.panoramaTour.value!.isNotEmpty){
                  final result = await Get.to(
                    () => CaptureView(initialTour: roomGroup.panoramaTour.value),
                  );
                  if (result != null) {
                    roomGroup.panoramaTour.value = result;
                  }
                }
                else
                {
                  final result = await Get.to(() => CaptureView());

                  if (result is Map<String, dynamic> && result['images'] != null) {
                    roomGroup.panoramaTour.value = result;
                    showSnackBar("تم", "تم إنشاء جولة 360 بنجاح!", backgroundColor: Colors.green, colorText: Colors.white);
                  }
                }
              },
              child: Obx(
                () => Text(
                  roomGroup.panoramaTour.value == null
                      ? "تحميل صور الجولة البانورامية"
                      : "تم إنشاء الجولة (اضغط للتعديل)",
                  style: GoogleFonts.cairo(
                    color: roomGroup.panoramaTour.value == null ? primaryBlue : Colors.green.shade700,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ),

          SizedBox(height: 20),

          // ---------------------- بطاقة جولة 360 ----------------------
          Obx(
            () => roomGroup.panoramaTour.value == null
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
                              "${roomGroup.panoramaTour.value!['images'].length} غرفة",
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
                            itemCount: roomGroup.panoramaTour.value!['images'].length,
                            itemBuilder: (ctx, i) {
                              final imgData = roomGroup.panoramaTour.value!['images'][i];
                              final isNetwork = imgData.containsKey('url');
                              final imgSrc = isNetwork ? imgData['url'] : imgData['path'];
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
                                      isNetwork
                                          ? Image.network(imgSrc, fit: BoxFit.cover, width: 110, height: 110)
                                          : Image.file(File(imgSrc), fit: BoxFit.cover, width: 110, height: 110),
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
                                  panoramas: roomGroup.panoramaTour.value!['images'],
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
                                  () => CaptureView(initialTour: roomGroup.panoramaTour.value),
                                );
                                if (result != null) {
                                  roomGroup.panoramaTour.value = result;
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
