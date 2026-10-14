import 'dart:async';
import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/services/fcm_service.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/features/home_section/view/home_screen.dart';
import 'package:real_estate_app/features/login_sction/view/login_screen.dart';
import 'package:real_estate_app/features/notification_section/controller/badge_controller.dart';

class RegisterController extends GetxController {
  var isLoading = false.obs;
  var isPasswordHidden = true.obs;
  var isConfirmPasswordHidden = true.obs;
  var isTermsAccepted = false.obs;

  // حالة الانتظار بعد التسجيل
  var isWaitingForVerification = false.obs;
  // var countdownSeconds = 30.obs; // 2 دقيقة = 120 ثانية
  var countdownSeconds = 120.obs; // 2 دقيقة = 120 ثانية
  var canResendOrExit = false.obs; // هل يمكن إعادة الإرسال أو الخروج؟

  Timer? _countdownTimer;
  Timer? _verificationTimer;

  final formKey = GlobalKey<FormState>();
  final userNameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();

  @override
  void onClose() {
    _countdownTimer?.cancel();
    _verificationTimer?.cancel();
    super.onClose();
  }

  void togglePassword() => isPasswordHidden(!isPasswordHidden.value);
  void toggleConfirmPassword() => isConfirmPasswordHidden(!isConfirmPasswordHidden.value);

  void signUp() async {
    isLoading.value = true;

    try {
      UserCredential userCredential = await FirebaseAuth.instance.createUserWithEmailAndPassword(
        email: emailController.text.trim(),
        password: passwordController.text.trim(),
      );

      User? user = userCredential.user;

      // إرسال إيميل التحقق
      await user?.sendEmailVerification();
      await user?.updateDisplayName(userNameController.text.trim());

      // حفظ البيانات في Firestore
      await FirebaseFirestore.instance.collection('users').doc(user!.uid).set({
        'uid': user.uid,
        'username': userNameController.text.trim(),
        'email': emailController.text.trim(),
        'isActive': true,
        'isVerified': false,
        'created_at': FieldValue.serverTimestamp(),
      });

      // إظهار شاشة الانتظار + بدء العد التنازلي
      isWaitingForVerification.value = true;
      // عرض الـ Dialog الجميل
      showVerificationDialog();

      countdownSeconds.value = 120;
      canResendOrExit.value = false;

      _startCountdown();
      _startVerificationCheck();

      // رسالة نجاح
      showSnackBar(
        "تم إنشاء الحساب",
        "تحقق من بريدك الإلكتروني (قد يكون في السبام)",
        backgroundColor: Colors.green.shade600,
        colorText: Colors.white,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(20),
        borderRadius: 12,
      );

    } on FirebaseAuthException catch (e) {
      String msg = _getAuthErrorMessage(e.code);
      showSnackBar("فشل التسجيل", msg,
          backgroundColor: Colors.red.shade600, colorText: Colors.white);
    } catch (e) {
      showSnackBar("خطأ", "حدث خطأ غير متوقع",
          backgroundColor: Colors.red.shade700, colorText: Colors.white);
    } finally {
      isLoading.value = false;
    }
  }

  // العد التنازلي 2 دقيقة
  void _startCountdown() {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (countdownSeconds.value <= 1) {
        timer.cancel();
        canResendOrExit.value = true;
      } else {
        countdownSeconds.value--;
      }
    });
  }

  // التحقق الدوري من حالة الإيميل
  void _startVerificationCheck() {
    _verificationTimer?.cancel();
    _verificationTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      User? user = FirebaseAuth.instance.currentUser;
      await user?.reload();

      if (user?.emailVerified == true) {
        // إيقاف التايمر فورًا
        _verificationTimer?.cancel();
        _countdownTimer?.cancel();

        try {
          // 1. جلب بيانات المستخدم من Firestore (نفس اللي في login)
          final userCtr = Get.put(UserController());
          
          final userDoc = await FirebaseFirestore.instance
              .collection('users')
              .doc(user!.uid)
              .get();

          if (!userDoc.exists) {
            showSnackBar("خطأ", "بيانات المستخدم غير موجودة!");
            return;
          }

          final data = userDoc.data()!;
          final username = user.displayName ?? data['username'] ?? 'مستخدم';
          final bool isOwner = data['isOwner'] ?? false;
          final bool isAdmin = data['isAdmin'] ?? false;
          final bool isActive = data['isActive'] ?? true;

          // 2. تحديث isVerified في Firestore
          await FirebaseFirestore.instance
              .collection('users')
              .doc(user.uid)
              .update({'isVerified': true});

          // 3. إذا الحساب معطل → خروج فوري
          if (!isActive) {
            final reason = data['deactivation_reason'] ?? "تم تعطيل الحساب من قِبل الإدارة";
            safeBack(); // إغلاق الـ dialog
            _showDeactivationDialog(reason);
            await FirebaseAuth.instance.signOut();
            return;
          }

          // 4. حفظ بيانات المستخدم محليًا (مثل اللوجن بالضبط)
          userCtr.saveUser(
            uid: user.uid,
            username: username,
            email: user.email!,
            isOwner: isOwner,
            isAdmin: isAdmin,
          );

          // 5. تحديث BadgeController
          try {
            final badgeCtrl = Get.find<BadgeController>();
            badgeCtrl.refreshNotifications();
          } catch (e) {
            Get.put(BadgeController());
          }

          // 6. حفظ FCM Token للإشعارات
          try {
            await FCMService().saveTokenForCurrentUser();
          } catch (e) {
            debugPrint('FCM Token Error after verification: $e');
          }

          // 7. إغلاق نافذة التحقق
          safeBack(); // يغلق الـ Get.dialog

          // 8. رسالة ترحيب + انتقال للصفحة الرئيسية
          showSnackBar(
            "مرحباً $username!",
            "تم تفعيل حسابك وتسجيل الدخول بنجاح",
            backgroundColor: Colors.green.shade600,
            colorText: Colors.white,
            duration: const Duration(seconds: 4),
          );

          // الانتقال للصفحة الرئيسية (مثل اللوجن)
          Get.offAllNamed("/");

        } catch (e, stack) {
          debugPrint("خطأ أثناء التحقق من الحساب بعد التفعيل: $e");
          debugPrint(stack.toString());
          safeBack(); // إغلاق الـ dialog حتى لو حصل خطأ
          showSnackBar("خطأ", "حدث خطأ أثناء تفعيل الحساب، يرجى تسجيل الدخول يدويًا.");
          Get.offAll(() => LoginScreen());
        }
      }
    });
  }

  // إعادة إرسال الإيميل
  void resendVerificationEmail() async {
    if (!canResendOrExit.value) return;

    try {
      await FirebaseAuth.instance.currentUser?.sendEmailVerification();
      showSnackBar("تم الإرسال", "تم إرسال رابط جديد إلى بريدك",
          backgroundColor: Colors.blue.shade600, colorText: Colors.white);

      // إعادة تشغيل العد التنازلي من جديد
      countdownSeconds.value = 120;
      canResendOrExit.value = false;
      _startCountdown();
    } catch (e) {
      log("error $e");
      showSnackBar("خطأ", "فشل إعادة الإرسال", backgroundColor: Colors.red);
    }
  }

  // خروج من شاشة الانتظار (بعد دقيقتين)
  void exitVerification() {
    if (!canResendOrExit.value) return;

    _verificationTimer?.cancel();
    _countdownTimer?.cancel();
    isWaitingForVerification.value = false;

    FirebaseAuth.instance.signOut();
    Get.offAllNamed("/login");
  }

  // رسائل الأخطاء
  String _getAuthErrorMessage(String code) {
    switch (code) {
      case 'weak-password':
        return "كلمة المرور ضعيفة جدًا";
      case 'email-already-in-use':
        return "البريد الإلكتروني مستخدم بالفعل";
      case 'invalid-email':
        return "البريد الإلكتروني غير صالح";
      default:
        return "حدث خطأ، حاول مرة أخرى";
    }
  }

  // دالة لتنسيق الوقت (مثال: 01:53)
  String get formattedTime {
    int min = countdownSeconds.value ~/ 60;
    int sec = countdownSeconds.value % 60;
    return "${min.toString().padLeft(2, '0')}:${sec.toString().padLeft(2, '0')}";
  }

  void _showDeactivationDialog(String reason) {
    Get.dialog(
      AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: Colors.white,
        contentPadding: const EdgeInsets.all(0),
        content: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            gradient: LinearGradient(
              colors: [Colors.white, Colors.red.shade50],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.warning_amber_rounded,
                size: 80,
                color: Colors.red.shade700,
              ),
              const SizedBox(height: 20),
              Text(
                "حسابك تم إلغاء تفعيله",
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
                onPressed: () => safeBack(),
              ),
            ],
          ),
        ),
      ),
      barrierDismissible: false, // لا يغلق بالضغط خارج النافذة
    );
  }

  // دالة تُظهر الـ Dialog الجميل ولا يمكن إغلاقه إلا من الكود
  void showVerificationDialog() {
    Get.dialog(
      PopScope(
        canPop: false, // يمنع الرجوع بالكامل
        child: Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: Padding(
            padding: const EdgeInsets.all(30),
            child: Obx(() => Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.mark_email_read_outlined, size: 80, color: Colors.teal),
                    const SizedBox(height: 20),
                    const Text("ننتظر تفعيل حسابك", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                    const SizedBox(height: 15),
                    const Text("تحقق من بريدك الإلكتروني\n(لا تنسَ مجلد السبام)", style: TextStyle(fontSize: 16, color: Colors.grey), textAlign: TextAlign.center),
                    const SizedBox(height: 30),

                    // العداد التنازلي
                    Text(formattedTime, style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: Colors.teal)),

                    const SizedBox(height: 30),

                    // الأزرار بعد انتهاء العداد
                    canResendOrExit.value
                        ? Column(
                            children: [
                              CustomButton(
                                text: "إعادة إرسال الرابط", 
                                leadingIcon: Icons.refresh,
                                onPressed: () {
                                  resendVerificationEmail();
                                },
                              ),
                              // ElevatedButton.icon(
                              //   onPressed: () {
                              //     resendVerificationEmail();
                              //   },
                              //   icon: const Icon(Icons.refresh),
                              //   label: const Text("إعادة إرسال الرابط"),
                              //   style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, minimumSize: const Size(double.infinity, 50)),
                              // ),
                              const SizedBox(height: 12),
                              TextButton(
                                onPressed: () {
                                  safeBack(); // إغلاق الـ dialog
                                  exitVerification();
                                },
                                child: const Text("خروج", style: TextStyle(color: Colors.red, fontSize: 16)),
                              ),
                            ],
                          )
                        : const Padding(
                            padding: EdgeInsets.symmetric(vertical: 20),
                            child: Text("انتظر قليلاً...\nسيظهر خيار إعادة الإرسال بعد انتهاء العداد", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
                          ),
                  ],
                )),
          ),
        ),
      ),
      barrierDismissible: false, // لا يمكن إغلاقه بالضغط خارج الـ dialog
    );
  }
}