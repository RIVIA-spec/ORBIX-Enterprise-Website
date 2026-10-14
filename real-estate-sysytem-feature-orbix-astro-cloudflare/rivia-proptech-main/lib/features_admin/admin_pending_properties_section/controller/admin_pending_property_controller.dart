// lib/features/admin/pending_properties/controller/admin_pending_property_controller.dart
import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/mappers/property_mapper.dart';

class AdminPendingPropertyController extends GetxController {
  var requests = <Map<String, dynamic>>[].obs;
  var isLoading = true.obs;

  @override
  void onInit() {
    super.onInit();
    loadPendingRequests();
  }

  Future<void> loadPendingRequests() async {
    isLoading.value = true;
    try {
      final snap = await FirebaseFirestore.instance
          .collection('property_requests')
          .where('status', isEqualTo: 'pending')
          .get();

      requests.value = snap.docs.map((doc) {
        final data = normalizePropertyMap(doc.data());
        // if(data['request_type'] == "publish") {
        data['request_id'] = doc.id;
        // }
        return data;
      }).toList();
    } catch (e, s) {
      log("خطأ في جلب الطلبات", error: e, stackTrace: s);
      requests.clear();
    } finally {
      isLoading.value = false;
    }
  }

  // قبول الطلب
  Future<void> approve(String requestId, Map<String, dynamic> data) async {
    if (data['request_type'] == "publish") {
      try {
        await FirebaseFirestore.instance.runTransaction((tx) async {
          // 1. إنشاء العقار في properties
          final propRef =
              FirebaseFirestore.instance.collection('properties').doc();

          final propertyData = normalizePropertyMap({
            ...data,
            'id': propRef.id,
            'status': 'approved',
            'approvedAt': FieldValue.serverTimestamp(),
            'approvedBy': FirebaseAuth.instance.currentUser!.uid,
            'created_at': data['created_at'] ?? FieldValue.serverTimestamp(),
          });
          tx.set(propRef, propertyData);

          // 2. نسخ الجولة البانوراما إذا وجدت
          final tourSourceRef = FirebaseFirestore.instance
              .collection('property_requests')
              .doc(requestId)
              .collection('panorama_tour')
              .doc('main');

          final tourSnap = await tourSourceRef.get();
          if (tourSnap.exists) {
            final tourData = tourSnap.data()!;
            final tourTargetRef =
                propRef.collection('panorama_tour').doc('main');
            tx.set(tourTargetRef, tourData); // نسخ كامل (images + created_at)

            tx.delete(tourSourceRef); // حذف الجولة
          }

          // 3. تحديث قائمة عقارات المستخدم
          final userRef = FirebaseFirestore.instance
              .collection('users')
              .doc(data['ownerId']);
          tx.update(userRef, {
            'properties': FieldValue.arrayUnion([propRef.id])
          });

          // 4. إرسال إشعار للمالك
          final notifRef = FirebaseFirestore.instance
              .collection('users')
              .doc(data['ownerId'])
              .collection('notifications')
              .doc();

          tx.set(notifRef, {
            'id': notifRef.id,
            'type': 'accept',
            'title': 'تمت الموافقة على عقارك!',
            'message': 'عقار "${data['title']}" أصبح منشورًا الآن',
            'propertyId': propRef.id,
            'read': false,
            'created_at': FieldValue.serverTimestamp(),
          });

          // 5. حذف الطلب من property_requests
          tx.delete(FirebaseFirestore.instance
              .collection('property_requests')
              .doc(requestId));
        });

        showSnackBar("تم بنجاح", "تم نشر العقار",
            backgroundColor: Colors.green,
            colorText: Colors.white,
            duration: Duration(seconds: 4));
        loadPendingRequests();
      } catch (e, s) {
        debugPrint("خطأ في الموافقة: $e");
        debugPrintStack(stackTrace: s);
        showSnackBar("فشل", "حدث خطأ أثناء النشر", backgroundColor: Colors.red);
      }
    } else if (data['request_type'] == "edit") {
      try {
        // 1. الحصول على مرجع العقار الحالي
        log("Start: data -> ${data.toString()}");

        final propRef = FirebaseFirestore.instance
            .collection('properties')
            .doc((data['originalPropertyId'] ?? data['id']).toString());
        log("f1: Reference to property document obtained");

        // تحقق من أن الـ `data` تحتوي على الـ `id` للعقار
        if (data['originalPropertyId'] == null && data['id'] == null) {
          throw Exception("Property ID is missing in data");
        }

        // 2. تحديث البيانات الجديدة (استبدال القديمة بالبيانات الجديدة)
        final propertyData = normalizePropertyMap({
          ...data,
          'status': 'approved', // تغيير الحالة إلى "approved"
          'request_type': FieldValue.delete(), // إزالة نوع الطلب
          "request_id": FieldValue.delete()
        });
        log("f2: Preparing property data");

        // تحقق من وجود بيانات للعقار لتحديثها
        if (propertyData.isEmpty) {
          throw Exception("Property data is empty, cannot update");
        }

        // الكتابة فوق البيانات القديمة (بدون tx، استخدم set مباشرة)
        await propRef.update(propertyData);
        log("f3: Property data updated successfully");

        // 3. التحقق من وجود جولة بانوراما جديدة
        final tourSourceRef = FirebaseFirestore.instance
            .collection('property_requests')
            .doc(requestId)
            .collection('panorama_tour')
            .doc('main');

        log("f4: Checking panorama tour in doc : $requestId");

        final tourSnap = await tourSourceRef.get();
        if (tourSnap.exists) {
          final tourData = tourSnap.data()!;
          final tourTargetRef = propRef.collection('panorama_tour').doc('main');

          log("panorama tour target: ${tourSnap}");
          log("new panorama tour: ${tourTargetRef}");
          if (tourData.isEmpty) {
            throw Exception("Panorama tour data is empty, cannot update");
          }

          // نقل البيانات الجديدة إلى العقار
          await tourTargetRef.set(tourData);
          log("f5: Panorama tour updated successfully");
          await tourSourceRef.delete();
          log("f5.5: request Panorama tour deleted successfully");
        } else {
          // إذا لم تكن هناك جولة بانوراما جديدة، تأكد من حذف القديمة (إذا كانت موجودة)
          // final existingTourRef = propRef.collection('panorama_tour').doc('main');
          // await existingTourRef.delete(); // حذف البانوراما القديمة
          log("f6: Panorama tour deleted as no new tour exists");
        }

        // 4. التحقق من وجود الطلب قبل حذفه
        final propertyRequestRef = FirebaseFirestore.instance
            .collection('property_requests')
            .doc(requestId);
        final requestSnap = await propertyRequestRef.get();

        if (!requestSnap.exists) {
          log("f7: Request not found, skipping delete");
        } else {
          // إذا كان الطلب موجودًا، قم بحذفه
          await propertyRequestRef.delete();
          log("f7: Property request deleted successfully");
        }

        // 5. إرسال إشعار للمالك
        final notifRef = FirebaseFirestore.instance
            .collection('users')
            .doc(data['ownerId'])
            .collection('notifications')
            .doc();

        if (data['ownerId'] == null) {
          throw Exception(
              "Owner ID is missing in the data, cannot send notification");
        }

        await notifRef.set({
          'id': notifRef.id,
          'type': 'accept',
          'title': 'تم تعديل عقارك!',
          'message': 'تم تحديث بيانات عقار "${data['title']}"',
          'propertyId': propRef.id,
          'read': false,
          'created_at': FieldValue.serverTimestamp(),
        });
        log("f8: Notification sent to property owner");

        // إذا تم تنفيذ جميع الخطوات بنجاح
        showSnackBar("تم بنجاح", "تم تعديل العقار بنجاح",
            backgroundColor: Colors.green,
            colorText: Colors.white,
            duration: Duration(seconds: 4));
        loadPendingRequests();
      } catch (e, s) {
        // إذا حدث خطأ في أي خطوة
        log("Error in approve: $e", stackTrace: s);
        showSnackBar("فشل", "حدث خطأ أثناء التعديل: $e",
            backgroundColor: Colors.red);
      }
    }
  }

  Future<void> _deleteUnusedImages(
      Map<String, dynamic> data, DocumentReference propRef) async {
    // نقوم بحذف الصور القديمة إذا لم تكن موجودة في البيانات الجديدة
    final oldImages = List<String>.from(data['images'] ?? []);
    final newImages = List<String>.from(data['new_images'] ??
        []); // التأكد من أن لديك 'new_images' في البيانات الجديدة
    final unusedImages =
        oldImages.where((image) => !newImages.contains(image)).toList();

    for (var image in unusedImages) {
      try {
        await FirebaseStorage.instance.refFromURL(image).delete();
      } catch (e) {
        debugPrint("خطأ في حذف الصورة: $e");
      }
    }
  }

  // رفض الطلب
  Future<void> reject(
      String requestId, String reason, String requestType) async {
    if (requestType == "publish") {
      if (reason.trim().isEmpty) {
        showSnackBar("خطأ", "يجب إدخال سبب الرفض");
        return;
      }

      final FirebaseFirestore firestore = FirebaseFirestore.instance;
      final FirebaseStorage storage = FirebaseStorage.instance;

      try {
        await FirebaseFirestore.instance.runTransaction((tx) async {
          final requestRef =
              firestore.collection('property_requests').doc(requestId);
          final requestSnap = await requestRef.get();

          if (!requestSnap.exists) {
            throw Exception("الطلب غير موجود");
          }

          final data = requestSnap.data()!;
          final ownerId = data['ownerId'] as String;

          // 1. حذف الصور العادية المرفقة مع الطلب
          final List<dynamic>? images = data['images'];
          if (images != null && images.isNotEmpty) {
            for (var imageUrl in images) {
              if (imageUrl is String && imageUrl.isNotEmpty) {
                try {
                  await storage.refFromURL(imageUrl).delete();
                } catch (e) {
                  log('Error deleting image: $e');
                }
              }
            }
          }

          // 2. حذف البانوراما تور وصورها إذا وجدت
          final tourRef = firestore
              .collection('property_requests')
              .doc(requestId)
              .collection('panorama_tour')
              .doc('main');
          final tourSnap = await tourRef.get();
          if (tourSnap.exists) {
            final tourData = tourSnap.data()!;
            final List<dynamic>? tourImages = tourData['images'];
            if (tourImages != null && tourImages.isNotEmpty) {
              for (var item in tourImages) {
                var imageUrl = item['url'] ?? '';
                if (imageUrl != '') {
                  try {
                    await storage.refFromURL(imageUrl).delete();
                  } catch (e) {
                    log('Error deleting panorama image: $e');
                  }
                }
              }
            }
            tx.delete(tourRef); // حذف الـ document الخاص بالـ panorama_tour
          }

          // 3. تحديث حالة الطلب (اختياري: يمكن حذفه لاحقًا)
          tx.update(requestRef, {
            'status': 'reject',
            'rejectionReason': reason,
            'rejectedAt': FieldValue.serverTimestamp(),
            'rejectedBy': FirebaseAuth.instance.currentUser!.uid,
          });

          // 4. إضافة إشعار للمستخدم
          final notificationRef = firestore
              .collection('users')
              .doc(ownerId)
              .collection('notifications')
              .doc();

          tx.set(notificationRef, {
            'id': notificationRef.id,
            'type': 'reject',
            'title': requestType == "publish"
                ? 'تم رفض طلب نشر عقارك'
                : 'تم رفض طلب تعديل عقارك',
            'message': 'السبب: $reason',
            'propertyTitle': data['title'],
            'requestId': requestId,
            'read': false,
            'created_at': FieldValue.serverTimestamp(),
          });

          // 5. حذف الطلب من قائمة الطلبات
          tx.delete(requestRef);
        });

        showSnackBar(
            "تم", "تم رفض الطلب وحذف الملفات المرفقة وإرسال إشعار للمستخدم",
            backgroundColor: Colors.green, colorText: Colors.white);
        loadPendingRequests(); // تحديث القائمة فورًا
      } catch (e, s) {
        debugPrintStack(stackTrace: s);
        showSnackBar("خطأ", "فشل في رفض الطلب: $e",
            backgroundColor: Colors.red, colorText: Colors.white);
      }
    } else if (requestType == "edit") {
      if (reason.trim().isEmpty) {
        showSnackBar("خطأ", "يجب إدخال سبب الرفض");
        return;
      }

      try {
        await FirebaseFirestore.instance.runTransaction((tx) async {
          final requestRef = FirebaseFirestore.instance
              .collection('property_requests')
              .doc(requestId);
          final requestSnap = await requestRef.get();

          if (!requestSnap.exists) {
            throw Exception("الطلب غير موجود");
          }

          final data = requestSnap.data()!;
          final ownerId = data['ownerId'] as String;

          // 1. تحديث حالة الطلب (اختياري: يمكن حذفه لاحقًا)
          tx.update(requestRef, {
            'status': 'reject',
            'rejectionReason': reason,
            'rejectedAt': FieldValue.serverTimestamp(),
            'rejectedBy': FirebaseAuth.instance.currentUser!.uid,
          });

          // 2. إضافة إشعار للمستخدم
          final notificationRef = FirebaseFirestore.instance
              .collection('users')
              .doc(ownerId)
              .collection('notifications')
              .doc();

          tx.set(notificationRef, {
            'id': notificationRef.id,
            'type': 'reject',
            'title': 'تم رفض طلب نشر عقارك',
            'message': 'السبب: $reason',
            'propertyTitle': data['title'],
            'requestId': requestId,
            'read': false,
            'created_at': FieldValue.serverTimestamp(),
          });

          final panoramaTourRef = FirebaseFirestore.instance
              .collection('property_requests')
              .doc(requestId)
              .collection('panorama_tour')
              .doc('main');

          final panoramaTourSnap = await panoramaTourRef.get();
          if (panoramaTourSnap.exists) {
            // حذف الـ panorama_tour
            tx.delete(panoramaTourRef);
          }

          // 3. حذف الطلب من قائمة الطلبات
          tx.delete(requestRef);
        });

        showSnackBar("تم", "تم رفض طلب التعديل وحذفه وإرسال إشعار للمستخدم",
            backgroundColor: Colors.green, colorText: Colors.white);
        loadPendingRequests(); // تحديث القائمة فورًا
      } catch (e, s) {
        debugPrintStack(stackTrace: s);
        showSnackBar("خطأ", "فشل في رفض طلب التعديل: $e",
            backgroundColor: Colors.red, colorText: Colors.white);
      }
    }
  }
}
