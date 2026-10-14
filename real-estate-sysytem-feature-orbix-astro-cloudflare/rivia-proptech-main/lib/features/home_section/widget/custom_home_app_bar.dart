// lib/core/widgets/custom_pinned_appbar.dart
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/features/notification_section/controller/badge_controller.dart';
import 'package:real_estate_app/features/notification_section/view/notifications_screen.dart';

class CustomHomeAppBar extends StatelessWidget implements PreferredSizeWidget {
  const CustomHomeAppBar({super.key, required this.isVisible,});

  final RxBool isVisible;

  @override
  Widget build(BuildContext context) {
    return Obx(
      () {
        // الآن نحتفظ بالـ AnimatedSwitcher دائما داخل الـ Obx
        // بحيث يمكنه عمل انتقال لطيف عند الظهور / الإخفاء المفاجئ
        return AnimatedSwitcher(
          duration: const Duration(milliseconds: 1500),
          switchInCurve: Curves.easeOutCubic,
          switchOutCurve: Curves.easeInCubic,
          transitionBuilder: (child, animation) {
            // مزيج من Slide + Fade + Scale يعطي إحساساً "مفاجئاً" لكنه أنيق
            final slideAnim = Tween<Offset>(begin: const Offset(0, -0.12), end: Offset.zero)
                .animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic));
            final scaleAnim = Tween<double>(begin: 0.985, end: 1.0)
                .animate(CurvedAnimation(parent: animation, curve: Curves.easeOutBack));
            final fadeAnim = CurvedAnimation(parent: animation, curve: Curves.easeIn);

            return SlideTransition(
              position: slideAnim,
              child: FadeTransition(
                opacity: fadeAnim,
                child: ScaleTransition(
                  scale: scaleAnim,
                  child: child,
                ),
              ),
            );
          },
          // child يتغير بين الحالتين ليقوم AnimatedSwitcher بعمل الأنيميشن
          child: isVisible.value
              ? Container(
                  key: const ValueKey('custom_home_appbar_visible'),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xFF1E88E5),
                        Color(0xFF1565C0),
                      ],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black26,
                        blurRadius: 10,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                      child: Row(
                        children: [
                          // === أيقونة Drawer ===
                          const SizedBox(width: 4),

                          Builder(
                            builder: (context) => IconButton(
                              onPressed: () => Scaffold.of(context).openDrawer(),
                              icon: Container(
                                width: 50, height: 50,
                                // padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.25),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white.withOpacity(0.4), width: 1.8),
                                ),
                                child: const Icon(Icons.menu_rounded, color: Colors.white, size: 28),
                              ),
                            ),
                          ),

                          const SizedBox(width: 12),

                          // === أيقونة الإشعارات ===
                          Obx(() {
                            final isLoggedIn = Get.find<UserController>().isLoggedIn.value;
                            if (!isLoggedIn) return const SizedBox(width: 52);

                            final count = Get.find<BadgeController>().unreadCount.value;

                            return Stack(
                              alignment: Alignment.center,
                              children: [
                                IconButton(
                                  onPressed: () => Get.to(() => const NotificationsScreen()),
                                  icon: Container(
                                    width: 50, height: 50,
                                    // padding: const EdgeInsets.all(14),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.25),
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white.withOpacity(0.4), width: 1.8),
                                    ),
                                    child: const Icon(Icons.notifications_none_rounded, color: Colors.white, size: 28),
                                  ),
                                ),
                                if (count > 0)
                                  Positioned(
                                    right: 8,
                                    top: 8,
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: const BoxDecoration(
                                        color: Colors.red,
                                        shape: BoxShape.circle,
                                        boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 4)],
                                      ),
                                      constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                                      child: Text(
                                        count > 99 ? "99+" : '$count',
                                        style: GoogleFonts.cairo(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                        textAlign: TextAlign.center,
                                      ),
                                    ),
                                  ),
                              ],
                            );
                          }),

                          const Spacer(),

                          // === الشعار فقط ===
                          ClipRRect(
                            borderRadius: BorderRadius.circular(50),
                            child: Image.asset(
                              "assets/icon/orbix.png", width: 60, height: 60),
                          ),
                          SizedBox(width: 8,)
                          // ClipRRect(
                          //   borderRadius: BorderRadius.circular(14),
                          //   child: SvgPicture.asset(
                          //     "assets/icon/rivia-logo-transparent.svg", width: 60, height: 60),
                          // ),
                        ],
                      ),
                    ),
                  ),
                )
              : const SizedBox.shrink(key: ValueKey('custom_home_appbar_hidden')),
        );
      },
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight + 16);
}
