


import 'dart:developer';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:real_estate_app/core/functions/custom_log.dart';
import 'package:real_estate_app/core/functions/is_admin.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';


class MyInformationController extends GetxController {
  final userCtr = Get.put(UserController());

  var isLoading = false.obs;
  var showPasswordField = false.obs;
  var isPasswordHidden = true.obs;
  var isConfirmPasswordHidden = true.obs;

  final formKey = GlobalKey<FormState>();
  final userNameController = TextEditingController();
  final emailController = TextEditingController();
  final newEmailController = TextEditingController();
  final oldPasswordController = TextEditingController();
  final newPasswordController = TextEditingController();

  var isChangingPassword = false.obs;
  var isChangingEmail = false.obs;


  void togglePassword() {
    isPasswordHidden.value = !isPasswordHidden.value;
  }

  void toggleConfirmPassword() {
    isConfirmPasswordHidden.value = !isConfirmPasswordHidden.value;
  }

  void startChangePassword() {
    isChangingEmail.value = false;
    isChangingPassword.value = true;

    oldPasswordController.clear();
    newPasswordController.clear();
  }

  void startChangeEmail() {
    isChangingPassword.value = false;
    isChangingEmail.value = true;

    newEmailController.clear();
    oldPasswordController.clear();
  }

  void cancelChangeMode() {
    isChangingPassword.value = false;
    isChangingEmail.value = false;
  }


  void updateUserInfo() async {
    if (!formKey.currentState!.validate()) return;

    final newName = userNameController.text.trim();
    final newEmail = emailController.text.trim();

    isLoading.value = true;
    final user = FirebaseAuth.instance.currentUser!;

    try {
      // تحديث الاسم
      if (newName != userCtr.username.value) {
        await user.updateDisplayName(newName);
        userCtr.username.value = newName;
      }

      // تحديث البريد
      if (newEmail != userCtr.email.value) {
        await user.verifyBeforeUpdateEmail(newEmail);
        userCtr.email.value = newEmail;
      }

      // تحديث كلمة المرور
      if (showPasswordField.value && newPasswordController.text.isNotEmpty) {
        try{
          final cred = EmailAuthProvider.credential(
            email: user.email!,
            password: oldPasswordController.text,
          );
          await user.reauthenticateWithCredential(cred);

          await user.updatePassword(newPasswordController.text);
          showSnackBar("تم", "تم تحديث كلمة المرور بنجاح");

          oldPasswordController.clear();
          newPasswordController.clear();
        } on FirebaseAuthException catch (e) {
          if (e.code == 'wrong-password') {
            showSnackBar("خطأ", "كلمة المرور القديمة غير صحيحة");
          } else if (e.code == 'requires-recent-login') {
            showSnackBar("تنبيه", "يجب إعادة تسجيل الدخول قبل التحديث");
          } else {
            showSnackBar("خطأ", e.message ?? "حدث خطأ أثناء التحديث");
          }
        }
      }

      // تحديث Firestore
      await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .set({
        'username': newName,
        'email': newEmail,
      }, SetOptions(merge: true));

      final userStatus = await getUserStatus(user.uid);
      final bool isOwner = userStatus['isOwner'];
      final bool isAdmin = userStatus['isAdmin'];

      // تحديث GetStorage
      userCtr.saveUser(
        uid: user.uid, username: newName, email: newEmail,
        isOwner: isOwner,
        isAdmin: isAdmin,
      );
      

      showSnackBar("تم", "تم تعديل البيانات بنجاح");
    } on FirebaseAuthException catch (e) {
      if (e.code == 'requires-recent-login') {
        showSnackBar("خطأ", "أعد تسجيل الدخول ثم حاول");
      } else {
        showSnackBar("فشل", e.message ?? "حدث خطأ");
      }
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> updateBasicInfo() async {
    isLoading.value = true;

    try {
      final user = FirebaseAuth.instance.currentUser!;
      
      if (userNameController.text.trim() != userCtr.username.value) {
        await user.updateDisplayName(userNameController.text.trim());
        userCtr.username.value = userNameController.text.trim();
      }

      // تحديث Firestore فقط
      FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .update({
        'username': userNameController.text.trim(),
      });

      showSnackBar("تم", "تم تحديث البيانات الأساسية");
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> updatePasswordOnly() async {
    isLoading.value = true;

    try {
      final user = FirebaseAuth.instance.currentUser!;

      final cred = EmailAuthProvider.credential(
        email: user.email!,
        password: oldPasswordController.text.trim(),
      );

      // إعادة المصادقة بالكلمة القديمة
      await user.reauthenticateWithCredential(cred);

      // تحديث كلمة المرور
      await user.updatePassword(newPasswordController.text.trim());

      showSnackBar("تم بنجاح", "تم تغيير كلمة المرور بنجاح");
      cancelChangeMode();

    } on FirebaseAuthException catch (e) {
      String errorMessage;

      switch (e.code) {
        case 'wrong-password':
          errorMessage = "كلمة المرور الحالية غير صحيحة، يرجى التحقق منها.";
          break;
        case 'weak-password':
          errorMessage = "كلمة المرور الجديدة ضعيفة جداً، يجب أن تكون 6 أحرف على الأقل.";
          break;
        case 'requires-recent-login':
          errorMessage = "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى ثم المحاولة.";
          break;
        case 'user-mismatch':
          errorMessage = "بيانات المستخدم غير متطابقة، حاول مرة أخرى.";
          break;
        case 'user-not-found':
          errorMessage = "لم يتم العثور على حساب المستخدم.";
          break;
        case 'invalid-credential':
          errorMessage = "بيانات تسجيل الدخول غير صالحة.";
          break;
        case 'too-many-requests':
          errorMessage = "تم إرسال طلبات كثيرة جداً، يرجى المحاولة لاحقاً.";
          break;
        default:
          errorMessage = "حدث خطأ غير متوقع: ${e.message}";
      }

      showSnackBar("فشل التغيير", errorMessage);

    } catch (e) {
      // أي خطأ آخر خارج Firebase (مثل مشكلة شبكة)
      showSnackBar("خطأ", "فشل تغيير كلمة المرور، تأكد من الاتصال بالإنترنت وحاول مرة أخرى.");
    } finally {
      isLoading.value = false;
    }
  }

    Future<void> updateEmailOnly() async {
      if (!formKey.currentState!.validate()) return;

      isLoading.value = true;

      try {
        final user = FirebaseAuth.instance.currentUser!;
        final newEmail = newEmailController.text.trim();

        // منع تغيير لنفس الإيميل
        if (newEmail == user.email) {
          showSnackBar("تنبيه", "البريد الجديد هو نفسه الحالي");
          isLoading.value = false;
          return;
        }

        // إعادة المصادقة بكلمة المرور
        final cred = EmailAuthProvider.credential(
          email: user.email!,
          password: oldPasswordController.text.trim(),
        );
        await user.reauthenticateWithCredential(cred);

        // إرسال رابط التحقق
        await user.verifyBeforeUpdateEmail(newEmail);

        // رسالة نجاح + تعليمات واضحة
        showSnackBar(
          "تم الإرسال بنجاح",
          "تم إرسال رابط التحقق إلى:\n$newEmail\n\n1. اضغط على الرابط في الإيميل.\n2. سيتم تسجيل خروجك الآن.\n3. قم بتسجيل الدخول مرة أخرى باستخدام البريد الجديد.",
          backgroundColor: Colors.green.shade600,
          colorText: Colors.white,
          duration: const Duration(seconds: 12),
        );

        // إلغاء وضع التغيير
        cancelChangeMode();

        // تسجيل خروج فوري
        await Future.delayed(const Duration(seconds: 3)); // تأخير قصير لقراءة الرسالة
        Get.find<UserController>().logout();

      } on FirebaseAuthException catch (e) {
        String errorMessage;

        switch (e.code) {
          case 'wrong-password':
            errorMessage = "كلمة المرور غير صحيحة";
            break;
          case 'invalid-email':
            errorMessage = "البريد الجديد غير صالح";
            break;
          case 'email-already-in-use':
            errorMessage = "البريد مستخدم بالفعل";
            break;
          case 'requires-recent-login':
            errorMessage = "انتهت جلسة الدخول، أعد تسجيل الدخول";
            break;
          case 'too-many-requests':
            errorMessage = "طلبات كثيرة، حاول لاحقًا";
            break;
          default:
            errorMessage = e.message ?? "خطأ غير متوقع";
        }

        showSnackBar("فشل", errorMessage, backgroundColor: Colors.red.shade600);

      } catch (e) {
        showSnackBar("خطأ", "فشل الاتصال، حاول مرة أخرى");
      } finally {
        isLoading.value = false;
      }
    }



  @override
  void onInit() {
    // TODO: implement onInit
    userNameController.text = userCtr.username.value;
    emailController.text = userCtr.email.value;
    super.onInit();
  }
  
}
