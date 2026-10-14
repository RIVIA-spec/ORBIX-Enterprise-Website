// lib/features/admin/whatsapp_contact_page.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/functions/arabic_to_english_numbers.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/features_admin/whatsapp_contact_section/controller/whatsapp_contact_controller.dart';

class WhatsAppContactScreen extends StatelessWidget {
  const WhatsAppContactScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final WhatsappContactController whatsCtr = Get.put(WhatsappContactController());
    return Scaffold(
      appBar: CustomAppBar(title: "رقم الأدمن"),
      body: Form(
        key: whatsCtr.formKey,
        child: Obx(
          () {
            if(whatsCtr.isLoading.value){
              return LoadingDiscreteCircular();
            }
      
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
              
                  const SizedBox(height: 24),
              
                  // نموذج تحديث رقم الواتساب
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("تحديث رقم الواتساب", style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold)),
              
                          const SizedBox(height: 16),
              
                          Directionality(
                            textDirection: TextDirection.ltr,
                            child: Row(
                              children: [
                                // رمز البلد
                                SizedBox(
                                  width: 120,
                                  child: 
                                  CustomTextFormField(
                                    hint: "963",
                                    controller: whatsCtr.countryCodeController,
                                    keyboardType: TextInputType.number,
                                    prefixIcon: Icon(Icons.add, size: 20,),
                                    validator: (value) {
                                      if(value == null || value.isEmpty){
                                        return "هذا الحقل مطلوب";
                                      }
                                      else if(int.tryParse(arabicToEnglish(value.trim())) == null){
                                        return "يجب أن يكون رقماً";
                                      }
                                      whatsCtr.countryCodeController.text = arabicToEnglish(value.trim());
                                      return null;
                                    },
                                  )
                                ),
                                const SizedBox(width: 12),
                                // الرقم
                                Expanded(
                                  child: 
                                  CustomTextFormField(
                                    hint: "933 ....",
                                    controller: whatsCtr.phoneController,
                                    keyboardType: TextInputType.number,
                                    validator: (value) {
                                      if(value == null || value.isEmpty){
                                        return "هذا الحقل مطلوب";
                                      }
                                      else if(int.tryParse(arabicToEnglish(value.trim())) == null){
                                        return "يجب أن يكون رقماً";
                                      }
                                      whatsCtr.phoneController.text = arabicToEnglish(value.trim());
                                      return null;
                                    },
                                  ),
                                ),
                              ],
                            ),
                          ),
              
                          const SizedBox(height: 20),
              
                          // زر الحفظ
                          Obx(() {
                            return CustomButton(
                              text: "حفظ الرقم", 
                              width: Get.width * 0.7,
                              onPressed: whatsCtr.isUploading.value ? null : whatsCtr.saveNumber,
                              isLoading: whatsCtr.isUploading,
                              isOutlined: true,
                              borderColor: Colors.green,
                              foregroundColor: Colors.green,
                            );
                          },),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // نموذج تحديث إيميل الدعم
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Form(
                        key: whatsCtr.emailFormKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text("تحديث إيميل الدعم", style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold)),
              
                            const SizedBox(height: 16),
              
                            CustomTextFormField(
                              hint: "support@example.com",
                              controller: whatsCtr.emailController,
                              keyboardType: TextInputType.emailAddress,
                              suffixIcon: Icon(Icons.email),
                              validator: (value) {
                                if(value == null || value.isEmpty){
                                  return "هذا الحقل مطلوب";
                                }
                                else if(!GetUtils.isEmail(value.trim())){
                                  return "البريد الإلكتروني غير صالح";
                                }
                                return null;
                              },
                            ),
              
                            const SizedBox(height: 20),
              
                            // زر الحفظ
                            Obx(() {
                              return CustomButton(
                                text: "حفظ الإيميل", 
                                width: Get.width * 0.7,
                                onPressed: whatsCtr.isEmailUploading.value ? null : whatsCtr.saveEmail,
                                isLoading: whatsCtr.isEmailUploading,
                                isOutlined: true,
                                borderColor: Colors.blue,
                                foregroundColor: Colors.blue,
                              );
                            },),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}