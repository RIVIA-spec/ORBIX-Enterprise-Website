// lib/core/controller/favorites_controller.dart

import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class FavoritesController extends GetxController {
  static FavoritesController get to => Get.find();

  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // تخزين معرفات العقارات المفضلة فقط (كـ Set لسرعة البحث O(1))
  final RxSet<String> favoriteIds = <String>{}.obs;

  // هل تم تحميل المفضلة من قبل؟
  bool _hasLoaded = false;

  @override
  void onInit() {
    super.onInit();
    // عندما يتغير حالة تسجيل الدخول → نحمل المفضلة من جديد
    ever(Get.find<UserController>().isLoggedIn, (loggedIn) {
      if (loggedIn == true) {
        loadFavoritesOnce();
      } else {
        favoriteIds.clear();
        _hasLoaded = false;
      }
    });
  }

  // تحميل المفضلة مرة واحدة فقط
  Future<void> loadFavoritesOnce() async {
    if (_hasLoaded || _auth.currentUser == null) return;

    try {
      final snapshot = await _db
          .collection('users')
          .doc(_auth.currentUser!.uid)
          .collection('favorites')
          .get();

      final Set<String> ids = snapshot.docs.map((doc) => doc.id).toSet();
      favoriteIds.assignAll(ids);
      _hasLoaded = true;

      print("تم تحميل ${ids.length} عقار مفضل");
    } catch (e) {
      print("خطأ في تحميل المفضلة: $e");
    }
  }

  // تبديل الحالة (إضافة أو حذف)
  Future<void> toggleFavorite(String propertyId) async {
    try {
      if (_auth.currentUser == null) {
        showSnackBar("تسجيل الدخول مطلوب", "سجل الدخول لإضافة المفضلة");
        Get.toNamed('/login');
        return;
      }

      final favRef = _db
          .collection('users')
          .doc(_auth.currentUser!.uid)
          .collection('favorites')
          .doc(propertyId);

      if (favoriteIds.contains(propertyId)) {
        // حذف
        await favRef.delete();
        favoriteIds.remove(propertyId);
        // showSnackBar("تم الإزالة", "أُزيل العقار من المفضلة", backgroundColor: Colors.orange.shade100);
      } else {
        // إضافة (نحفظ بيانات بسيطة فقط)
        await favRef.set({
          'added_at': FieldValue.serverTimestamp(),
        });
        favoriteIds.add(propertyId);
        // showSnackBar("تمت الإضافة", "أُضيف العقار إلى المفضلة", backgroundColor: Colors.green.shade100);
      }
    } catch (e){
      log("فشلت عملية التفضيل: ${e}");
      showSnackBar("فشلت عملية التفضيل / إزالة التفضيل", "حصل خطأ $e", backgroundColor: Colors.red.shade300);
    }
  }

  // دالة مساعدة: هل هو مفضل؟
  bool isFavorite(String propertyId) => favoriteIds.contains(propertyId);
}