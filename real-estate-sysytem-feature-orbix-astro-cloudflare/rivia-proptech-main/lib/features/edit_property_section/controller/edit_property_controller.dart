// lib/features/edit_property_section/controller/edit_property_controller.dart

import 'dart:io';
import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/mappers/property_mapper.dart';

class EditPropertyController extends GetxController {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // form key + controllers (مثل AddPropretyController)
  GlobalKey<FormState> formKey = GlobalKey();

  var titleController = TextEditingController();
  var descriptionController = TextEditingController();
  var dailyPriceController = TextEditingController();
  var areaController = TextEditingController();
  var nightlyPriceController = TextEditingController();
  var sellingPriceController = TextEditingController();
  var addressController = TextEditingController();
  var countryController = TextEditingController();
  var cityController = TextEditingController();
  var bedRoomsController = TextEditingController();
  var bathRoomsController = TextEditingController();
  var contactNumberController = TextEditingController();
  var contactNameController = TextEditingController();
  var propertyCategoryCtr = TextEditingController();
  var rulesController = TextEditingController();

  RxString daileySelectedCurrency = "ليرة سورية".obs;
  RxString nightlySelectedCurrency = "ليرة سورية".obs;
  RxString sellingSelectedCurrency = "ليرة سورية".obs;
  RxString selectedAreaUnit = "متر مربع".obs;
  RxString selectedPropertyType = "إيجار".obs;

  final RxString selectedCategoryId = ''.obs;
  RxBool isLoadingCategories = true.obs;
  RxList<Map<String, dynamic>> propertyCategories =
      <Map<String, dynamic>>[].obs;
  String propertyOwnerId = '';

  // الصور:
  // - existingImageUrls: صور مخزنة مسبقًا (Strings)
  // - newImages: صور محلية يتم إضافتها في التحرير
  var existingImageUrls = <String>[].obs;
  var newImages = <File>[].obs;

  // panorama tour (من المستند main)
  var panoramaTour = Rxn<Map<String, dynamic>>();

  // الميزات
  var features = [].obs;
  RxList<RxBool> selectedFeaturesCtr = <RxBool>[].obs;

  // حالات تحميل
  var isLoading = false.obs;
  var isUploading = false.obs;
  var uploadImagesStatus = <String>[].obs; // 'pending','success','failed'
  var uploadedPanoramaStatus = <String>[].obs;

  // حفظ property id محلياً
  String propertyId = '';

  @override
  void onInit() {
    super.onInit();
    loadFeaturesData();
    loadPropertyCategories();
  }

  @override
  void onClose() {
    titleController.dispose();
    descriptionController.dispose();
    dailyPriceController.dispose();
    areaController.dispose();
    nightlyPriceController.dispose();
    sellingPriceController.dispose();
    addressController.dispose();
    countryController.dispose();
    cityController.dispose();
    bedRoomsController.dispose();
    bathRoomsController.dispose();
    contactNumberController.dispose();
    contactNameController.dispose();
    propertyCategoryCtr.dispose();
    rulesController.dispose();
    super.onClose();
  }

  // ========== تحميل الخصائص العامة (features + categories) ==========
  Future<void> loadFeaturesData() async {
    try {
      final doc = await _firestore.collection('features').doc('global').get();
      features.value = List<String>.from(doc.data()?['list'] ?? []);
      selectedFeaturesCtr.value =
          List.generate(features.length, (index) => false.obs);
    } catch (e) {
      log("loadFeaturesData error: $e");
    }
  }

  Future<void> loadPropertyCategories() async {
    try {
      isLoadingCategories.value = true;
      final snapshot = await _firestore
          .collection('property_category')
          .orderBy('created_at')
          .get();
      final List<Map<String, dynamic>> categories = snapshot.docs.map((d) {
        return {'id': d.id, 'title': d.data()['title'] ?? 'غير محدد'};
      }).toList();
      propertyCategories.assignAll(categories);
      if (categories.isNotEmpty && selectedCategoryId.value.isEmpty) {
        selectedCategoryId.value = categories.first['id'];
      }
    } catch (e) {
      log("loadPropertyCategories error: $e");
    } finally {
      isLoadingCategories.value = false;
    }
  }

  // ========== تحميل بيانات العقار بالكامل حسب id ==========
  Future<void> loadPropertyById(String id, Map property) async {
    try {
      propertyId = id;
      propertyOwnerId = property['ownerId'];
      // isLoading.value = true;
      // propertyId = id;

      // // تحميل المستند الرئيسي
      // final doc = await _firestore.collection('properties').doc(id).get();
      // if (!doc.exists) {
      //   showSnackBar("خطأ", "العقار غير موجود");
      //   return;
      // }

      // final data = doc.data()!;
      // ملأ الحقول
      titleController.text = property['title']?.toString() ?? '';
      descriptionController.text = property['description']?.toString() ?? '';
      addressController.text = property['address']?.toString() ?? '';
      countryController.text = property['country']?.toString() ?? '';
      cityController.text = property['city']?.toString() ?? '';
      areaController.text = property['area']?.toString() ?? '';
      selectedAreaUnit.value = property['area_unit'] ?? selectedAreaUnit.value;
      bedRoomsController.text = property['bedrooms']?.toString() ?? '';
      bathRoomsController.text = property['bathrooms']?.toString() ?? '';
      rulesController.text = property['rules']?.toString() ?? '';
      contactNumberController.text = (property['contact_number'] ?? '')
          .toString() /* .replaceFirst(RegExp(r'^\+?\d+'), '').trim() */;
      contactNameController.text = property['contact_name']?.toString() ?? '';

      // النوع والأسعار
      selectedPropertyType.value =
          property['property_type'] ?? selectedPropertyType.value;
      if (selectedPropertyType.value == 'إيجار') {
        dailyPriceController.text = property['daily_price']?.toString() ?? '';
        daileySelectedCurrency.value =
            property['daily_price_currency'] ?? daileySelectedCurrency.value;
        nightlyPriceController.text =
            property['nightly_price']?.toString() ?? '';
        nightlySelectedCurrency.value =
            property['nightly_currency'] ?? nightlySelectedCurrency.value;
      } else if (selectedPropertyType.value == 'بيع') {
        sellingPriceController.text =
            property['selling_price']?.toString() ?? '';
        sellingSelectedCurrency.value =
            property['selling_price_currency'] ?? sellingSelectedCurrency.value;
      }

      // الفئة
      selectedCategoryId.value = property['property_category_id']?.toString() ??
          selectedCategoryId.value;
      propertyCategoryCtr.text =
          property['property_category_title']?.toString() ?? '';

      // images
      existingImageUrls.assignAll(List<String>.from(property['images'] ?? []));
      // تأكد من وجود mainImage
      if ((property['mainImage'] ?? '').toString().isNotEmpty &&
          !existingImageUrls.contains(property['mainImage'])) {
        existingImageUrls.insert(0, property['mainImage']);
      }

      // الميزات: اختيار المفعلة
      final List existingFeatures = List.from(property['features'] ?? []);
      await loadFeaturesData(); // اضمن أن features محملة
      for (int i = 0; i < features.length; i++) {
        selectedFeaturesCtr[i].value = existingFeatures.contains(features[i]);
      }

      // panorama_tour/main
      final panDoc = await _firestore
          .collection('properties')
          .doc(id)
          .collection('panorama_tour')
          .doc('main')
          .get();

      if (panDoc.exists) {
        panoramaTour.value = Map<String, dynamic>.from(panDoc.data()!);
      } else {
        panoramaTour.value = null;
      }
    } catch (e, s) {
      log("loadPropertyById error: $e", stackTrace: s);
      showSnackBar("خطأ", "فشل جلب بيانات العقار: $e",
          backgroundColor: Colors.red);
    } finally {
      isLoading.value = false;
    }
  }

  // ========== إضافة / حذف صور محلية ==========
  void addNewImage(File file) {
    newImages.add(file);
  }

  void removeExistingImageAt(int index) {
    if (index >= 0 && index < existingImageUrls.length) {
      existingImageUrls.removeAt(index);
    }
  }

  void removeNewImageAt(int index) {
    if (index >= 0 && index < newImages.length) {
      newImages.removeAt(index);
    }
  }

  // ========== رفع صورة واحدة إلى Storage ==========
  Future<String> _uploadFile(File file, String folder) async {
    final user = FirebaseAuth.instance.currentUser;
    log("DEBUG: currentUser.uid = ${user?.uid}");
    log("DEBUG: propertyOwnerId = $propertyOwnerId");
    if (user == null) throw Exception("المستخدم غير مسجل");

    // optional: جلب doc المستخدم من Firestore للتأكد من وجود role
    final userDoc = await FirebaseFirestore.instance
        .collection('users')
        .doc(user.uid)
        .get();
    log("DEBUG: userDoc.exists=${userDoc.exists}, role=${userDoc.data()?['role']}");

    final fileName = '${DateTime.now().millisecondsSinceEpoch}.jpg';
    final ref =
        _storage.ref().child('properties/$propertyOwnerId/$folder/$fileName');
    log("DEBUG: uploading to path: properties/$propertyOwnerId/$folder/$fileName");

    final task = await ref.putFile(file); // <-- ستفشل هنا إن لم تُطابق القواعد
    final url = await ref.getDownloadURL();
    return url;
  }

  // ========== حفظ التعديلات (update) ==========
  Future<void> updateProperty() async {
    if (propertyId.isEmpty) {
      showSnackBar("خطأ", "معرّف العقار غير محدد");
      return;
    }

    if (!formKey.currentState!.validate()) {
      showSnackBar("تنبيه", "يرجى مراجعة الحقول",
          backgroundColor: Colors.orange);
      return;
    }

    try {
      // 1) رفع الصور الجديدة (إن وُجدت)
      List<String> newUploadedUrls = [];
      uploadImagesStatus.value =
          List.generate(newImages.length, (i) => "pending");
      for (int i = 0; i < newImages.length; i++) {
        try {
          final url = await _uploadFile(newImages[i], 'property_images');
          newUploadedUrls.add(url);
          uploadImagesStatus[i] = "success";
        } catch (e) {
          uploadImagesStatus[i] = "failed";
          log("upload image error: $e");
        }
      }

      log("Existing images: $existingImageUrls");
      log("New images count: ${newImages.length}");

      // 2) اجمع قائمة الصور النهائية: existingImageUrls + newUploadedUrls
      final List<String> finalImages = [
        ...existingImageUrls,
        ...newUploadedUrls
      ];

      // 3) mainImage: إذا كانت القائمة جديدة فارغة احتفظ بالقيمة القديمة (إذا كانت موجودة)
      final String mainImage = finalImages.isNotEmpty ? finalImages.first : '';

      // 4) اجمع الميزات المختارة
      List<String> selectedFeaturesAsString = [];
      for (int i = 0; i < features.length; i++) {
        if (selectedFeaturesCtr[i].value)
          selectedFeaturesAsString.add(features[i]);
      }

      log("Uploaded URLs: $newUploadedUrls");

      // 5) جهّز خريطة التحديث
      Map<String, dynamic> updateData = {
        "title": titleController.text.trim(),
        "description": descriptionController.text.trim(),
        "property_type": selectedPropertyType.value,
        "city": cityController.text.trim(),
        "country": countryController.text.trim(),
        "address": addressController.text.trim(),
        "area": int.tryParse(areaController.text.trim()) ?? 0,
        "area_unit": selectedAreaUnit.value,
        "bathrooms": int.tryParse(bathRoomsController.text.trim()) ?? 0,
        "bedrooms": int.tryParse(bedRoomsController.text.trim()) ?? 0,
        "features": selectedFeaturesAsString,
        "mainImage": mainImage,
        "images": finalImages,
        "property_category_title": propertyCategoryCtr.text.trim(),
        "property_category_id": selectedCategoryId.value,
        "contact_number": contactNumberController.text.trim(),
        "contact_name": contactNameController.text.trim(),
        "rules": rulesController.text.trim(),
        "updatedAt": FieldValue.serverTimestamp(),
      };

      if (selectedPropertyType.value == "إيجار") {
        updateData.addAll({
          "daily_price": dailyPriceController.text.trim(),
          "daily_price_currency": daileySelectedCurrency.value,
          "nightly_price": nightlyPriceController.text.trim(),
          "nightly_currency": nightlySelectedCurrency.value,
        });
        // remove selling fields optionally
        updateData['selling_price'] = FieldValue.delete();
        updateData['selling_price_currency'] = FieldValue.delete();
      } else if (selectedPropertyType.value == "بيع") {
        updateData.addAll({
          "selling_price":
              sellingPriceController.text.trim().replaceAll(',', ''),
          "selling_price_currency": sellingSelectedCurrency.value,
        });
        // remove rent fields optionally
        updateData['daily_price'] = FieldValue.delete();
        updateData['daily_price_currency'] = FieldValue.delete();
        updateData['nightly_price'] = FieldValue.delete();
        updateData['nightly_currency'] = FieldValue.delete();
      }

      // 6) نفّذ التحديث على المستند
      await _firestore
          .collection('properties')
          .doc(propertyId)
          .update(canonicalPropertyWriteMap(updateData));

      // 7) تحديث panorama_tour/main إذا تم تغييره (panoramaTour.value != null)
      if (panoramaTour.value != null) {
        await _firestore
            .collection('properties')
            .doc(propertyId)
            .collection('panorama_tour')
            .doc('main')
            .set({
          "images": panoramaTour.value!['images'] ?? [],
          "updated_at": FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
      }

      showSnackBar("تم", "تم حفظ التعديلات بنجاح",
          backgroundColor: Colors.green);
      // بعد الحفظ يمكنك إغلاق الصفحة أو إعادة تحميل البيانات بحسب رغبتك
      // safeBack();
    } catch (e, s) {
      log("updateProperty error: $e", stackTrace: s);
      showSnackBar("خطأ", "فشل حفظ التعديلات: $e", backgroundColor: Colors.red);
    } finally {}
  }

  Future<void> submitEditRequest(Map property) async {
    if (propertyId.isEmpty) {
      showSnackBar("خطأ", "معرّف العقار غير محدد");
      return;
    }

    if (!formKey.currentState!.validate()) {
      showSnackBar("تنبيه", "يرجى مراجعة الحقول",
          backgroundColor: Colors.orange);
      return;
    }

    try {
      isUploading.value = true;
      // رفع الصور الجديدة (إن وُجدت)
      List<String> newUploadedUrls = [];
      uploadImagesStatus.value =
          List.generate(newImages.length, (i) => "pending");
      for (int i = 0; i < newImages.length; i++) {
        try {
          final url = await _uploadFile(newImages[i], 'property_images');
          newUploadedUrls.add(url);
          uploadImagesStatus[i] = "success";
        } catch (e) {
          uploadImagesStatus[i] = "failed";
          log("upload image error: $e");
        }
      }

      log("Existing images: $existingImageUrls");
      log("New images count: ${newImages.length}");

      // اجمع قائمة الصور النهائية: existingImageUrls + newUploadedUrls
      final List<String> finalImages = [
        ...existingImageUrls,
        ...newUploadedUrls
      ];

      // mainImage: إذا كانت القائمة جديدة فارغة احتفظ بالقيمة القديمة (إذا كانت موجودة)
      final String mainImage = finalImages.isNotEmpty ? finalImages.first : '';

      // اجمع الميزات المختارة
      List<String> selectedFeaturesAsString = [];
      for (int i = 0; i < features.length; i++) {
        if (selectedFeaturesCtr[i].value)
          selectedFeaturesAsString.add(features[i]);
      }

      log("Uploaded URLs: $newUploadedUrls");

      // تجهيز البيانات
      Map<String, dynamic> updateData = {
        "id": property['id'],
        "originalPropertyId": property['id'],
        "status": "pending",
        "request_type": "edit",
        "isVisible": true,
        "title": titleController.text.trim(),
        "description": descriptionController.text.trim(),
        "property_type": selectedPropertyType.value,
        "city": cityController.text.trim(),
        "country": countryController.text.trim(),
        "address": addressController.text.trim(),
        "area": int.tryParse(areaController.text.trim()) ?? 0,
        "area_unit": selectedAreaUnit.value,
        "bathrooms": int.tryParse(bathRoomsController.text.trim()) ?? 0,
        "bedrooms": int.tryParse(bedRoomsController.text.trim()) ?? 0,
        "features": selectedFeaturesAsString,
        "mainImage": mainImage,
        "images": finalImages,
        "property_category_title": propertyCategoryCtr.text.trim(),
        "property_category_id": selectedCategoryId.value,
        "contact_number": contactNumberController.text.trim(),
        "contact_name": contactNameController.text.trim(),
        "rules": rulesController.text.trim(),
        "ownerId": property['ownerId'],
        "created_at": property['created_at'],
        "updatedAt": FieldValue.serverTimestamp(),
      };

      if (selectedPropertyType.value == "إيجار") {
        updateData.addAll({
          "daily_price": dailyPriceController.text.trim(),
          "daily_price_currency": daileySelectedCurrency.value,
          "nightly_price": nightlyPriceController.text.trim(),
          "nightly_currency": nightlySelectedCurrency.value,
        });
        updateData.remove('selling_price');
        updateData.remove('selling_price_currency');
      } else if (selectedPropertyType.value == "بيع") {
        updateData.addAll({
          "selling_price":
              sellingPriceController.text.trim().replaceAll(',', ''),
          "selling_price_currency": sellingSelectedCurrency.value,
        });
        updateData.remove('daily_price');
        updateData.remove('daily_price_currency');
        updateData.remove('nightly_price');
        updateData.remove('nightly_currency');
      }

      // إرسال الطلب إلى property_requests
      final request = await _firestore
          .collection('property_requests')
          .add(canonicalPropertyWriteMap(updateData));

      // تحديث panorama_tour/main إذا تم تغييره
      if (panoramaTour.value != null) {
        List<Map<String, dynamic>> uploadedPanoramaImages = [];
        List<String> uploadedPanoramaStatus = List.generate(
            panoramaTour.value!['images'].length, (index) => "pending");

        // التعامل مع الصور وتحميلها إلى Firebase Storage إذا كانت محلية
        int index = 0;
        for (var img in panoramaTour.value!['images']) {
          bool isNetworkImage = false;
          if (img['url'] != null) {
            isNetworkImage = true;
          }
          var localPath = '';
          if (isNetworkImage == false) {
            localPath = img['path'] as String;
          }
          final name = img['name'] as String;
          final buttons = List<Map<String, dynamic>>.from(img['buttons'] ?? []);

          var panoramaUrl = '';
          if (isNetworkImage == false) {
            panoramaUrl = await uploadImage(File(localPath), "panorama_tours");
          }

          uploadedPanoramaImages.add({
            "url": isNetworkImage ? img['url'] : panoramaUrl,
            "name": name,
            "buttons": buttons,
          });

          uploadedPanoramaStatus[index] = "success";
          index++;
        }

        // الآن نقوم بتخزين البيانات في Firestore داخل subcollection الخاصة بالطلب
        if (uploadedPanoramaImages.isNotEmpty) {
          await request.collection('panorama_tour').doc('main').set({
            "images": uploadedPanoramaImages,
            "created_at": FieldValue.serverTimestamp(),
          });

          log("Panorama tour images successfully uploaded and saved.");
        }
      }

      safeBack();
      showSnackBar("تم", "تم إرسال طلب التعديل بنجاح",
          backgroundColor: Colors.green);
    } catch (e, s) {
      log("submitEditRequest error: $e", stackTrace: s);
      showSnackBar("خطأ", "فشل في إرسال طلب التعديل: $e",
          backgroundColor: Colors.red);
    } finally {
      isUploading.value = false;
    }
  }

  void safeBack({dynamic result}) {
    if (Get.isSnackbarOpen) {
      Get.closeCurrentSnackbar();
    }
    if (Navigator.canPop(Get.context!)) {
      Navigator.of(Get.context!).pop(result);
    }
  }

  Future<String> uploadImage(File file, String folder) async {
    if (!await file.exists()) {
      throw Exception("الملف غير موجود: ${file.path}");
    }

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) throw Exception("المستخدم غير مسجل دخول");

    final userId = user.uid;
    final fileName = '${DateTime.now().millisecondsSinceEpoch}.jpg';
    final ref = FirebaseStorage.instance
        .ref()
        .child('properties/$userId/$folder/$fileName');

    log("رفع الصورة إلى: properties/$userId/$folder/$fileName");
    log("المسار المحلي: ${file.path}");

    try {
      final snapshot = await ref.putFile(file);

      if (snapshot.state == TaskState.success) {
        final url = await ref.getDownloadURL();
        log("تم رفع الصورة بنجاح: $url");
        return url;
      } else {
        throw Exception("فشل رفع الصورة: حالة الرفع = ${snapshot.state}");
      }
    } on FirebaseException catch (e) {
      throw Exception("فشل رفع الصورة: ${e.message}");
    }
  }
}
