import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final String? subtitle;
  final double height;
  final List<Widget>? actions;
  final Widget? leading;
  final bool showBack;
  final double borderRadius;
  final Function()? onBack;

  const CustomAppBar({
    super.key,
    required this.title,
    this.subtitle,
    this.height = kToolbarHeight,
    this.actions,
    this.leading,
    this.showBack = true,
    this.borderRadius = 30.0,
    this.onBack,
  });

  // نفس التدرج اللوني المستخدم في الـ Drawer (أزرق فاخر)
  final LinearGradient _appBarGradient = const LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF1E88E5), // blue.shade600 مُعدّل قليلاً ليكون أكثر حيوية
      Color(0xFF1565C0), // blue.shade800
    ],
  );

  void safeBack({dynamic result}) {
    if (Get.isSnackbarOpen) Get.closeCurrentSnackbar();
    if (Navigator.canPop(Get.context!)) {
      Navigator.of(Get.context!).pop(result);
    }
  }

  @override
  Widget build(BuildContext context) {
    final paddingTop = MediaQuery.of(context).padding.top;
    final totalHeight = height + paddingTop + 20; // زيادة خفيفة للجمال

    return Material(
      color: Colors.transparent,
      child: Container(
        height: totalHeight,
        padding: EdgeInsets.only(top: paddingTop),
        decoration: BoxDecoration(
          gradient: _appBarGradient,
          borderRadius: BorderRadius.vertical(
            bottom: Radius.circular(borderRadius),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.25),
              blurRadius: 15,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            // === العنوان في المنتصف ===
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: GoogleFonts.cairo(
                    fontWeight: FontWeight.w800,
                    fontSize: 21,
                    color: Colors.white,
                    letterSpacing: 0.5,
                    shadows: [
                      Shadow(
                        offset: const Offset(0, 1),
                        blurRadius: 4,
                        color: Colors.black.withOpacity(0.3),
                      ),
                    ],
                  ),
                ),
                if (subtitle != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      subtitle!,
                      style: GoogleFonts.cairo(
                        fontSize: 13,
                        color: Colors.white.withOpacity(0.9),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
              ],
            ),

            // === زر الرجوع (يمين في RTL) ===
            Positioned(
              right: 12,
              child: leading ??
                  (showBack
                      ? Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(30),
                            onTap: onBack ?? safeBack,
                            child: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white.withOpacity(0.18),
                                border: Border.all(color: Colors.white.withOpacity(0.3), width: 1),
                              ),
                              child: const Icon(
                                Icons.arrow_back_ios_new_rounded,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                          ),
                        )
                      : const SizedBox(width: 48)),
            ),

            // === الأكشنز على اليسار ===
            if (actions != null)
              Positioned(
                left: 8,
                child: Row(
                  children: actions!
                      .map((action) => Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: action,
                          ))
                      .toList(),
                ),
              ),
          ],
        ),
      ),
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(height + 20);
}