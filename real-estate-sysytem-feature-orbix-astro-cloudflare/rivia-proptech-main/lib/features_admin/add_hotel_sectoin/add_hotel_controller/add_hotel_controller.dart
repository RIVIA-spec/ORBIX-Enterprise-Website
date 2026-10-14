import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';

// نموذج مجموعة الغرف
class RoomGroup {
  String id;
  late TextEditingController
      roomNumberPrefixController; // مثل "غرفة" أو "Suite"
  late TextEditingController dailyPriceController;
  late TextEditingController nightlyPriceController;
  late TextEditingController areaController;
  late TextEditingController bedRoomsController;
  late TextEditingController bathRoomsController;
  late TextEditingController
      roomCountController; // عدد الغرف التي تحوي نفس المعلومات
  late TextEditingController descriptionController;
  RxString dailySelectedCurrency = "ليرة سورية".obs;
  RxString nightlySelectedCurrency = "ليرة سورية".obs;
  RxString selectedAreaUnit = "متر مربع".obs;
  RxList<RxBool> selectedFeaturesCtr = <RxBool>[].obs;
  RxList<File> images = <File>[].obs;
  RxList<String> existingImageUrls = <String>[].obs; // للصور الموجودة في وضع التعديل
  Rxn<Map<String, dynamic>> panoramaTour = Rxn<Map<String, dynamic>>();

  RoomGroup({String? id})
      : id = id ?? DateTime.now().millisecondsSinceEpoch.toString() {
    roomNumberPrefixController = TextEditingController(text: "غرفة");
    dailyPriceController = TextEditingController();
    nightlyPriceController = TextEditingController();
    areaController = TextEditingController();
    bedRoomsController = TextEditingController();
    bathRoomsController = TextEditingController();
    roomCountController = TextEditingController(text: "1");
    descriptionController = TextEditingController();
  }

  void dispose() {
    roomNumberPrefixController.dispose();
    dailyPriceController.dispose();
    nightlyPriceController.dispose();
    areaController.dispose();
    bedRoomsController.dispose();
    bathRoomsController.dispose();
    roomCountController.dispose();
    descriptionController.dispose();
  }
}

class AddHotelController extends GetxController {
  GlobalKey<FormState> formKey = GlobalKey();

  // معلومات الفندق الأساسية
  var hotelNameController = TextEditingController();
  var hotelDescriptionController = TextEditingController();

  // موقع الفندق (مشترك لجميع الغرف)
  var latitudeController = TextEditingController();
  var longitudeController = TextEditingController();
  var addressController = TextEditingController();
  var countryController = TextEditingController();
  var cityController = TextEditingController();

  // معلومات الاتصال
  var contactNumberController = TextEditingController();
  var contactNameController = TextEditingController();
  var selectedCountryCode = '+963'.obs;
  var rulesController = TextEditingController();

  // قائمة مجموعات الغرف
  RxList<RoomGroup> roomGroups = <RoomGroup>[].obs;

  // صور الفندق
  RxList<File> hotelImages = <File>[].obs;
  RxList<String> existingHotelImageUrls = <String>[].obs; // للصور الموجودة في وضع التعديل

  // دوال إدارة صور الفندق
  void addNewHotelImage(File file) {
    hotelImages.add(file);
  }

  void removeExistingHotelImageAt(int index) {
    if (index >= 0 && index < existingHotelImageUrls.length) {
      existingHotelImageUrls.removeAt(index);
    }
  }

  void removeNewHotelImageAt(int index) {
    if (index >= 0 && index < hotelImages.length) {
      hotelImages.removeAt(index);
    }
  }

  // الميزات المتاحة
  var features = [].obs;

  var isLoading = false.obs;
  var isEditMode = false.obs;
  String? hotelId; // معرف الفندق في وضع التعديل

  // تتبع حالة رفع الصور
  var uploadImagesStatus = <String>[].obs; // حالة رفع صور الفندق
  var uploadedPanoramaStatus = <String>[].obs; // حالة رفع صور البانوراما

  @override
  void onInit() {
    super.onInit();
    _initializeData();
  }

  Future<void> _initializeData() async {
    // تحميل الميزات أولاً من Firebase
    await loadFeaturesData();
    
    // إذا كان في وضع التعديل، لا نضيف مجموعة افتراضية (سيتم تحميلها من البيانات)
    if (!isEditMode.value) {
      // إضافة مجموعة غرف افتراضية واحدة بعد تحميل الميزات
      addRoomGroup();
    }
  }

  // تحميل بيانات الفندق للتعديل
  Future<void> loadHotelData(String hotelId) async {
    try {
      isEditMode.value = true;
      this.hotelId = hotelId;
      isLoading.value = true;

      // تحميل بيانات الفندق
      final hotelDoc = await FirebaseFirestore.instance
          .collection('hotels')
          .doc(hotelId)
          .get();

      if (!hotelDoc.exists) {
        showSnackBar("خطأ", "الفندق غير موجود");
        safeBack();
        return;
      }

      final hotelData = hotelDoc.data()!;

      // ملء الحقول الأساسية
      hotelNameController.text = hotelData['hotel_name'] ?? '';
      hotelDescriptionController.text = hotelData['description'] ?? '';
      cityController.text = hotelData['city'] ?? '';
      countryController.text = hotelData['country'] ?? '';
      addressController.text = hotelData['address'] ?? '';
      latitudeController.text = hotelData['latitude'] ?? '';
      longitudeController.text = hotelData['longitude'] ?? '';
      contactNameController.text = hotelData['contact_name'] ?? '';
      rulesController.text = hotelData['rules'] ?? '';

      // معالجة رقم الاتصال
      final contactNumber = hotelData['contact_number'] ?? '';
      if (contactNumber.isNotEmpty) {
        // استخراج رمز الدولة
        if (contactNumber.startsWith('+963')) {
          selectedCountryCode.value = '+963';
          contactNumberController.text = contactNumber.substring(4);
        } else if (contactNumber.startsWith('963')) {
          selectedCountryCode.value = '+963';
          contactNumberController.text = contactNumber.substring(3);
        } else {
          contactNumberController.text = contactNumber;
        }
      }

      // تحميل صور الفندق الموجودة
      existingHotelImageUrls.value = List<String>.from(hotelData['images'] ?? []);

      // تحميل أنواع الغرف
      final roomTypesSnapshot = await FirebaseFirestore.instance
          .collection('hotels')
          .doc(hotelId)
          .collection('room_types')
          .get();

      // مسح المجموعات الحالية
      for (var group in roomGroups) {
        group.dispose();
      }
      roomGroups.clear();

      // تحميل كل نوع غرفة كمجموعة
      for (var roomTypeDoc in roomTypesSnapshot.docs) {
        final roomTypeData = roomTypeDoc.data();
        final newGroup = RoomGroup(id: roomTypeDoc.id);
        
        // تهيئة الميزات المختارة
        newGroup.selectedFeaturesCtr.value = List.generate(
          features.length,
          (index) {
            final featureName = features[index];
            final roomFeatures = List<String>.from(roomTypeData['features'] ?? []);
            return roomFeatures.contains(featureName).obs;
          },
        );

        // ملء بيانات نوع الغرفة
        newGroup.roomNumberPrefixController.text = roomTypeData['title'] ?? '';
        newGroup.descriptionController.text = roomTypeData['description'] ?? '';
        newGroup.areaController.text = (roomTypeData['area'] ?? 0).toString();
        newGroup.selectedAreaUnit.value = roomTypeData['area_unit'] ?? 'متر مربع';
        newGroup.bedRoomsController.text = (roomTypeData['bedrooms'] ?? 0).toString();
        newGroup.bathRoomsController.text = (roomTypeData['bathrooms'] ?? 0).toString();
        newGroup.dailyPriceController.text = roomTypeData['daily_price'] ?? '';
        newGroup.dailySelectedCurrency.value = roomTypeData['daily_price_currency'] ?? 'ليرة سورية';
        newGroup.nightlyPriceController.text = roomTypeData['nightly_price'] ?? '';
        newGroup.nightlySelectedCurrency.value = roomTypeData['nightly_currency'] ?? 'ليرة سورية';
        newGroup.roomCountController.text = (roomTypeData['total_count'] ?? 1).toString();

        // تحميل صور نوع الغرفة الموجودة
        final roomImages = List<String>.from(roomTypeData['images'] ?? []);
        newGroup.existingImageUrls.value = roomImages;

        // تحميل الجولة البانوراما
        try {
          final panoramaDoc = await FirebaseFirestore.instance
              .collection('hotels')
              .doc(hotelId)
              .collection('room_types')
              .doc(roomTypeDoc.id)
              .collection('panorama_tour')
              .doc('main')
              .get();
          
          if (panoramaDoc.exists) {
            final panoramaData = panoramaDoc.data();
            newGroup.panoramaTour.value = {
              'images': panoramaData?['images'] ?? [],
            };
          }
        } catch (e) {
          // تجاهل خطأ تحميل البانوراما
        }

        roomGroups.add(newGroup);
      }

      // إذا لم يكن هناك أنواع غرف، أضف مجموعة واحدة
      if (roomGroups.isEmpty) {
        addRoomGroup();
      }
    } catch (e) {
      showSnackBar("خطأ", "فشل تحميل بيانات الفندق: $e");
    } finally {
      isLoading.value = false;
    }
  }

  void addRoomGroup() {
    final newGroup = RoomGroup();
    // تهيئة الميزات المختارة بناءً على الميزات المحملة من Firebase
    newGroup.selectedFeaturesCtr.value = List.generate(
      features.length,
      (index) => false.obs,
    );
    roomGroups.add(newGroup);
  }

  void removeRoomGroup(int index) {
    if (roomGroups.length > 1) {
      roomGroups[index].dispose();
      roomGroups.removeAt(index);
    } else {
      showSnackBar("تحذير", "يجب أن يكون هناك مجموعة غرف واحدة على الأقل");
    }
  }


  Future<void> loadFeaturesData() async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection('features')
          .doc('global')
          .get();

      if (doc.exists && doc.data() != null) {
        features.value = List<String>.from(doc.data()?['list'] ?? []);

        // تحديث selectedFeaturesCtr لجميع المجموعات الموجودة
        for (var group in roomGroups) {
          final currentLength = group.selectedFeaturesCtr.length;
          final newLength = features.length;

          if (newLength > currentLength) {
            // إضافة ميزات جديدة
            for (int i = currentLength; i < newLength; i++) {
              group.selectedFeaturesCtr.add(false.obs);
            }
          } else if (newLength < currentLength) {
            // إزالة الميزات الزائدة
            group.selectedFeaturesCtr.removeRange(newLength, currentLength);
          }
        }
      } else {
        features.value = [];
      }
    } catch (e) {
      showSnackBar("تحذير", "فشل تحميل الميزات من Firebase: $e");
      features.value = [];
    }
  }

  Future<void> submitHotelRequest() async {
    try {
      isLoading.value = true;

      final userId = FirebaseAuth.instance.currentUser?.uid;
      if (userId == null) {
        showSnackBar("خطأ", "يرجى تسجيل الدخول أولاً");
        return;
      }

      // التحقق من صلاحيات المستخدم قبل البدء
      try {
        final userDoc = await FirebaseFirestore.instance
            .collection('users')
            .doc(userId)
            .get();
        
        if (!userDoc.exists) {
          showSnackBar("خطأ", "مستند المستخدم غير موجود في Firestore");
          return;
        }
        
        final userData = userDoc.data();
        final userRole = userData?['role'];
        
        if (userRole != 'admin' && userRole != 'owner') {
          showSnackBar(
            "خطأ في الصلاحيات",
            "يجب أن تكون admin أو owner لإنشاء فندق. دورك الحالي: ${userRole ?? 'غير محدد'}",
            duration: const Duration(seconds: 5),
          );
          return;
        }
      } catch (e) {
        showSnackBar("خطأ", "فشل التحقق من الصلاحيات: $e");
        return;
      }

      // التحقق من وجود صور الفندق (في وضع الإنشاء فقط)
      if (!isEditMode.value && hotelImages.isEmpty) {
        showSnackBar("مطلوب", "يجب إضافة صورة واحدة على الأقل للفندق");
        return;
      }
      
      // في وضع التعديل، يجب أن يكون هناك صور (إما جديدة أو موجودة)
      if (isEditMode.value && hotelImages.isEmpty && existingHotelImageUrls.isEmpty) {
        showSnackBar("مطلوب", "يجب إضافة صورة واحدة على الأقل للفندق");
        return;
      }

      // التحقق من وجود مجموعات غرف
      if (roomGroups.isEmpty) {
        showSnackBar("مطلوب", "يجب إضافة مجموعة غرف واحدة على الأقل");
        return;
      }

      // الحصول على مرجع الفندق (جديد أو موجود) - يجب أن يكون قبل التحقق من الصور
      final DocumentReference hotelRef = isEditMode.value && hotelId != null
          ? FirebaseFirestore.instance.collection('hotels').doc(hotelId)
          : FirebaseFirestore.instance.collection('hotels').doc();

      // التحقق من صحة جميع مجموعات الغرف
      for (var group in roomGroups) {
        // في وضع الإنشاء، يجب أن تكون هناك صور
        if (!isEditMode.value && group.images.isEmpty) {
          showSnackBar(
              "مطلوب", "يجب إضافة صورة واحدة على الأقل لكل مجموعة غرف");
          return;
        }
        
        // في وضع التعديل، إذا لم تكن هناك صور جديدة، يجب التحقق من وجود صور موجودة
        if (isEditMode.value && group.images.isEmpty && group.existingImageUrls.isEmpty) {
          showSnackBar(
              "مطلوب", "يجب إضافة صورة واحدة على الأقل لكل مجموعة غرف");
          return;
        }
        
        final roomCount =
            int.tryParse(group.roomCountController.text.trim()) ?? 0;
        if (roomCount <= 0) {
          showSnackBar("مطلوب", "يجب تحديد عدد الغرف بشكل صحيح");
          return;
        }
      }

      // رفع صور الفندق الجديدة مع تتبع الحالة
      List<String> newHotelImageUrls = [];
      uploadImagesStatus.value = List.generate(hotelImages.length, (index) => "pending");
      
      try {
        for (int imgIndex = 0; imgIndex < hotelImages.length; imgIndex++) {
          final file = hotelImages[imgIndex];
          try {
            final url = await uploadImage(file, "hotel_images/${hotelRef.id}");
            newHotelImageUrls.add(url);
            uploadImagesStatus[imgIndex] = "success";
          } catch (e) {
            uploadImagesStatus[imgIndex] = "failed";
            throw Exception("فشل رفع صورة الفندق ${imgIndex + 1}: $e");
          }
        }
      } catch (e) {
        throw Exception("فشل رفع صور الفندق: $e");
      }

      // دمج الصور القديمة المتبقية (بعد الحذف) مع الجديدة
      List<String> allHotelImageUrls = isEditMode.value
          ? [...existingHotelImageUrls, ...newHotelImageUrls]
          : newHotelImageUrls;

      if (allHotelImageUrls.isEmpty) {
        throw Exception("يجب إضافة صورة واحدة على الأقل للفندق");
      }

      final String mainImageUrl = allHotelImageUrls.first;

      Map<String, dynamic> hotelData = {
        "id": hotelRef.id,
        "hotel_name": hotelNameController.text.trim(),
        "description": hotelDescriptionController.text.trim(),
        "city": cityController.text.trim(),
        "country": countryController.text.trim(),
        "address": addressController.text.trim(),
        "latitude": latitudeController.text.trim(),
        "longitude": longitudeController.text.trim(),
        "contact_number":
            "${selectedCountryCode.value}${contactNumberController.text.trim()}",
        "contact_name": contactNameController.text.trim(),
        "rules": rulesController.text.trim(),
        "mainImage": mainImageUrl,
        "images": allHotelImageUrls,
        "updatedAt": FieldValue.serverTimestamp(),
      };

      // في وضع الإنشاء، أضف الحقول الإضافية
      if (!isEditMode.value) {
        hotelData.addAll({
          "status": "approved",
          "isVisible": true,
          "ownerId": userId,
          "created_at": FieldValue.serverTimestamp(),
        });
      }

      // حفظ/تحديث الفندق
      try {
        if (isEditMode.value) {
          await hotelRef.update(hotelData);
        } else {
          await hotelRef.set(hotelData);
        }
      } catch (e) {
        throw Exception("فشل حفظ بيانات الفندق: $e");
      }

      // في وضع التعديل، احصل على قائمة أنواع الغرف الموجودة
      List<String> existingRoomTypeIds = [];
      if (isEditMode.value) {
        final existingRoomTypes = await hotelRef.collection('room_types').get();
        existingRoomTypeIds = existingRoomTypes.docs.map((doc) => doc.id).toList();
      }

      // إنشاء/تحديث أنواع الغرف لكل مجموعة
      int totalRoomTypesCreated = 0;
      List<String> processedRoomTypeIds = [];
      
      for (int groupIndex = 0; groupIndex < roomGroups.length; groupIndex++) {
        final group = roomGroups[groupIndex];
        
        try {
          // رفع صور نوع الغرفة الجديدة فقط مع تتبع الحالة
          List<String> newImageUrls = [];
          final roomImagesStartIndex = uploadImagesStatus.length;
          uploadImagesStatus.addAll(List.generate(group.images.length, (index) => "pending"));
          
          for (int imgIndex = 0; imgIndex < group.images.length; imgIndex++) {
            final file = group.images[imgIndex];
            try {
              final url = await uploadImage(file, "hotel_rooms/${hotelRef.id}");
              newImageUrls.add(url);
              uploadImagesStatus[roomImagesStartIndex + imgIndex] = "success";
            } catch (e) {
              uploadImagesStatus[roomImagesStartIndex + imgIndex] = "failed";
              if (!isEditMode.value) {
                // في وضع الإنشاء، احذف الفندق إذا فشل رفع الصور
                try {
                  await hotelRef.delete();
                } catch (deleteError) {
                  // تجاهل خطأ الحذف
                }
              }
              throw Exception("فشل رفع صورة نوع الغرفة ${imgIndex + 1}: $e");
            }
          }

          // في وضع التعديل، استخدم الصور القديمة المتبقية (بعد الحذف)
          // دمج الصور القديمة المتبقية مع الجديدة
          List<String> allImageUrls = [...group.existingImageUrls, ...newImageUrls];
          final String mainImageUrl = allImageUrls.isNotEmpty ? allImageUrls.first : "";

          // رفع صور الجولة البانوراما مع تتبع الحالة
          List<Map<String, dynamic>> uploadedPanoramaImages = [];
          if (group.panoramaTour.value != null && 
              group.panoramaTour.value!['images'] != null) {
            final List tourImages = group.panoramaTour.value!['images'];
            
            // تهيئة حالة الرفع للبانوراما
            final panoramaStartIndex = uploadedPanoramaStatus.length;
            uploadedPanoramaStatus.addAll(List.generate(tourImages.length, (index) => "pending"));
            
            int panoramaIndex = 0;
            for (var img in tourImages) {
              try {
                final String? localPath = img['path'] as String?;
                final String? existingUrl = img['url'] as String?;
                final name = img['name'] as String? ?? 'غير محدد';
                final buttons = List<Map<String, dynamic>>.from(img['buttons'] ?? []);

                String panoramaUrl;
                
                if (existingUrl != null && existingUrl.isNotEmpty) {
                  // الصورة موجودة بالفعل في Firebase، استخدم URL الموجود
                  panoramaUrl = existingUrl;
                  uploadedPanoramaStatus[panoramaStartIndex + panoramaIndex] = "success";
                } else if (localPath != null && localPath.isNotEmpty) {
                  // صورة جديدة، يجب رفعها
                  panoramaUrl = await uploadImage(
                      File(localPath), "hotel_rooms/${hotelRef.id}/panorama_tours");
                  uploadedPanoramaStatus[panoramaStartIndex + panoramaIndex] = "success";
                } else {
                  // تخطي الصور التي لا تحتوي على path أو url
                  uploadedPanoramaStatus[panoramaStartIndex + panoramaIndex] = "failed";
                  panoramaIndex++;
                  continue;
                }

                uploadedPanoramaImages.add({
                  "url": panoramaUrl,
                  "name": name,
                  "buttons": buttons,
                });
                panoramaIndex++;
              } catch (e) {
                uploadedPanoramaStatus[panoramaStartIndex + panoramaIndex] = "failed";
                panoramaIndex++;
                throw Exception("فشل رفع صورة البانوراما: $e");
              }
            }
          }

          // جمع الميزات
          List<String> selectedFeaturesAsString = [];
          for (int i = 0; i < features.length; i++) {
            if (group.selectedFeaturesCtr[i].value) {
              selectedFeaturesAsString.add(features[i]);
            }
          }

          final roomCount =
              int.tryParse(group.roomCountController.text.trim()) ?? 1;
          final roomPrefix = group.roomNumberPrefixController.text.trim();
          
          // اسم نوع الغرفة
          final roomTypeName = roomPrefix.isEmpty
              ? "نوع غرفة ${groupIndex + 1}"
              : roomPrefix;

          // إنشاء/تحديث نوع غرفة
          try {
            final bool isExistingRoomType = isEditMode.value && 
                group.id.isNotEmpty && 
                existingRoomTypeIds.contains(group.id);
            
            final DocumentReference roomTypeRef = isExistingRoomType
                ? hotelRef.collection('room_types').doc(group.id)
                : hotelRef.collection('room_types').doc();

            // في وضع التعديل، احتفظ بـ available_count الحالي إذا كان موجوداً
            int currentAvailableCount = roomCount;
            if (isExistingRoomType) {
              try {
                final existingDoc = await roomTypeRef.get();
                if (existingDoc.exists) {
                  final existingData = existingDoc.data() as Map<String, dynamic>?;
                  if (existingData != null) {
                    currentAvailableCount = existingData['available_count'] ?? roomCount;
                    // لا نغير available_count عند التعديل، فقط total_count
                  }
                }
              } catch (e) {
                // تجاهل الخطأ
              }
            }

            Map<String, dynamic> roomTypeData = {
              "id": roomTypeRef.id,
              "title": roomTypeName,
              "description": group.descriptionController.text.trim(),
              "property_type": "إيجار",
              "city": cityController.text.trim(),
              "country": countryController.text.trim(),
              "address": addressController.text.trim(),
              "latitude": latitudeController.text.trim(),
              "longitude": longitudeController.text.trim(),
              "area": int.tryParse(group.areaController.text.trim()) ?? 0,
              "area_unit": group.selectedAreaUnit.value,
              "bathrooms":
                  int.tryParse(group.bathRoomsController.text.trim()) ?? 0,
              "bedrooms": int.tryParse(group.bedRoomsController.text.trim()) ?? 0,
              "features": selectedFeaturesAsString,
              "mainImage": mainImageUrl,
              "images": allImageUrls,
              "daily_price": group.dailyPriceController.text.trim(),
              "daily_price_currency": group.dailySelectedCurrency.value,
              "nightly_price": group.nightlyPriceController.text.trim(),
              "nightly_currency": group.nightlySelectedCurrency.value,
              "contact_number":
                  "${selectedCountryCode.value}${contactNumberController.text.trim()}",
              "contact_name": contactNameController.text.trim(),
              "rules": rulesController.text.trim(),
              "ownerId": userId,
              "hotelId": hotelRef.id,
              "total_count": roomCount,
              "updatedAt": FieldValue.serverTimestamp(),
            };

            // في وضع الإنشاء، أضف الحقول الإضافية
            if (!isExistingRoomType) {
              roomTypeData.addAll({
                "status": "approved",
                "isVisible": true,
                "available_count": roomCount,
                "created_at": FieldValue.serverTimestamp(),
              });
            } else {
              // في وضع التحديث، احتفظ بـ available_count الحالي
              roomTypeData['available_count'] = currentAvailableCount;
            }

            if (isExistingRoomType) {
              await roomTypeRef.update(roomTypeData);
            } else {
              await roomTypeRef.set(roomTypeData);
            }
            
            processedRoomTypeIds.add(roomTypeRef.id);
            totalRoomTypesCreated++;

            // حفظ/تحديث الجولة البانوراما لنوع الغرفة
            if (uploadedPanoramaImages.isNotEmpty) {
              try {
                await roomTypeRef.collection('panorama_tour').doc('main').set({
                  "images": uploadedPanoramaImages,
                  "created_at": FieldValue.serverTimestamp(),
                }, SetOptions(merge: true));
              } catch (e) {
                // لا نرمي الخطأ هنا، لأن نوع الغرفة تم حفظه بالفعل
              }
            }
          } catch (e) {
            if (!isEditMode.value) {
              // في وضع الإنشاء، احذف الفندق إذا فشل حفظ نوع الغرفة
              try {
                await hotelRef.delete();
              } catch (deleteError) {
                // تجاهل خطأ الحذف
              }
            }
            throw Exception("فشل حفظ نوع الغرفة ${groupIndex + 1}: $e");
          }
        } catch (e) {
          if (!isEditMode.value) {
            // في وضع الإنشاء، احذف الفندق إذا فشل معالجة مجموعة الغرف
            try {
              await hotelRef.delete();
            } catch (deleteError) {
              // تجاهل خطأ الحذف
            }
          }
          throw Exception("فشل معالجة مجموعة الغرف ${groupIndex + 1}: $e");
        }
      }

      // في وضع التعديل، احذف أنواع الغرف التي تم حذفها
      if (isEditMode.value) {
        final roomTypesToDelete = existingRoomTypeIds
            .where((id) => !processedRoomTypeIds.contains(id))
            .toList();
        
        for (final roomTypeId in roomTypesToDelete) {
          try {
            await hotelRef.collection('room_types').doc(roomTypeId).delete();
          } catch (e) {
            // تجاهل خطأ الحذف
          }
        }
      }
      
      if (totalRoomTypesCreated == 0) {
        if (!isEditMode.value) {
          // في وضع الإنشاء، احذف الفندق إذا لم يتم حفظ أي نوع غرفة
          try {
            await hotelRef.delete();
          } catch (deleteError) {
            // تجاهل خطأ الحذف
          }
        }
        throw Exception("لم يتم حفظ أي نوع غرفة. يرجى المحاولة مرة أخرى");
      }

      safeBack();
      showSnackBar(
        "تم بنجاح!",
        isEditMode.value ? "تم تحديث الفندق بنجاح" : "تم إنشاء الفندق بنجاح",
        backgroundColor: Colors.green,
        colorText: Colors.white,
        duration: Duration(seconds: 5),
      );
    } catch (e) {
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
    String? userRole;
    
    // التحقق من صلاحيات المستخدم
    try {
      final userDoc = await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .get();
      
      if (!userDoc.exists) {
        throw Exception("مستند المستخدم غير موجود في Firestore");
      }
      
      final userData = userDoc.data();
      userRole = userData?['role'];
      
      if (userRole != 'admin' && userRole != 'owner') {
        throw Exception("ليس لديك صلاحية لرفع الصور. يجب أن تكون admin أو owner. دورك الحالي: ${userRole ?? 'غير محدد'}");
      }
    } catch (e) {
      if (e.toString().contains("صلاحية")) {
        rethrow;
      }
      throw Exception("فشل التحقق من صلاحيات المستخدم: $e");
    }

    final fileName = '${DateTime.now().millisecondsSinceEpoch}.jpg';
    final ref = FirebaseStorage.instance
        .ref()
        .child('hotels/$userId/$folder/$fileName');

    try {
      final snapshot = await ref.putFile(file);

      if (snapshot.state == TaskState.success) {
        final url = await ref.getDownloadURL();
        return url;
      } else {
        throw Exception("فشل رفع الصورة: حالة الرفع = ${snapshot.state}");
      }
    } on FirebaseException catch (e) {
      if (e.code == 'permission-denied') {
        throw Exception("تم رفض الصلاحية. تأكد من تحديث قواعد Storage في Firebase Console");
      }
      throw Exception("فشل رفع الصورة: ${e.message}");
    } catch (e) {
      throw Exception("فشل رفع الصورة: $e");
    }
  }

  @override
  void onClose() {
    latitudeController.dispose();
    longitudeController.dispose();
    hotelNameController.dispose();
    hotelDescriptionController.dispose();
    addressController.dispose();
    countryController.dispose();
    cityController.dispose();
    contactNumberController.dispose();
    contactNameController.dispose();
    rulesController.dispose();

    // التخلص من جميع مجموعات الغرف
    for (var group in roomGroups) {
      group.dispose();
    }
    roomGroups.clear();

    // مسح صور الفندق
    hotelImages.clear();

    super.onClose();
  }
}
