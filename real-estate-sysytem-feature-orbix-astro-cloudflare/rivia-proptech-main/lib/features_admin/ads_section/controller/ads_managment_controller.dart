// lib/features_admin/ads/controller/ads_controller.dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/features_admin/ads_section/ad_model.dart';
import 'package:real_estate_app/features_admin/ads_section/widget/add_ad_bottom_sheet.dart';
import 'dart:io';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';


import 'package:real_estate_app/features_admin/ads_section/widget/edit_ad_bottom_sheet.dart';

class AdsManagmentController extends GetxController {
  final RxList<AdModel> ads = <AdModel>[].obs;
  final RxBool isLoading = true.obs;

  final CollectionReference adsCollection =
      FirebaseFirestore.instance.collection('ads');
  // داخل AdsManagmentController

  final Rx<File?> tempSelectedImage = Rx<File?>(null);
  final RxString tempLink = ''.obs;
  final RxBool tempIsUploading = false.obs;
  

  @override
  void onInit() {
    super.onInit();
    loadAds();
  }

  Future<void> loadAds() async {
    try {
      isLoading.value = true;
      final snapshot = await adsCollection.orderBy('order').get();
      ads.assignAll(
        snapshot.docs
            .map((doc) =>
                AdModel.fromMap(doc.id, doc.data() as Map<String, dynamic>))
            .toList(),
      );
    } catch (e) {
      showSnackBar('خطأ', 'فشل تحميل الإعلانات');
    } finally {
      isLoading.value = false;
    }
  }

  // في دالة addAd()

  Future<void> addAd() async {
    clearTempAdData();
    Get.bottomSheet(
      const AddAdBottomSheet(),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      backgroundColor: Colors.white,
    );
  }

  void clearTempAdData() {
    tempSelectedImage.value = null;
    tempLink.value = '';
    tempIsUploading.value = false;
  }

  // داخل AdsManagmentController

  Future<void> uploadNewAd({
    required File imageFile,
    required String link,
  }) async {
    try {
      final storageRef = FirebaseStorage.instance
          .ref()
          .child('ads')
          .child('${DateTime.now().millisecondsSinceEpoch}.jpg');

      await storageRef.putFile(imageFile);
      final url = await storageRef.getDownloadURL();

      final newOrder = ads.isEmpty
          ? 1
          : (ads.map((e) => e.order).reduce((a, b) => a > b ? a : b) + 1);

      await adsCollection.add({
        'imageUrl': url,
        'order': newOrder,
        'link': link,
      });

      showSnackBar('تم', 'تم إضافة الإعلان بنجاح',
          backgroundColor: Colors.green.withOpacity(0.8),
          colorText: Colors.white);

      loadAds();
    } catch (e) {
      showSnackBar('خطأ', 'فشل رفع الإعلان',
          backgroundColor: Colors.red.withOpacity(0.8));
      rethrow; // للسماح للـ BottomSheet بمعالجة الخطأ
    }
  }

  Future<void> updateAdOrder(String adId, int newOrder) async {
    await adsCollection.doc(adId).update({'order': newOrder});
    loadAds();
  }

  Future<void> showEditAdBottomSheet(AdModel ad) async {
    Get.bottomSheet(
      EditAdBottomSheet(
        ad: ad,
        onUpdate: (newImageFile, newOrder, newLink) async {
          // إضافة newLink
          try {
            String url = ad.imageUrl;
            if (newImageFile != null) {
              if (ad.imageUrl.isNotEmpty) {
                await FirebaseStorage.instance.refFromURL(ad.imageUrl).delete();
              }

              final storageRef = FirebaseStorage.instance
                  .ref()
                  .child('ads')
                  .child('${DateTime.now().millisecondsSinceEpoch}.jpg');
              await storageRef.putFile(newImageFile);
              url = await storageRef.getDownloadURL();
            }

            // معالجة تغيير الترتيب (كما هو)
            if (newOrder != ad.order) {
              for (var existingAd in ads) {
                if (existingAd.id != ad.id) {
                  if (newOrder < ad.order &&
                      existingAd.order >= newOrder &&
                      existingAd.order < ad.order) {
                    await adsCollection
                        .doc(existingAd.id)
                        .update({'order': existingAd.order + 1});
                  } else if (newOrder > ad.order &&
                      existingAd.order <= newOrder &&
                      existingAd.order > ad.order) {
                    await adsCollection
                        .doc(existingAd.id)
                        .update({'order': existingAd.order - 1});
                  }
                }
              }
            }

            await adsCollection.doc(ad.id).update({
              'imageUrl': url,
              'order': newOrder,
              'link': newLink.trim(), // تحديث الرابط
            });

            safeBack();
            showSnackBar('تم', 'تم تعديل الإعلان بنجاح',
                backgroundColor: Colors.green, colorText: Colors.white);
            loadAds();
          } catch (e) {
            showSnackBar('خطأ', 'فشل تعديل الإعلان');
          }
        },
      ),
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
    );
  }

  Future<void> showDeleteConfirmationBottomSheet(AdModel ad) async {
    final confirmed = await Get.bottomSheet<bool>(
      Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'تأكيد الحذف',
              style:
                  GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Text(
              'هل أنت متأكد من حذف هذا الإعلان؟',
              style: GoogleFonts.cairo(fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => safeBack(result: false),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey[300],
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text('لا',
                        style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => safeBack(result: true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text('نعم',
                        style: GoogleFonts.cairo(
                            fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      isScrollControlled: true,
    );

    if (confirmed == true) {
      await deleteAd(ad);
    }
  }

  Future<void> deleteAd(AdModel ad) async {
    final confirmed = await Get.dialog(
      AlertDialog(
        title: Text('تأكيد الحذف', textDirection: TextDirection.rtl),
        content: Text('هل أنت متأكد من حذف هذا الإعلان؟',
            textDirection: TextDirection.rtl),
        actions: [
          TextButton(
              onPressed: () => safeBack(result: false), child: Text('لا')),
          TextButton(
              onPressed: () => safeBack(result: true),
              child: Text('نعم', style: TextStyle(color: Colors.red))),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      // حذف الصورة من Storage
      if (ad.imageUrl.isNotEmpty) {
        final ref = FirebaseStorage.instance.refFromURL(ad.imageUrl);
        await ref.delete();
      }

      // حذف الوثيقة من Firestore
      await adsCollection.doc(ad.id).delete();

      showSnackBar('تم', 'تم حذف الإعلان بنجاح',
          backgroundColor: Colors.green.withOpacity(0.8),
          colorText: Colors.white);
      loadAds();
    } catch (e) {
      showSnackBar('خطأ', 'فشل حذف الإعلان',
          backgroundColor: Colors.red.withOpacity(0.8),
          colorText: Colors.white);
    }
  }
}
