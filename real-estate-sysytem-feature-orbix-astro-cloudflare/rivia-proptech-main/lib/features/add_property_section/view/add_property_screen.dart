import 'dart:io';

import 'package:country_code_picker/country_code_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:real_estate_app/core/functions/arabic_to_english_numbers.dart';
import 'package:real_estate_app/core/functions/number_input_formatter.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/features/add_property_section/controller/add_proprety_controller.dart';
import 'package:real_estate_app/core/widgets/section_container.dart';
import 'package:real_estate_app/features/add_property_section/widget/basic_property_details.dart';
import 'package:real_estate_app/features/add_property_section/widget/contact_info_and_rules.dart';
import 'package:real_estate_app/features/add_property_section/widget/convenience.dart';
import 'package:real_estate_app/features/add_property_section/widget/property_photos.dart';
import 'package:real_estate_app/features/add_property_section/widget/site_details.dart';
import 'package:real_estate_app/features/capture_photo_section/view/capture_view.dart';
import 'package:real_estate_app/features/panorama_tour_viewer_section/view/panorama_viewer_screen.dart';

class AddPropertyScreen extends StatelessWidget {
  final AddPropretyController addPropertyCtr = Get.put(AddPropretyController());

  final Color primaryBlue = const Color(0xFF3C83F6);
  var errorMsg = "".obs;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: "إضافة عقار"),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(5),
        child: Form(
          key: addPropertyCtr.formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              
              // التفاصيل الأساسية
              BasicPropertyDetails(),

              // معلومات الموقع
              SiteDetails(),

              // وسائل الراحة
              Convenience(),
          
              // 🟦 صور العقار
              PropertyPhotos(),
          
              SizedBox(height: 20),
              
              // القواعد ومعلومات الاتصال
              ContactInfoAndRules(),
              
              Obx(
                () {
                  if(errorMsg.value.isEmpty){
                    return SizedBox.shrink();
                  } else{
                    return SizedBox(
                      width: Get.width,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(height: 10,),
                          Container(
                            alignment: Alignment.center,
                            width: Get.width * 0.6,
                            padding: EdgeInsets.symmetric(vertical: 5),
                            decoration: BoxDecoration(
                              color: Colors.red,
                              borderRadius: BorderRadius.circular(5)
                            ),
                            child: Text(
                              errorMsg.value,
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          )
                        ],
                      ),
                    );
                  }
                },
              ),
              SizedBox(height: 10),
              Obx(() {
                if (addPropertyCtr.uploadImagesStatus.isEmpty &&
                    addPropertyCtr.uploadedPanoramaStatus.isEmpty) {
                  return SizedBox.shrink();
                }

                Widget _buildStatusIcon(String status) {
                  switch (status) {
                    case "pending":
                      return SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: Colors.blue,
                        ),
                      );
                    case "success":
                      return Icon(Icons.check_circle_outline, color: Colors.green, size: 26);
                    case "failed":
                      return Icon(Icons.close, color: Colors.red, size: 26);
                    default:
                      return SizedBox.shrink();
                  }
                }

                Widget _buildImageRow(String title, String status) {
                  return Container(
                    margin: EdgeInsets.symmetric(vertical: 6),
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    width: Get.width * 0.7,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black12,
                          blurRadius: 8,
                          offset: Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Flexible(
                          child: Text(
                            title,
                            style: GoogleFonts.cairo(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                          ),
                        ),
                        _buildStatusIcon(status),
                      ],
                    ),
                  );
                }

                return SizedBox(
                  width: Get.width,
                  child: Obx(
                    () => Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        for (var i = 0; i < addPropertyCtr.uploadImagesStatus.length; i++)
                          Obx(() => _buildImageRow(
                                "الصورة رقم ${i + 1}",
                                addPropertyCtr.uploadImagesStatus[i],
                              )),
                        for (var i = 0; i < addPropertyCtr.uploadedPanoramaStatus.length; i++)
                          Obx(() => _buildImageRow(
                                "صورة البانوراما رقم ${i + 1}",
                                addPropertyCtr.uploadedPanoramaStatus[i],
                              )),
                      ],
                    ),
                  ),
                );
              }),

              SizedBox(height: 10),
              ListTile(
                title: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 25),
                  child: ElevatedButton(
                    onPressed: () {
                      if(addPropertyCtr.formKey.currentState!.validate() == false){
                        errorMsg.value = "يرجى مراجعة البيانات";
                      }
                      else if(addPropertyCtr.formKey.currentState!.validate()){
                        errorMsg.value = "";
                        addPropertyCtr.submitPropertyRequest();
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      elevation: 5,
                    ),
                    child: Obx(
                      () => 
                      addPropertyCtr.isLoading.value ? LoadingProgressiveDots() :
                      Text("حفظ" , style: GoogleFonts.cairo())
                    ),
                  ),
                ),
              ),
              SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
