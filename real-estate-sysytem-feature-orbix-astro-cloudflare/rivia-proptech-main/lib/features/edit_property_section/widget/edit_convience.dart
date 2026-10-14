import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/functions/arabic_to_english_numbers.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/section_container.dart';
import 'package:real_estate_app/features/edit_property_section/controller/edit_property_controller.dart';

class EditConvience extends StatelessWidget {
  const EditConvience({super.key});

  @override
  Widget build(BuildContext context) {
    final addPropertyCtr =
        Get.find<EditPropertyController>();
    final Color primaryBlue = const Color(0xFF3C83F6);

    return SectionContainer(
      title: "ميزات و وسائل الراحة",
      subtitle: "حدد عدد الغرف و الحمامات و وسائل الراحة",
      color: primaryBlue,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ------------------- حقول الغرف والحمامات -------------------
          Row(
            children: [
              Expanded(
                child: CustomTextFormField(
                  controller: addPropertyCtr.bedRoomsController,
                  label: "عدد الغرف",
                  hint: "0",
                  keyboardType: TextInputType.number,
                  labelStyle: GoogleFonts.cairo(
                    fontWeight: FontWeight.w600,
                    fontSize: 13.5,
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "هذا الحقل مطلوب";
                    }
                    if (int.tryParse(value.trim()) == null) {
                      if (int.tryParse(arabicToEnglish(value.trim())) != null) {
                        addPropertyCtr.bedRoomsController.text =
                            arabicToEnglish(value.trim());
                        return null;
                      }
                      return "عدد الغرف يجب أن يكون رقماً";
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: CustomTextFormField(
                  controller: addPropertyCtr.bathRoomsController,
                  label: "عدد الحمامات",
                  hint: "0",
                  keyboardType: TextInputType.number,
                  labelStyle: GoogleFonts.cairo(
                    fontWeight: FontWeight.w600,
                    fontSize: 13.5,
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "هذا الحقل مطلوب";
                    }
                    if (int.tryParse(value.trim()) == null) {
                      if (int.tryParse(arabicToEnglish(value.trim())) != null) {
                        addPropertyCtr.bathRoomsController.text =
                            arabicToEnglish(value.trim());
                        return null;
                      }
                      return "عدد الحمامات يجب أن يكون رقماً";
                    }
                    return null;
                  },
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),
          const Divider(height: 20),

          // ------------------- قائمة المزايا -------------------
          Text(
            "اختيار الميزات المتاحة:",
            style: GoogleFonts.cairo(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 6),

          // قائمة الميزات Checkbox
          Obx(
            () => Column(
              children: [
                for (var index = 0; index < addPropertyCtr.features.length; index++)
                  Obx(
                    () => Container(
                      margin: const EdgeInsets.symmetric(vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.white, // مثل خلفية CustomTextFormField
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: addPropertyCtr.selectedFeaturesCtr[index].value
                              ? primaryBlue.withOpacity(0.8)  // عند التفعيل
                              : Colors.grey.shade300,         // الافتراضي
                          width: 1.2,
                        ),
                      ),

                      // إزالة تأثير الضغط الافتراضي
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

                          // ------------------ النص ------------------
                          title: Text(
                            addPropertyCtr.features[index],
                            style: GoogleFonts.cairo(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),

                          // ------------------ القيمة ------------------
                          value: addPropertyCtr.selectedFeaturesCtr[index].value,

                          // ------------------ Checkbox شكل ------------------
                          checkboxShape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(4),
                          ),

                          activeColor: primaryBlue,
                          checkColor: Colors.white,

                          // ------------------ تبديل القيمة ------------------
                          onChanged: (val) {
                            addPropertyCtr.selectedFeaturesCtr[index].value =
                                !addPropertyCtr.selectedFeaturesCtr[index].value;
                          },
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          )

        ],
      ),
    );
  }
}
