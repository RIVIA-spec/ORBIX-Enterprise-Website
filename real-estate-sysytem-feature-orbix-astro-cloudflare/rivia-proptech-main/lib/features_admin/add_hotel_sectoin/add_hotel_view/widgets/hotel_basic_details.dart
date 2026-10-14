import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/section_container.dart';
import 'package:real_estate_app/features_admin/add_hotel_sectoin/add_hotel_controller/add_hotel_controller.dart';

class HotelBasicDetails extends StatelessWidget {
  const HotelBasicDetails({super.key});

  @override
  Widget build(BuildContext context) {
    final AddHotelController hotelCtr = Get.find<AddHotelController>();
    final Color primaryBlue = const Color(0xFF3C83F6);

    return SectionContainer(
      title: "معلومات الفندق الأساسية",
      subtitle: "أدخل اسم الفندق ووصفه ونوعه",
      color: primaryBlue,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          /// ===== اسم الفندق =====
          CustomTextFormField(
            label: "اسم الفندق",
            hint: "فندق الشام الفاخر",
            prefixIcon: const Icon(Icons.hotel, color: Colors.blueAccent),
            controller: hotelCtr.hotelNameController,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return "هذا الحقل مطلوب";
              }
              return null;
            },
          ),

          const SizedBox(height: 5),
          Divider(color: Colors.grey.shade300, height: 20),

          /// ===== وصف الفندق =====
          CustomTextFormField(
            label: "وصف الفندق",
            hint: "أدخل وصفاً واضحاً للفندق",
            prefixIcon: const Icon(Icons.description_outlined,
                color: Colors.blueAccent),
            controller: hotelCtr.hotelDescriptionController,
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

          /// ===== صور الفندق =====
          Text(
            "صور الفندق",
            style: GoogleFonts.cairo(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: primaryBlue,
            ),
          ),
          const SizedBox(height: 10),
          Obx(
            () => GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: hotelCtr.existingHotelImageUrls.length + hotelCtr.hotelImages.length + 1,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.0,
              ),
              itemBuilder: (context, index) {
                final existingCount = hotelCtr.existingHotelImageUrls.length;

                // زر الإضافة
                if (index == existingCount + hotelCtr.hotelImages.length) {
                  return GestureDetector(
                    onTap: () async {
                      final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
                      if (picked != null) hotelCtr.addNewHotelImage(File(picked.path));
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
                  final url = hotelCtr.existingHotelImageUrls[index];
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
                          onTap: () => hotelCtr.removeExistingHotelImageAt(index),
                          child: Container(
                            padding: const EdgeInsets.all(5),
                            decoration: BoxDecoration(color: Colors.red.shade600, shape: BoxShape.circle),
                            child: const Icon(Icons.close, size: 16, color: Colors.white),
                          ),
                        ),
                      ),
                      // تاج الصورة الرئيسية
                      if (index == 0)
                        Positioned(
                          bottom: 6,
                          right: 6,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade600,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              "رئيسية",
                              style: GoogleFonts.cairo(
                                fontSize: 10,
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                    ],
                  );
                }

                // صور جديدة
                final newIndex = index - existingCount;
                final file = hotelCtr.hotelImages[newIndex];

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
                        onTap: () => hotelCtr.removeNewHotelImageAt(newIndex),
                        child: Container(
                          padding: const EdgeInsets.all(5),
                          decoration: BoxDecoration(color: Colors.red.shade600, shape: BoxShape.circle),
                          child: const Icon(Icons.close, size: 16, color: Colors.white),
                        ),
                      ),
                    ),
                    // تاج الصورة الرئيسية (إذا كانت الصورة الأولى في المجموع)
                    if (existingCount == 0 && newIndex == 0)
                      Positioned(
                        bottom: 6,
                        right: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade600,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            "رئيسية",
                            style: GoogleFonts.cairo(
                              fontSize: 10,
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
