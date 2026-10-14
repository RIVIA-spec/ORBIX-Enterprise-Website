// lib/core/widgets/app_drawer.dart

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/features/hotel_section/view/show_hotels_screen.dart';
import 'package:real_estate_app/features_admin/add_hotel_sectoin/add_hotel_view/add_hotel_view.dart';
import 'package:real_estate_app/features/add_property_section/view/add_property_screen.dart';
import 'package:real_estate_app/features/favourite_section/view/favorites_screen.dart';
import 'package:real_estate_app/features/home_section/view/home_screen.dart';
import 'package:real_estate_app/features/my_booking_section/view/my_booking_screen.dart';
import 'package:real_estate_app/features/my_property_section/view/my_property_screen.dart';
import 'package:real_estate_app/features/sign_up_section/view/sign_up_screen.dart';
import 'package:real_estate_app/features_admin/control_panel_section/view/control_panel_screen.dart';
import 'package:real_estate_app/features/identify_section/view/identify_verification_screen.dart';
import 'package:real_estate_app/features/login_sction/view/login_screen.dart';
import 'package:real_estate_app/features/contracts_section/view/contracts_page.dart';
import 'package:real_estate_app/features/contracts_section/view/transactions_page.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final userCtr = Get.find<UserController>();

    return Drawer(
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(30),
          bottomLeft: Radius.circular(30),
        ),
      ),
      width: Get.width * 0.78,
      backgroundColor: Colors.white,
      child: Column(
        children: [
          // === الهيدر الجميل ===
          Container(
            padding: const EdgeInsets.fromLTRB(24, 40, 24, 30),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Colors.blue.shade600, Colors.blue.shade800],
              ),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(30),
              ),
            ),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(50),
                  child: Image.asset(
                    "assets/icon/orbix.png", width: 56),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Reality Reimagined",
                        textAlign: TextAlign.left,
                        style: GoogleFonts.cairo(
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          letterSpacing: 1.2,
                        ),
                      ),
                      Text(
                        "Ai-Powered Platform For Real Estates & Hotels",
                        textAlign: TextAlign.left,
                        style: GoogleFonts.cairo(
                          fontSize: 13,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Obx(() {
                final isLoggedIn = userCtr.isLoggedIn.value;
                final username = userCtr.username.value;

                return Column(
                  children: [
                    // === ترحيب خاص إذا مسجل دخول ===
                    if (isLoggedIn) ...[
                      Container(
                        margin: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(16),
                          border:
                              Border.all(color: Colors.blue.shade200, width: 1),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.waving_hand,
                                color: Colors.amber.shade700, size: 28),
                            const SizedBox(width: 12),
                            Expanded(
                              child: RichText(
                                text: TextSpan(
                                  children: [
                                    TextSpan(
                                        text: "مرحباً ",
                                        style: GoogleFonts.cairo(
                                            fontSize: 17,
                                            color: Colors.black87)),
                                    TextSpan(
                                      text: username,
                                      style: GoogleFonts.cairo(
                                          fontSize: 19,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.blue.shade800),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                    ],

                    // === العناصر الرئيسية ===
                    _buildDrawerItem(Icons.home_rounded, "الرئيسية",
                        () => Get.offAll(() => HomeScreen())),
                    _buildDrawerItem(Icons.favorite_rounded, "المفضلة",
                        () => Get.to(() => FavoritesScreen()),
                        color: Colors.red.shade500),
                    _buildDrawerItem(Icons.hotel, "الفنادق",
                        () => Get.to(() => ShowHotelsScreen())),
                    _buildDrawerItem(
                        Icons.add_home,
                        "إضافة عقار",
                        () => _navigateIfLoggedIn(
                            () => Get.to(() => AddPropertyScreen()))),
                    _buildDrawerItem(
                        Icons.maps_home_work_rounded,
                        "عقاراتي",
                        () => _navigateIfLoggedIn(
                            () => Get.to(() => MyPropertyScreen()))),
                    _buildDrawerItem(
                        Icons.shopping_bag_rounded,
                        "حجوزاتي",
                        () => _navigateIfLoggedIn(
                            () => Get.to(() => MyBookingsScreen()))),
                    _buildDrawerItem(
                        Icons.description_outlined,
                        "عقودي",
                        () => _navigateIfLoggedIn(
                            () => Get.to(() => ContractsPage()))),
                    _buildDrawerItem(
                        Icons.receipt_long_outlined,
                        "معاملاتي",
                        () => _navigateIfLoggedIn(
                            () => Get.to(() => TransactionsPage()))),
                    _buildDrawerItem(
                        Icons.verified_user_rounded,
                        "التحقق من الهوية",
                        () => _navigateIfLoggedIn(
                            () => Get.to(() => IdentityVerificationScreen()))),
                    if(userCtr.isOwner.value)
                    _buildDrawerItem(
                        Icons.hotel_rounded,
                        "إضافة فندق",
                        () => _navigateIfLoggedIn(
                            () => Get.to(() => AddHotelView()))),

                    // === قريباً (مع تأثير خافت) ===
                    // _buildComingSoonItem(Icons.sell_rounded, "بيع مباشر"),
                    // _buildComingSoonItem(Icons.key_rounded, "إيجار طويل"),

                    const Divider(
                        height: 40, thickness: 1, indent: 20, endIndent: 20),

                    // === الأدمن فقط ===
                    if (userCtr.isOwner.value || userCtr.isAdmin.value)
                      _buildDrawerItem(Icons.admin_panel_settings_rounded, "لوحة التحكم", () => Get.to(() => ControlPanelScreen()), color: Colors.purple.shade600),
      
                    _buildDrawerItem(Icons.person_rounded, "الملف الشخصي", () => _navigateIfLoggedIn(() => Get.toNamed("/dashboard"))),
                    // _buildDrawerItem(Icons.settings_rounded, "الإعدادات", () {}),
      
                    const SizedBox(height: 30),

                    // === تسجيل الدخول / الخروج ===
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: isLoggedIn
                          ? ElevatedButton.icon(
                              onPressed: () => _showLogoutDialog(),
                              icon: const Icon(Icons.logout_rounded, size: 20),
                              label: Text("تسجيل الخروج",
                                  style: GoogleFonts.cairo(fontSize: 16)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red.shade500,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                    vertical: 14, horizontal: 10),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16)),
                                elevation: 8,
                                shadowColor: Colors.red.withOpacity(0.3),
                              ),
                            )
                          : Column(
                              children: [
                                ElevatedButton.icon(
                                  onPressed: () => Get.to(() => LoginScreen()),
                                  icon: const Icon(Icons.login_rounded),
                                  label: Text("تسجيل الدخول",
                                      style: GoogleFonts.cairo(
                                          fontSize: 17,
                                          fontWeight: FontWeight.bold)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.blue.shade600,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 14, horizontal: 10),
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(16)),
                                    minimumSize:
                                        const Size(double.infinity, 55),
                                    elevation: 10,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                OutlinedButton.icon(
                                  onPressed: () => Get.to(() => SignUpScreen()),
                                  icon: const Icon(Icons.person_add_rounded,
                                      color: Colors.blue),
                                  label: Text("إنشاء حساب جديد",
                                      style: GoogleFonts.cairo(
                                          fontSize: 16, color: Colors.blue)),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 14, horizontal: 10),
                                    side: BorderSide(
                                        color: Colors.blue.shade600, width: 2),
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(16)),
                                    minimumSize:
                                        const Size(double.infinity, 55),
                                  ),
                                ),
                              ],
                            ),
                    ),

                    const SizedBox(height: 30),
                    Text(
                      "الإصدار التجريبي v1.0",
                      style: GoogleFonts.cairo(
                          fontSize: 12, color: Colors.grey.shade500),
                    ),
                    const SizedBox(height: 20),
                  ],
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerItem(IconData icon, String title, VoidCallback onTap,
      {Color? color}) {
    return ListTile(
      leading: Icon(icon, color: color ?? Colors.grey.shade700, size: 26),
      title: Text(title,
          style:
              GoogleFonts.cairo(fontSize: 16.5, fontWeight: FontWeight.w600)),
      trailing: const Icon(Icons.arrow_forward_ios_rounded,
          size: 16, color: Colors.grey),
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onTap: onTap,
      splashColor: Colors.blue.withOpacity(0.1),
    );
  }

  Widget _buildComingSoonItem(IconData icon, String title) {
    return ListTile(
      leading: Icon(icon, color: Colors.grey.shade400, size: 26),
      title: Text(title,
          style: GoogleFonts.cairo(fontSize: 16, color: Colors.grey.shade500)),
      trailing: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
            color: Colors.amber.shade100,
            borderRadius: BorderRadius.circular(8)),
        child: Text("قريباً",
            style: GoogleFonts.cairo(
                fontSize: 10,
                color: Colors.amber.shade800,
                fontWeight: FontWeight.bold)),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
      enabled: false,
    );
  }

  void _navigateIfLoggedIn(VoidCallback action) {
    if (Get.find<UserController>().isLoggedIn.value) {
      action();
    } else {
      Get.to(() => LoginScreen());
    }
  }

  void _showLogoutDialog() {
    Get.dialog(
      AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Icon(Icons.logout_rounded, color: Colors.red.shade600),
            const SizedBox(width: 10),
            Text("تسجيل الخروج",
                style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text("هل أنت متأكد من تسجيل الخروج؟",
            style: GoogleFonts.cairo(fontSize: 16)),
        actions: [
          TextButton(
              onPressed: () => safeBack(),
              child: Text("إلغاء",
                  style: GoogleFonts.cairo(color: Colors.grey.shade700))),
          ElevatedButton(
            onPressed: () {
              Get.find<UserController>().logout();
              safeBack();
            },
            style:
                ElevatedButton.styleFrom(backgroundColor: Colors.red.shade600),
            child: Text("نعم، خروج",
                style: GoogleFonts.cairo(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
