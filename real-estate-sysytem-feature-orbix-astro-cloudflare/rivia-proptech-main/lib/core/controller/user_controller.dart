import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/Get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/features/home_section/view/home_screen.dart';
import 'package:real_estate_app/features/notification_section/controller/badge_controller.dart';
import 'dart:async'; // لـ StreamSubscription

class UserController extends GetxController with WidgetsBindingObserver {
  // === الذاكرة المؤقتة (Rx) ===
  var userId = ''.obs;
  var username = ''.obs;
  var email = ''.obs;
  var isLoggedIn = false.obs;
  RxBool isOwner = false.obs;
  RxBool isAdmin = false.obs;
  // StreamSubscription<User?>? _authStateSubscription;

  // === الذاكرة الدائمة (GetStorage) ===
  final box = GetStorage();

  // مفتاح التخزين
  static const String _keyUser = 'user_data';

  // استماع لتغييرات الحساب
  StreamSubscription<DocumentSnapshot>? _userListener;

  @override
  void onInit() {
    super.onInit();
    WidgetsBinding.instance.addObserver(this);
    // تحميل البيانات عند بدء التطبيق
    loadUserFromServer();
    // loadUserFromStorage();
  }

  // === حفظ المستخدم بعد التسجيل الناجح ===
  void saveUser({
    required String uid,
    required String username,
    required String email,
    required bool? isOwner,
    required bool? isAdmin,
  }) {
    // 1. حفظ في الذاكرة المؤقتة (Rx)
    userId.value = uid;
    this.username.value = username;
    this.email.value = email;
    isLoggedIn.value = true;
    this.isOwner.value = isOwner ?? false;
    this.isAdmin.value = isAdmin ?? false;

    log("email in save user : $email");
    // 2. حفظ في الذاكرة الدائمة (GetStorage)
    box.write(_keyUser, {
      'uid': uid,
      'username': username,
      'email': email,
      "is_owner" : isOwner,
      "is_admin" : isAdmin,
    });

    // بدء الاستماع لتغييرات الحساب
    _startListeningToUserStatus(uid);
    // _startEmailVerificationListener();
  }

  loadUserFromServer() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    final doc = await FirebaseFirestore.instance
        .collection('users')
        .doc(user.uid)
        .get();

    if (doc.exists) {
      final data = doc.data()!;
      log(data.toString());
      username.value = data['username'] ?? '';
      email.value = data['email'] ?? user.email ?? '';
      isOwner.value = data['role'] == "owner" ? true : false;
      isAdmin.value = data['role'] == "admin" ? true : false;

      log("email : $email");

      // تحقق إذا كان الإيميل في Auth مختلف عن الإيميل في Firestore
      if (user.email != null && user.email != data['email']) {
        // تحديث الإيميل في Firestore
        await FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid)
            .update({'email': user.email});

        // تحديث الذاكرة المؤقتة
        email.value = user.email!;

        // إشعار للمستخدم
        showSnackBar(
          "تم التحديث",
          "تم تحديث بريدك الإلكتروني في قاعدة البيانات إلى: ${user.email}",
          backgroundColor: Colors.green.shade600,
          colorText: Colors.white,
        );
      }

      saveUser(uid: user.uid, 
        username: username.value, 
        email: email.value, 
        isOwner: isOwner.value,
        isAdmin: isAdmin.value
      );
    }
  }

  // === تحميل المستخدم من التخزين عند بدء التطبيق ===
  void loadUserFromStorage() {
    final data = box.read(_keyUser);
    if (data != null) {
      userId.value = data['uid'];
      username.value = data['username'];
      email.value = data['email'];
      isLoggedIn.value = true;
      isOwner.value = data['is_owner'] ?? false;
      isAdmin.value = data['is_admin'] ?? false;

      // بدء الاستماع بعد التحميل من التخزين
      if (userId.value.isNotEmpty) {
        _startListeningToUserStatus(userId.value);
        // _startEmailVerificationListener();
      }
    }
  }

  // === تسجيل الخروج ===
  void logout() {
    _userListener?.cancel(); // إيقاف الاستماع
    // _authStateSubscription?.cancel();
    
    // إلغاء جميع الـ listeners في Controllers الأخرى قبل تسجيل الخروج
    try {
      final badgeCtrl = Get.find<BadgeController>();
      badgeCtrl.cancelAllListeners();
    } catch (e) {
      // Controller غير موجود، لا مشكلة
    }
    
    FirebaseAuth.instance.signOut();
    box.remove(_keyUser); // حذف من التخزين
    userId.value = '';
    username.value = '';
    email.value = '';
    isLoggedIn.value = false;
    isOwner.value = false;
    isAdmin.value = false;
    Get.offAll(HomeScreen());
  }

  // === تحديث اسم المستخدم ===
  void updateUsername(String newName) {
    username.value = newName;
    final data = box.read(_keyUser);
    if (data != null) {
      data['username'] = newName;
      box.write(_keyUser, data);
    }
  }

  // === بدء الاستماع لتغييرات الحساب ===
  void _startListeningToUserStatus(String uid) {
    _userListener?.cancel(); // إيقاف أي استماع سابق
    _userListener = FirebaseFirestore.instance
        .collection('users')
        .doc(uid)
        .snapshots()
        .listen((snapshot) {
      if (!snapshot.exists) {
        logout(); // إذا حُذف الحساب
        return;
      }

      final data = snapshot.data()!;
      final bool isActive = data['isActive'] ?? true;

      if (!isActive) {
        final String reason = data['deactivation_reason'] ?? 'غير محدد';
        _showDeactivationBottomSheet(reason);
      }
    }, onError: (error) {
      log("خطأ في الاستماع لحالة المستخدم: $error");
    });
  }

  // === عرض bottom sheet لإلغاء التفعيل ===
  void _showDeactivationBottomSheet(String reason) {
    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.warning_amber_rounded,
              size: 80,
              color: Colors.red,
            ),
            const SizedBox(height: 20),
            Text(
              "تم إلغاء تفعيل حسابك",
              style: GoogleFonts.cairo(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Colors.red.shade800,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              "السبب: $reason",
              style: GoogleFonts.cairo(
                fontSize: 16,
                color: Colors.grey.shade800,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),
            CustomButton(
              text: "حسناً",
              backgroundColor: Colors.red.shade600,
              foregroundColor: Colors.white,
              width: double.infinity,
              onPressed: () {
                safeBack();
                logout();
              },
            ),
          ],
        ),
      ),
      isDismissible: false,
      enableDrag: false,
    );
  }

  // void _startEmailVerificationListener() {
  //   _authStateSubscription?.cancel();

  //   _authStateSubscription = FirebaseAuth.instance.authStateChanges().listen((user) async {
  //     // إذا المستخدم صار null بعد ما كان مسجل → معناته تم تغيير الإيميل أو كلمة المرور
  //     if (user == null && isLoggedIn.value == true) {
  //       log("تم اكتشاف تسجيل خروج تلقائي (غالباً بسبب تغيير الإيميل أو كلمة المرور)");

  //       // إيقاف كل الاستماع
  //       _userListener?.cancel();

  //       // إشعار واضح للمستخدم
  //       showSnackBar(
  //         "تم تغيير بيانات الحساب",
  //         "لقد تم تغيير بريدك الإلكتروني بنجاح.\nيرجى تسجيل الدخول مرة أخرى.",
  //         backgroundColor: Colors.green.shade600,
  //         colorText: Colors.white,
  //         duration: const Duration(seconds: 8),
  //         margin: const EdgeInsets.all(16),
  //         icon: const Icon(Icons.security, color: Colors.white),
  //       );

  //       // إجبار تسجيل الخروج
  //       await Future.delayed(const Duration(seconds: 2));
  //       logout(); // لا نعرض رسالة خروج عادية
  //     }
  //   });
  // }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      _userListener?.cancel(); // إيقاف الاستماع في الخلفية
    } else if (state == AppLifecycleState.resumed) {
      if (userId.value.isNotEmpty) {
        _startListeningToUserStatus(userId.value); // إعادة التشغيل في الـ foreground
        
      }
    }
  }

  @override
  void onClose() {
    _userListener?.cancel();
    // _authStateSubscription?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.onClose();
  }
}