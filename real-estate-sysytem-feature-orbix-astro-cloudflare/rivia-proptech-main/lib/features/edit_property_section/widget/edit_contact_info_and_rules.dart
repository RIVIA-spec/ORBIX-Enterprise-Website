import 'package:country_code_picker/country_code_picker.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/functions/arabic_to_english_numbers.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/section_container.dart';
import 'package:real_estate_app/features/add_property_section/controller/add_proprety_controller.dart';
import 'package:real_estate_app/features/edit_property_section/controller/edit_property_controller.dart';

class EditContactInfoAndRules extends StatelessWidget {
  const EditContactInfoAndRules({super.key});

  @override
  Widget build(BuildContext context) {
    final editPropertyCtr = Get.find<EditPropertyController>();
    final Color primaryBlue = const Color(0xFF3C83F6);

    return SectionContainer(
      title: "معلومات الاتصال و القواعد",
      subtitle: "حدد معلومات الاتصال الخاصة بك و قواعد العقار",
      color: primaryBlue,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          CustomTextFormField(
            controller: editPropertyCtr.contactNumberController,
            label: "رقم هاتف الاتصال",
            hint: "98877.....",
            keyboardType: TextInputType.phone,
            validator: (value) {
              if(value == null || value.isEmpty){
                return "هذا الحقل مطلوب";
              }
              return null;
            },
          ),
          // Row(
          //   mainAxisAlignment: MainAxisAlignment.spaceBetween,
          //   children: [
          //     SizedBox(
          //       width: Get.width * 0.45,
          //       child: 
                
          //     ),

          //     SizedBox(
          //       width: Get.width * 0.35,
          //       child: CustomTextFormField(
          //         label: "كود الدولة",
          //         hint: "كود الدولة",
          //         readOnly : true,
          //         validator: (value) {
          //           if(editPropertyCtr.selectedCountryCode.value.isEmpty){
          //             return "هذا الحقل مطلوب";
          //           }
          //           return null;
          //         },
          //         prefixIcon: CountryCodePicker(
          //           onChanged: (country) {
          //             editPropertyCtr.selectedCountryCode.value = country.dialCode ?? '+963';
          //           },
          //           initialSelection: editPropertyCtr.selectedCountryCode.value,
          //           favorite: ['+963'],
          //           showCountryOnly: false,
          //           showOnlyCountryWhenClosed: false,
          //           alignLeft: false,
          //           textStyle: GoogleFonts.cairo(),
          //           padding: const EdgeInsets.symmetric(horizontal: 8),
          //           flagWidth: 28,
          //         ),
          //       ),
          //     ),
          //   ],
          // ),

          const SizedBox(height: 16), // مسافة بين الصفوف والحقل التالي

          CustomTextFormField(
            controller: editPropertyCtr.contactNameController,
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
            controller: editPropertyCtr.rulesController,
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
