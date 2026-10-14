import 'package:country_code_picker/country_code_picker.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/functions/arabic_to_english_numbers.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/section_container.dart';
import 'package:real_estate_app/features/add_property_section/controller/add_proprety_controller.dart';

class ContactInfoAndRules extends StatelessWidget {
  const ContactInfoAndRules({super.key});

  @override
  Widget build(BuildContext context) {
    final AddPropretyController addPropertyCtr = Get.find<AddPropretyController>();
    final Color primaryBlue = const Color(0xFF3C83F6);

    return SectionContainer(
      title: "معلومات الاتصال و القواعد",
      subtitle: "حدد معلومات الاتصال الخاصة بك و قواعد العقار",
      color: primaryBlue,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              SizedBox(
                width: Get.width * 0.45,
                child: CustomTextFormField(
                  controller: addPropertyCtr.contactNumberController,
                  label: "رقم هاتف الاتصال",
                  hint: "98877.....",
                  keyboardType: TextInputType.number,
                  validator: (value) {
                    if(value == null || value.isEmpty){
                      return "هذا الحقل مطلوب";
                    }
                    if(int.tryParse(value.trim()) == null){
                      if(int.tryParse(arabicToEnglish(value.trim())) != null){
                        addPropertyCtr.contactNumberController.text = arabicToEnglish(value.trim());
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
                  hint: "كود الدولة",
                  readOnly : true,
                  validator: (value) {
                    if(addPropertyCtr.selectedCountryCode.value.isEmpty){
                      return "هذا الحقل مطلوب";
                    }
                    return null;
                  },
                  prefixIcon: CountryCodePicker(
                    onChanged: (country) {
                      addPropertyCtr.selectedCountryCode.value = country.dialCode ?? '+963';
                    },
                    initialSelection: addPropertyCtr.selectedCountryCode.value,
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

          const SizedBox(height: 16), // مسافة بين الصفوف والحقل التالي

          CustomTextFormField(
            controller: addPropertyCtr.contactNameController,
            label: "اسم جهة الاتصال",
            hint: "أحمد",
            validator: (value) {
              if(value == null || value.isEmpty){
                return "هذا الحقل مطلوب";
              }
              return null;
            },
          ),

          const SizedBox(height: 16),

          CustomTextFormField(
            controller: addPropertyCtr.rulesController,
            label: "القواعد الخاصة بالعقار",
            hint: "أن يُسلم العقار نظيفاً",
            maxLines: 4,
            validator: (value) {
              if(value == null || value.isEmpty){
                return "هذا الحقل مطلوب";
              }
              return null;
            },
          ),

          const SizedBox(height: 8), // مسافة أسفل الحقل الأخير
        ],
      ),
    );
  }
}
