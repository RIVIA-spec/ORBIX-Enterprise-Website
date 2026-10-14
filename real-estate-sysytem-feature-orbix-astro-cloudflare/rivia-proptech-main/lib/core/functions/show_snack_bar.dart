import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:get/route_manager.dart';
import 'package:get/state_manager.dart';
import 'package:toastification/toastification.dart';

void showSnackBar(
  String title,
  String message, {
  Color? backgroundColor,
  Color? colorText,
  Duration? duration,
  snackPosition,
  EdgeInsets? margin,
  double? borderRadius,
  Widget? icon,
}) {
  try {
    if (Get.context == null) {
      log("Get.context is null");
      return;
    }

    // الافتراضي: من الأعلى
    Alignment alignment = Alignment.topCenter;
    if (snackPosition == SnackPosition.BOTTOM) {
      alignment = Alignment.bottomCenter;
    }

    toastification.show(
      context: Get.context!,
      title: Text(title, style: TextStyle(fontWeight: FontWeight.bold, color: colorText ?? Colors.white)),
      description: Text(message, style: TextStyle(color: colorText ?? Colors.white)),

      // احتفظ بالستيل الذي تريده؛ fillColored يحتاج primaryColor لتغيير الملء
      style: ToastificationStyle.fillColored,

      // هنا نستخدم primaryColor لملء الخلفية في fillColored
      primaryColor: backgroundColor ?? Colors.green,

      // backgroundColor هنا يمكن أن يكون شفاف أو لون آخر حسب ذوقك
      backgroundColor: Colors.transparent,

      // لون النص / أيقونات داخل التوست
      foregroundColor: colorText ?? Colors.white,

      alignment: alignment,
      autoCloseDuration: duration ?? const Duration(milliseconds: 3500),

      borderRadius: BorderRadius.circular(borderRadius ?? 16),

      margin: margin ??
          EdgeInsets.only(
            left: 16,
            right: 16,
            top: alignment == Alignment.topCenter ? 20 : 16,
            bottom: alignment == Alignment.bottomCenter ? 20 : 0,
          ),

      icon: icon,

      // أيقونة إغلاق أنيقة ومرفوعة قليلاً
      closeButton: ToastCloseButton(
        showType: CloseButtonShowType.always,
        buttonBuilder: (context, onClose) => Align(
          alignment: Alignment.center,
          child: GestureDetector(
            onTap: onClose,
            child: Container(
              width: 32,
              height: 32,
              decoration: const BoxDecoration(
                color: Colors.white10,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.close_rounded,
                color: colorText ?? Colors.white,
                size: 20,
              ),
            ),
          ),
        ),
      ),

      // سحب لإغلاق
      dragToClose: true,
      dismissDirection: DismissDirection.up,

      // أنميشن فخم عند السحب والإغلاق
      animationBuilder: (context, animation, alignment, child) {
        final offset = alignment.y < 0
            ? const Offset(0, -1.5)
            : const Offset(0, 1.5);

        return SlideTransition(
          position: Tween<Offset>(begin: offset, end: Offset.zero).animate(
            CurvedAnimation(parent: animation, curve: Curves.easeOutCubic),
          ),
          child: FadeTransition(opacity: animation, child: child),
        );
      },
    );
  } catch (e) {
    log("error showing snack bar $e");
  }
}
