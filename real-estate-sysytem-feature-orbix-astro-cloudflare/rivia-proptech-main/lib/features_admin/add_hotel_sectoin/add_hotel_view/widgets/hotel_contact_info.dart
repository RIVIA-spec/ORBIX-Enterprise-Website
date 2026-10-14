import 'package:country_code_picker/country_code_picker.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/functions/arabic_to_english_numbers.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/section_container.dart';
import 'package:real_estate_app/features_admin/add_hotel_sectoin/add_hotel_controller/add_hotel_controller.dart';

class HotelContactInfo extends StatelessWidget {
  const HotelContactInfo({super.key});

  @override
  Widget build(BuildContext context) {
    final AddHotelController hotelCtr = Get.find<AddHotelController>();
    final Color primaryBlue = const Color(0xFF3C83F6);

    return SectionContainer(
      title: "معلومات الاتصال والقواعد",
      subtitle: "حدد معلومات الاتصال الخاصة بالفندق وقواعد الإقامة",
      color: primaryBlue,
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              SizedBox(
                width: Get.width * 0.45,
                child: CustomTextFormField(
                  controller: hotelCtr.contactNumberController,
                  label: "رقم هاتف الاتصال",
                  hint: "98877.....",
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "هذا الحقل مطلوب";
                    }
                    if (int.tryParse(value.trim()) == null) {
                      if (int.tryParse(arabicToEnglish(value.trim())) != null) {
                        hotelCtr.contactNumberController.text =
                            arabicToEnglish(value.trim());
                        return null;
                      }
                      return "هذا الحقل يجب أن يحتوي أرقاماً فقط";
                    }
                    return null;
                  },
                ),
              ),
              SizedBox(
                width: Get.width * 0.35,
                child: CustomTextFormField(
                  label: "كود الدولة",
                  validator: (value) {
                    if (hotelCtr.selectedCountryCode.value.isEmpty) {
                      return "هذا الحقل مطلوب";
                    }
                    return null;
                  },
                  hint: "كود الدولة",
                  readOnly: true,
                  prefixIcon: CountryCodePicker(
                    onChanged: (country) {
                      hotelCtr.selectedCountryCode.value =
                          country.dialCode ?? '+963';
                    },
                    initialSelection: hotelCtr.selectedCountryCode.value,
                    favorite: ['+963'],
                    showCountryOnly: false,
                    showOnlyCountryWhenClosed: false,
                    alignLeft: false,
                    textStyle: GoogleFonts.cairo(),
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    flagWidth: 28,
                  ),
                ),
              ),
            ],
          ),
          CustomTextFormField(
            controller: hotelCtr.contactNameController,
            label: "اسم جهة الاتصال",
            hint: "أحمد",
            validator: (value) {
              if (value == null || value.isEmpty) {
                return "هذا الحقل مطلوب";
              }
              return null;
            },
          ),
          CustomTextFormField(
            controller: hotelCtr.rulesController,
            label: "القواعد الخاصة بالفندق",
            hint: "أن يُسلم الغرفة نظيفة",
            maxLines: 4,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return "هذا الحقل مطلوب";
              }
              return null;
            },
          ),
        ],
      ),
    );
  }
}
