import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/core/functions/is_admin.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/services/fcm_service.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/features/notification_section/controller/badge_controller.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class LoginController extends GetxController {
  var isLoading = false.obs;
  var isPasswordHidden = true.obs;

  final formKey = GlobalKey<FormState>();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  final userController = Get.find<UserController>();
  var isResetPasswordDialogOpen = false.obs;
  final TextEditingController resetEmailController = TextEditingController();


  void togglePassword() {
    isPasswordHidden.value = !isPasswordHidden.value;
  }

  Future<void> login() async {
    if (!formKey.currentState!.validate()) return;

    final email = emailController.text.trim();
    final password = passwordController.text;

    isLoading.value = true;

    try {
      // تسجيل الدخول في Firebase
      UserCredential userCredential = await FirebaseAuth.instance
          .signInWithEmailAndPassword(email: email, password: password);

      final user = userCredential.user!;
      final username = user.displayName ?? 'مستخدم';
      final userStatus = await getUserStatus(user.uid);
      final bool isOwner = userStatus['isOwner'];
      final bool isAdmin = userStatus['isAdmin'];
      final bool isActive = userStatus['isActive'];

      if (!isActive) {
        final reason = userStatus['deactivation_reason'];
        _showDeactivationDialog(reason);
        await FirebaseAuth.instance.signOut();
        return;
      }

      // if (!user.emailVerified) {
      //   await FirebaseAuth.instance.signOut();

      //   showSnackBar(
      //     "الحساب غير مفعل",
      //     "يجب تفعيل الحساب عبر رابط التحقق المرسل إلى بريدك الإلكتروني.",
      //     backgroundColor: Colors.orange.shade700,
      //     colorText: Colors.white,
      //   );
      //   return;
      // }

      // أضف هذا الكود الجديد:
      try {
        final userDoc = await FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid)
            .get();

        if (userDoc.exists) {
          final firestoreEmail = userDoc.data()?['email'] as String?;

          // إذا الإيميل في Auth مختلف عن الإيميل في Firestore → تم تغييره!
          if (user.email != null && firestoreEmail != null && user.email != firestoreEmail) {
            log("تم اكتشاف تغيير الإيميل! من: $firestoreEmail → إلى: ${user.email}");

            // تحديث الإيميل في Firestore
            await FirebaseFirestore.instance
                .collection('users')
                .doc(user.uid)
                .update({
              'email': user.email,
              // إذا كنت تستخدم pendingEmail سابقًا، احذفه
              // 'pendingEmail': FieldValue.delete(),
            });

            // إشعار جميل للمستخدم
            showSnackBar(
              "تم تحديث بريدك الإلكتروني بنجاح!",
              "البريد الجديد: ${user.email}\nتم تحديث بياناتك تلقائيًا",
              backgroundColor: Colors.green.shade600,
              colorText: Colors.white,
              duration: const Duration(seconds: 8),
              icon: const Icon(Icons.mark_email_read, color: Colors.white),
            );
          }
        }
      } catch (e) {
        log("خطأ أثناء التحقق من تحديث الإيميل: $e");
        // لا نوقف تسجيل الدخول بسبب هذا الخطأ، فقط نسجل اللوج
      }

      // حفظ البيانات محليًا
      userController.saveUser(
        uid: user.uid,
        username: username,
        email: email,
        isOwner: isOwner,
        isAdmin: isAdmin,
      );

      // تحديث أو إنشاء BadgeController
      try {
        final badgeCtrl = Get.find<BadgeController>();
        badgeCtrl.refreshNotifications();
      } catch (e) {
        Get.put(BadgeController());
      }

      // حفظ FCM Token
      try {
        await FCMService().saveTokenForCurrentUser();
      } catch (e) {
        debugPrint('FCM Token Error: $e');
      }

      showSnackBar(
        "مرحباً $username!",
        "تم تسجيل الدخول بنجاح",
        backgroundColor: Colors.green.shade600,
        colorText: Colors.white,
      );

      Get.offAllNamed("/");

    } on FirebaseAuthException catch (e) {
      // تسجيل كامل للخطأ (مهم جدًا للـ debugging)
      log("FirebaseAuth Error → Code: ${e.code}");
      log("FirebaseAuth Error → Message: ${e.message ?? 'لا يوجد رسالة'}");

      String message;

      switch (e.code) {
        case 'user-not-found':
          message = "لا يوجد حساب مرتبط بهذا البريد الإلكتروني.";
          break;
        case 'wrong-password':
          message = "كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.";
          break;
        case 'invalid-email':
          message = "عنوان البريد الإلكتروني غير صالح.";
          break;
        case 'user-disabled':
          message = "تم تعطيل هذا الحساب من قِبل الإدارة.";
          break;
        case 'invalid-credential':  // هذا الخطأ الجديد اللي ظهر لك
          message = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
          break;
        case 'too-many-requests':
          message = "تم تجاوز عدد المحاولات، يرجى المحاولة بعد قليل.";
          break;
        case 'network-request-failed':
          message = "فشل الاتصال بالإنترنت، تأكد من اتصالك.";
          break;
        default:
          message = "فشل تسجيل الدخول: حاول مرة أخرى لاحقًا.";
          log("خطأ غير معروف في تسجيل الدخول: ${e.code}");
      }

      showSnackBar(
        "فشل تسجيل الدخول",
        message,
        backgroundColor: Colors.red.shade600,
        colorText: Colors.white,
      );

    } on FirebaseException catch (e) {
      log("Firebase General Error → ${e.code}: ${e.message}");
      showSnackBar("خطأ في الخادم", "حدث خطأ، يرجى المحاولة لاحقًا.");

    } catch (e, stack) {
      log("خطأ غير متوقع في login(): $e");
      log("StackTrace: $stack");
      showSnackBar("خطأ غير متوقع", "حدث خطأ، أعد المحاولة.");

    } finally {
      isLoading.value = false;
    }
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

  // فتح نافذة نسيت كلمة المرور
  void showForgotPasswordDialog() {
    if (isResetPasswordDialogOpen.value) return;

    resetEmailController.clear();
    isResetPasswordDialogOpen.value = true;

    Get.dialog(
      Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.lock_reset, size: 70, color: Colors.orange.shade700),
              const SizedBox(height: 16),
              Text(
                "إعادة تعيين كلمة المرور",
                style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                "أدخل بريدك الإلكتروني وسيتم إرسال رابط لإعادة تعيين كلمة المرور",
                style: GoogleFonts.cairo(fontSize: 14, color: Colors.grey.shade700),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
      
              // حقل الإيميل
              CustomTextFormField(
                controller: resetEmailController,
                label: "البريد الإلكتروني",
                hint: "example@domain.com",
                keyboardType: TextInputType.emailAddress,
                validator: (v) {
                  if (v == null || v.isEmpty) return "مطلوب";
                  if (!GetUtils.isEmail(v)) return "البريد غير صالح";
                  return null;
                },
              ),
              const SizedBox(height: 20),
      
              // أزرار
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () {
                        safeBack();
                        isResetPasswordDialogOpen.value = false;
                      },
                      child: Text("إلغاء", style: GoogleFonts.cairo(color: Colors.grey.shade700)),
                    ),
                  ),
                  SizedBox(width: 10,),
                  SizedBox(
                    width: Get.width * 0.5,
                    child: CustomButton(
                      padding: EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      onPressed: () => sendPasswordResetEmail(),
                      text: "إرسال",
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      barrierDismissible: false,
    ).then((_) => isResetPasswordDialogOpen.value = false);
  }

  // إرسال رابط إعادة تعيين كلمة المرور
  Future<void> sendPasswordResetEmail() async {
    final email = resetEmailController.text.trim();
    if (email.isEmpty || !GetUtils.isEmail(email)) {
      showSnackBar("خطأ", "الرجاء إدخال بريد إلكتروني صحيح", backgroundColor: Colors.red);
      return;
    }

    try {
      await FirebaseAuth.instance.sendPasswordResetEmail(email: email);

      safeBack(); // إغلاق النافذة
      isResetPasswordDialogOpen.value = false;

      showSnackBar(
        "تم الإرسال بنجاح",
        "تحقق من بريدك الإلكتروني (و مجلد السبام) لإعادة تعيين كلمة المرور",
        backgroundColor: Colors.green.shade600,
        colorText: Colors.white,
        duration: const Duration(seconds: 6),
      );
    } on FirebaseAuthException catch (e) {
      String msg;
      switch (e.code) {
        case 'user-not-found':
          msg = "لا يوجد حساب مرتبط بهذا البريد الإلكتروني";
          break;
        case 'invalid-email':
          msg = "البريد الإلكتروني غير صالح";
          break;
        case 'too-many-requests':
          msg = "تم إرسال طلبات كثيرة، حاول مرة أخرى بعد قليل";
          break;
        default:
          msg = "فشل الإرسال، حاول مرة أخرى لاحقًا";
      }
      showSnackBar("فشل الإرسال", msg, backgroundColor: Colors.red.shade600, colorText: Colors.white);
    } catch (e) {
      showSnackBar("خطأ", "حدث خطأ غير متوقع", backgroundColor: Colors.red);
    }
  }
}
