

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class WhatsappContactController extends GetxController {

  final formKey = GlobalKey<FormState>();
  final emailFormKey = GlobalKey<FormState>();
  final FirebaseFirestore firestore = FirebaseFirestore.instance;
  final TextEditingController phoneController = TextEditingController();
  final TextEditingController countryCodeController = TextEditingController(text: "963");
  final TextEditingController emailController = TextEditingController();

  RxBool isLoading = false.obs;
  RxBool isUploading = false.obs;
  RxBool isEmailUploading = false.obs;
  RxString currentPhone = "".obs;
  RxString currentCountryCode = "".obs;
  RxString currentEmail = "".obs;

  Future<void> loadWhatsAppNumber() async {
    try {
      isLoading.value = true;
      final doc = await firestore.collection('settings').doc('whatsapp_contact').get();
      if (doc.exists) {
        final data = doc.data()!;
        currentPhone.value = data['phone'].toString();
        currentCountryCode.value = data['country_code']?.toString() ?? "966";
        currentEmail.value = data['email']?.toString() ?? "";
        phoneController.text = currentPhone.value ?? '';
        countryCodeController.text = currentCountryCode.value ?? '966';
        emailController.text = currentEmail.value ?? '';
      }
    } catch (e) {
      showSnackBar("خطأ", "فشل تحميل الرقم");
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> saveNumber() async {
    if (formKey.currentState?.validate() == false) {
      showSnackBar("خطأ", "أكمل البيانات بشكل صحيح",backgroundColor: Colors.red);
      return;
    }

    isUploading.value = true;

    try {
      final cleanPhone = phoneController.text.replaceAll(RegExp(r'\D'), '');
      final cleanCode = countryCodeController.text.replaceAll(RegExp(r'\D'), '');

      await firestore.collection('settings').doc('whatsapp_contact').set({
        'phone': cleanPhone,
        'country_code': cleanCode.isEmpty ? '963' : cleanCode,
        'updated_at': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      currentPhone.value = cleanPhone;
      currentCountryCode.value = cleanCode;

      showSnackBar("تم الحفظ", "تم تحديث رقم الواتساب بنجاح", backgroundColor: Colors.green, colorText: Colors.white);
    } catch (e) {
      showSnackBar("خطأ", "فشل الحفظ: $e", backgroundColor: Colors.red, colorText: Colors.white);
    } finally {
      isUploading.value = false;
    }
  }

  Future<void> saveEmail() async {
    if (emailFormKey.currentState?.validate() == false) {
      showSnackBar("خطأ", "أكمل البيانات بشكل صحيح", backgroundColor: Colors.red);
      return;
    }

    isEmailUploading.value = true;

    try {
      final email = emailController.text.trim();

      await firestore.collection('settings').doc('whatsapp_contact').set({
        'email': email,
        'updated_at': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      currentEmail.value = email;

      showSnackBar("تم الحفظ", "تم تحديث إيميل الدعم بنجاح", backgroundColor: Colors.green, colorText: Colors.white);
    } catch (e) {
      showSnackBar("خطأ", "فشل الحفظ: $e", backgroundColor: Colors.red, colorText: Colors.white);
    } finally {
      isEmailUploading.value = false;
    }
  }

  @override
  void onInit() {
    // TODO: implement onInit
    loadWhatsAppNumber();
    super.onInit();
  }
}