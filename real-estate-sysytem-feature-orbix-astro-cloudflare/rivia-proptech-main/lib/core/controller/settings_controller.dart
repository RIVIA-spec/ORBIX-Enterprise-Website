// lib/core/controllers/settings_controller.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class SettingsController extends GetxController {
  static SettingsController get to => Get.find();

  // رقم الواتساب
  final RxString whatsappPhone = ''.obs;
  final RxString whatsappCountryCode = '963'.obs;
  
  // إيميل الدعم
  final RxString supportEmail = ''.obs;

  // حالة التحميل
  final RxBool isLoading = true.obs;

  @override
  void onInit() {
    super.onInit();
    loadWhatsAppNumber(); // تحميل الرقم عند بدء التطبيق
  }

  /// تحميل رقم الواتساب من Firestore
  Future<void> loadWhatsAppNumber() async {
    try {
      isLoading(true);

      final doc = await FirebaseFirestore.instance
          .collection('settings')
          .doc('whatsapp_contact')
          .get();

      if (doc.exists) {
        final data = doc.data()!;
        whatsappPhone.value = data['phone']?.toString() ?? '';
        whatsappCountryCode.value = data['country_code']?.toString() ?? '963';
        supportEmail.value = data['email']?.toString() ?? '';
      } else {
        // إذا لم يكن موجودًا → قيم افتراضية
        whatsappPhone.value = '';
        whatsappCountryCode.value = '963';
        supportEmail.value = '';
      }
    } catch (e) {
        showSnackBar("خطأ", "فشل تحميل إعدادات الواتساب", backgroundColor: Colors.red, colorText: Colors.white);
    } finally {
      isLoading(false);
    }
  }

  /// إرجاع الرقم الكامل (مثل: +966501234567)
  String get fullWhatsAppNumber => whatsappPhone.value.isNotEmpty
      ? '+$whatsappCountryCode${whatsappPhone.value}'
      : '';

  /// إرجاع رابط واتساب جاهز
  String get whatsappLink {
    if (whatsappPhone.value.isEmpty) return '';
    return 'https://wa.me/$whatsappCountryCode${whatsappPhone.value}';
  }
}