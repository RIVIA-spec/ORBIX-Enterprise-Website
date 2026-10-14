// lib/features/edit_property_section/view/edit_property_screen.dart

import 'dart:developer';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';

import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/no_data_with_refresh_indicator.dart';
import 'package:real_estate_app/features/edit_property_section/widget/edit_basic_property_details.dart';
import 'package:real_estate_app/features/edit_property_section/widget/edit_contact_info_and_rules.dart';
import 'package:real_estate_app/features/edit_property_section/widget/edit_convience.dart';
import 'package:real_estate_app/features/edit_property_section/widget/edit_photo_details.dart';
import 'package:real_estate_app/features/edit_property_section/widget/edit_site_detials.dart';

import '../controller/edit_property_controller.dart';
import '../../capture_photo_section/view/capture_view.dart'; // reuse
import '../../panorama_tour_viewer_section/view/panorama_viewer_screen.dart';
import '../../add_property_section/widget/basic_property_details.dart' as basic_widgets;
import '../../add_property_section/widget/property_photos.dart' as photos_widgets;
import '../../add_property_section/widget/convenience.dart' as conv_widgets;
import '../../add_property_section/widget/contact_info_and_rules.dart' as contact_widgets;

class EditPropertyScreen extends StatelessWidget {
  final Map proporty;
  final bool? isPropertyOwner;
  EditPropertyScreen({super.key, required this.proporty, this.isPropertyOwner});

  final EditPropertyController ctr = Get.put(EditPropertyController());

  @override
  Widget build(BuildContext context) {
    ctr.loadPropertyById(proporty['id'], proporty);

    return Scaffold(
      appBar: CustomAppBar(title: "تعديل بيانات العقار"),
      body: Obx(() {
        if (ctr.isLoading.value) {
          return LoadingDiscreteCircular();
        }

        // إن لم تُحمّل البيانات بعد (قارن بوجود title أو الصور)
        if (ctr.titleController.text.isEmpty && ctr.existingImageUrls.isEmpty && ctr.panoramaTour.value == null) {
          // قد يعني أن التحميل لم ينتهِ أو أن الحقول فارغة; اترك واجهة الانتظار الخفيفة:
          return LoadingDiscreteCircular();
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(8),
          child: Form(
            key: ctr.formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                // ==== Basic details (نفس الواجهة ولكن نستخدم بيانات controller) ====
                // يمكنك إعادة استخدام BasicPropertyDetails widget إن كان يعتمد على نفس controller
                // هنا سأعرض حقول بسيطة (يمكن استبدالها بمكوناتك المستعملة في AddProperty)
                SizedBox(height: 8),

                EditBasicPropertyDetails(),

                const SizedBox(height: 12),

                // ===== الصور القديمة + صور جديدة (Grid) =====
                EditPhotoDetails(),

                const SizedBox(height: 16),

                // ==== باقي الحقول: الموقع، المساحة، الأسعار، الوسائل، القواعد ====
                // يمكنك استبدال هذا الجزء باستدعاء الويجتات التي لديك (SiteDetails, Convenience, ContactInfoAndRules)
                // مثال: SiteDetails() but ensure it uses the same controller (EditPropertyController)
                EditSiteDetials(), // تأكد من أن SiteDetails يستخدم Get.find<EditPropertyController>()
                const SizedBox(height: 8),
                EditConvience(),
                const SizedBox(height: 8),
                EditContactInfoAndRules(),

                const SizedBox(height: 18),

                // زر الحفظ
                Center(
                  child: CustomButton(
                    width: Get.width * 0.8,
                    text: isPropertyOwner == true? "إرسال طلب تعديل" : "حفظ التعديلات", 
                    isLoading: ctr.isUploading,
                    onPressed: ctr.isUploading.value ? null : () {
                      if(isPropertyOwner == true){
                        final UserController userCtr = Get.find<UserController>();
                  
                        log("owner id: ${proporty['ownerId']}");
                        log("this user id: ${userCtr.userId.value}");
                        ctr.submitEditRequest(proporty);
                      }
                      else {
                        ctr.updateProperty();
                      }
                    },
                  ),
                ),
                const SizedBox(height: 30),
              ],
            ),
          ),
        );
      }),
    );
  }
}
