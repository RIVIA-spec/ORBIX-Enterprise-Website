import 'dart:developer';
import 'dart:io'; // ✅ مهم
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/mappers/property_mapper.dart';

class AddPropretyController extends GetxController {
  GlobalKey<FormState> formKey = GlobalKey();
  // الحقول النصية
  var latitudeController = TextEditingController();
  var longitudeController = TextEditingController();
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
  var selectedCountryCode = '+963'.obs; // اف
  var rulesController = TextEditingController();
  RxString daileySelectedCurrency = "ليرة سورية".obs;
  RxString nightlySelectedCurrency = "ليرة سورية".obs;
  RxString sellingSelectedCurrency = "ليرة سورية".obs;
  RxString selectedAreaUnit = "متر مربع".obs;
  RxString selectedPropertyType = "إيجار".obs;
  var isLoading = false.obs;
  var panoramaTour = Rxn<Map<String, dynamic>>();

  // مميزات العقار
  var features = [].obs;
  RxList<RxBool> selectedFeaturesCtr = <RxBool>[].obs;

  // أنواع العقارات
  final RxList<Map<String, dynamic>> propertyCategories =
      <Map<String, dynamic>>[].obs;
  final RxString selectedCategoryId = ''.obs; // ← نُخزن الـ ID فقط
  final RxBool isLoadingCategories = true.obs;

  // الصور (File بدل String)
  var images = <File>[].obs;

  var uploadedPanoramaStatus = [].obs;
  var uploadImagesStatus = [].obs;

  @override
  void onInit() {
    // TODO: implement onInit
    loadFeaturesData();
    loadPropertyCategories();
    super.onInit();
  }

  void addImage(File file) {
    images.add(file);
  }

  void removeImage(int index) {
    images.removeAt(index);
  }

  String getCategoryTitle(String id) {
    final cat = propertyCategories.firstWhereOrNull((c) => c['id'] == id);
    return cat?['title'] ?? 'غير محدد';
  }

  loadFeaturesData() async {
    final doc = await FirebaseFirestore.instance
        .collection('features')
        .doc('global')
        .get();

    features.value = List<String>.from(doc.data()?['list'] ?? []);
    log(features.toString());
    selectedFeaturesCtr.value = List.generate(
      features.length,
      (index) => false.obs,
    );
  }

  Future<void> loadPropertyCategories() async {
    try {
      isLoadingCategories.value = true;
      final snapshot = await FirebaseFirestore.instance
          .collection('property_category')
          .orderBy('created_at')
          .get();

      final List<Map<String, dynamic>> categories = snapshot.docs.map((doc) {
        return {
          'id': doc.id,
          'title': doc.data()['title'] ?? 'غير محدد',
        };
      }).toList();

      propertyCategories.assignAll(categories);

      // اختيار أول فئة افتراضيًا
      if (categories.isNotEmpty && selectedCategoryId.value.isEmpty) {
        selectedCategoryId.value = categories.first['id'];
      }
    } catch (e) {
      showSnackBar("خطأ", "فشل تحميل أنواع العقارات: $e");
    } finally {
      isLoadingCategories.value = false;
    }
  }

  Future<void> submitPropertyRequest() async {
    try {
      isLoading.value = true;

      final userId = FirebaseAuth.instance.currentUser?.uid;
      if (userId == null) {
        showSnackBar("خطأ", "يرجى تسجيل الدخول أولاً");
        return;
      }

      // تحقق من وجود صور عادية
      if (images.isEmpty) {
        showSnackBar("مطلوب", "يجب إضافة صورة واحدة على الأقل للعقار");
        return;
      }

      // الجولة البانوراما إلزامية الآن
      // if (panoramaTour.value == null || panoramaTour.value!['images'] == null || panoramaTour.value!['images'].isEmpty) {
      //   showSnackBar("مطلوب", "يجب إنشاء جولة بانوراما 360° للعقار", backgroundColor: Colors.red);
      //   return;
      // }

      uploadImagesStatus.value =
          List.generate(images.length, (index) => "pending");
      List<Map<String, dynamic>> uploadedPanoramaImages = [];
      final List tourImages =
          panoramaTour.value == null ? [] : panoramaTour.value!['images'];

      uploadedPanoramaStatus.value =
          List.generate(tourImages.length, (index) => "pending");
      // رفع الصور العادية
      List<String> imageUrls = [];
      var index = 0;
      for (var file in images) {
        final url = await uploadImage(file, "property_images");
        imageUrls.add(url);
        uploadImagesStatus[index] = "success";
        index++;
      }
      final String mainImageUrl = imageUrls.isNotEmpty ? imageUrls.first : "";

      index = 0;
      for (var img in tourImages) {
        final localPath = img['path'] as String;
        final name = img['name'] as String;
        final buttons = List<Map<String, dynamic>>.from(img['buttons'] ?? []);

        final panoramaUrl =
            await uploadImage(File(localPath), "panorama_tours");

        uploadedPanoramaImages.add({
          "url": panoramaUrl,
          "name": name,
          "buttons": buttons,
        });
        uploadedPanoramaStatus[index] = "success";
        index++;
      }

      // جمع الميزات
      List<String> selectedFeaturesAsString = [];
      for (int i = 0; i < features.length; i++) {
        if (selectedFeaturesCtr[i].value) {
          selectedFeaturesAsString.add(features[i]);
        }
      }

      // إنشاء العقار
      final requestRef =
          FirebaseFirestore.instance.collection('property_requests').doc();

      Map<String, dynamic> propertyData = {
        "id": requestRef.id,
        "request_type": "publish",
        "status": "pending",
        "isVisible": true,
        "title": titleController.text.trim(),
        "description": descriptionController.text.trim(),
        "property_type": selectedPropertyType.value,
        "longitude": longitudeController.text,
        "latitude": latitudeController.text,
        "city": cityController.text.trim(),
        "country": countryController.text.trim(),
        "address": addressController.text.trim(),
        "area": int.tryParse(areaController.text.trim()) ?? 0,
        "area_unit": selectedAreaUnit.value,
        "bathrooms": int.tryParse(bathRoomsController.text.trim()) ?? 0,
        "bedrooms": int.tryParse(bedRoomsController.text.trim()) ?? 0,
        "features": selectedFeaturesAsString,
        "mainImage": mainImageUrl,
        "images": imageUrls,
        "property_category_title": getCategoryTitle(selectedCategoryId.value),
        "property_category_id": selectedCategoryId.value,
        "contact_number":
            "${selectedCountryCode.value}${contactNumberController.text.trim()}",
        "contact_name": contactNameController.text.trim(),
        "rules": rulesController.text.trim(),
        "ownerId": userId,
        "created_at": FieldValue.serverTimestamp(),
        "updatedAt": FieldValue.serverTimestamp(),
      };

      if (selectedPropertyType.value == "إيجار") {
        propertyData.addAll({
          "daily_price": dailyPriceController.text.trim(),
          "daily_price_currency": daileySelectedCurrency.value,
          "nightly_price": nightlyPriceController.text.trim(),
          "nightly_currency": nightlySelectedCurrency.value,
        });
      } else if (selectedPropertyType.value == "بيع") {
        final price = sellingPriceController.text.replaceAll(',', '');
        propertyData.addAll({
          "selling_price": price.trim(),
          "selling_price_currency": sellingSelectedCurrency.value,
        });
      }

      // حفظ العقار
      await requestRef.set(canonicalPropertyWriteMap(propertyData));

      // حفظ الجولة (إلزامية الآن)
      if (uploadedPanoramaImages.isNotEmpty) {
        await requestRef.collection('panorama_tour').doc('main').set({
          "images": uploadedPanoramaImages,
          "created_at": FieldValue.serverTimestamp(),
        });
      }

      safeBack();
      showSnackBar(
        "تم بنجاح!",
        "تم إرسال الطلب للأدمن، في انتظار الموافقة",
        backgroundColor: Colors.green,
        colorText: Colors.white,
        duration: Duration(seconds: 5),
      );
    } catch (e, s) {
      log("خطأ في submitPropertyRequest: $e", stackTrace: s);
      showSnackBar("فشل", "حدث خطأ: $e", backgroundColor: Colors.red);
    } finally {
      isLoading.value = false;
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

  @override
  void onClose() {
    latitudeController.dispose();
    longitudeController.dispose();
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
    super.onClose();
  }
}
