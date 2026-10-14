import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/features/home_section/view/home_screen.dart'; // افترض أنك تستخدم GetX لـ Snackbar
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

// دالة لعرض Bottom Sheet عند الضغط على خيار الحذف
void showDeleteConfirmationBottomSheet(String propertyId, String ownerId) {
  final TextEditingController reasonController = TextEditingController();
  var isConfirmed = false.obs;
  var isDeleting = false.obs;


  Get.bottomSheet(
    StatefulBuilder(
      builder: (BuildContext context, StateSetter setState) {
        return Obx(
          () => Container(
            height: isConfirmed.value ? Get.height * 0.5 : Get.height * 0.3,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(
                top: Radius.circular(20)
              )
            ),
            padding: const EdgeInsets.all(16.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const Text(
                  'هل أنت متأكد من حذف العقار؟',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                Obx(() {
                  if(isConfirmed.value == false){
                    return Container(
                      margin: EdgeInsets.only(top: 30),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          SizedBox(
                            width: Get.width * 0.5,
                            child: CustomButton(
                              text: "نعم متأكد", 
                              backgroundColor: Colors.red,
                              foregroundColor: Colors.white,
                              onPressed: () {
                                isConfirmed.value = true;
                              },
                            ),
                          ),
                          SizedBox(
                            width: Get.width * 0.4,
                            child: CustomButton(
                              text: 'لا',
                              backgroundColor: Colors.grey,
                              foregroundColor: Colors.white,
                              onPressed: () => safeBack(),
                            ),
                          )
                        ],
                      ),
                    );
                  } else {
                    return Column(
                      children: [
                      const Text(
                        'الرجاء إدخال سبب الحذف:',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        "(سيتم إرساله لصاحب العقار)",
                        style: TextStyle(fontSize: 16, color: Colors.grey),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      CustomTextFormField(
                        controller: reasonController,
                        hint: 'سبب الحذف...',
                        maxLines: 3,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          SizedBox(
                            width: Get.width * 0.5,
                            child: CustomButton(text: "حذف", 
                              backgroundColor: Colors.red,
                              foregroundColor: Colors.white,
                              isLoading: isDeleting,
                              onPressed: () async {
                                final String reason = reasonController.text.trim();
                                if (reason.isEmpty) {
                                  showSnackBar('خطأ', 'يرجى إدخال سبب الحذف', backgroundColor: Colors.red);
                                  return;
                                }
                                isDeleting.toggle();
                                await deleteProperty(propertyId, ownerId, reason);
                                isDeleting.toggle();
                                safeBack();
                              },
                            ),
                          ),
                          SizedBox(
                            width: Get.width * 0.35,
                            child: CustomButton(text: "إلغاء", 
                            isLoading: isDeleting,
                              backgroundColor: Colors.grey,
                              foregroundColor: Colors.white,
                              onPressed: () => safeBack(),
                            ),
                          )
                        ],
                      ),
                      ],
                    );
                  }
                },)
              ],
            ),
          ),
        );
      },
    ),
    isScrollControlled: true, // للسماح بظهور الكيبورد
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
  );
}

// دالة لتنفيذ عملية الحذف
Future<void> deleteProperty(String propertyId, String ownerId, String reason) async {
  try {
    final FirebaseFirestore firestore = FirebaseFirestore.instance;
    final FirebaseStorage storage = FirebaseStorage.instance;

    // 1. جلب البيانات الرئيسية للعقار للحصول على قائمة الصور
    final propRef = firestore.collection('properties').doc(propertyId);
    final propSnap = await propRef.get();
    if (propSnap.exists) {
      final data = propSnap.data()!;
      final List<dynamic>? images = data['images'];

      log("images: ${images}");
      // حذف الصور من Storage إذا كانت القائمة غير فارغة
      if (images != null && images.isNotEmpty) {
        for (var imageUrl in images) {
          if (imageUrl is String && imageUrl.isNotEmpty) {
            try {
              await storage.refFromURL(imageUrl).delete();
            } catch (e) {
              // يمكن تسجيل الخطأ هنا، لكن نستمر في الحذف
              print('Error deleting image: $e');
            }
          }
        }
      }
    }

    // 2. حذف subcollection 'panorama_tour' وصورها (إذا وجدت)
    final tourRef = firestore.collection('properties').doc(propertyId).collection('panorama_tour').doc('main');
    final tourSnap = await tourRef.get();
    if (tourSnap.exists) {
      final tourData = tourSnap.data()!;
      final List<dynamic>? tourImages = tourData['images']; // افترض أن هناك حقل 'images' في الـ panorama_tour
      log("all panorama image url: ${tourImages}");

      if (tourImages != null && tourImages.isNotEmpty) {
        for (var item in tourImages) {
          var imageUrl = item['url'] ?? '';
          if(imageUrl != ''){
            log("panorama image url: ${imageUrl}");
            log("panorama image url: ${imageUrl}");
            try {
              await storage.refFromURL(imageUrl).delete();
            } catch (e) {
              log('Error deleting panorama image: $e');
            }
            // await storage.refFromURL(imageUrl).delete();
          }
        }
      }

      // // حذف الـ document الخاص بالـ panorama_tour
      await tourRef.delete();
    }

    // 3. حذف الـ document الرئيسي للعقار
    await propRef.delete();

    // 4. إزالة الـ ID من array 'properties' في وثيقة المستخدم
    final userRef = firestore.collection('users').doc(ownerId);
    await userRef.update({
      'properties': FieldValue.arrayRemove([propertyId]),
    });

    // 5. إرسال إشعار للمستخدم بسبب الحذف
    final notifRef = firestore.collection('users').doc(ownerId).collection('notifications').doc();
    await notifRef.set({
      'id': notifRef.id,
      'type': 'reject',
      'title': 'تم حذف عقارك!',
      'message': 'سبب الحذف: $reason',
      'propertyId': propertyId,
      'read': false,
      'created_at': FieldValue.serverTimestamp(),
    });

    Get.offAll(() => HomeScreen());

    showSnackBar('تم بنجاح', 'تم حذف العقار', backgroundColor: Colors.green);
  } catch (e) {
    showSnackBar('فشل', 'حدث خطأ أثناء الحذف: $e', backgroundColor: Colors.red);
  }
}