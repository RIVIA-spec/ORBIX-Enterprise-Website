// lib/features_admin/admin_users/widgets/user_card.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/features_admin/add_admin_section/controller/add_admin_controller.dart';

class UserCard extends StatelessWidget {
  final Map<String, dynamic> user;
  final String userId;

  UserCard({
    super.key,
    required this.user,
    required this.userId,
  });

  var isLoading = false.obs;

  @override
  Widget build(BuildContext context) {
    final addAdminCtr = Get.find<AddAdminController>();
    final String username = user['username'] ?? 'بدون اسم';
    final String email = user['email'] ?? 'لا يوجد بريد';
    final bool isAdmin = user['role'] == "admin";

    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // أيقونة المستخدم
            CircleAvatar(
              radius: 26,
              backgroundColor: Colors.blue.shade50,
              child: Icon(
                Icons.person_rounded,
                color: Colors.blue.shade700,
                size: 30,
              ),
            ),

            const SizedBox(width: 16),

            // تفاصيل المستخدم
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    username,
                    style: GoogleFonts.cairo(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    email,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(width: 12),

            // زر التعيين أو إزالة المشرف LoadingThreeArchedCircle(size: 28)
                
              // ? 
              Obx(
                () => CustomButton(
                  width: Get.width * 0.3,
                  height: 40,
                  padding: EdgeInsets.symmetric(horizontal: 5, vertical: 5),
                  text: isAdmin ? "إزالة مشرف" : "تعيين مشرف" , 
                  fontSize: 12,
                  borderRadius: 10,
                  foregroundColor: isAdmin ? Colors.red : null,
                  isLoading: isLoading,
                  onPressed: isLoading.value ? null : () async {
                    if(isAdmin){
                      isLoading.value = true;
                      await addAdminCtr.removeAdmin(userId);
                      isLoading.value = false;
                    } else {
                      isLoading.value = true;
                      await addAdminCtr.makeAdmin(userId);
                      isLoading.value = false;
                    }
                  },
                  isOutlined: true,
                  borderColor: isAdmin ? Colors.red : Colors.blueAccent,
                ),
              ),
              // ElevatedButton.icon(
              //     onPressed: () async {
                    
              //     },
              //     style: ElevatedButton.styleFrom(
              //       backgroundColor: Colors.red.shade400,
              //       shape: RoundedRectangleBorder(
              //         borderRadius: BorderRadius.circular(12),
              //       ),
              //     ),
              //     icon: const Icon(Icons.remove_moderator, color: Colors.white),
              //     label: const Text(
              //       "إزالة المشرف",
              //       style: TextStyle(color: Colors.white),
              //     ),
              //   )
              // : ElevatedButton.icon(
              //     onPressed: () async {
              //       isLoading.value = true;
              //       await addAdminCtr.makeAdmin(userId);
              //       isLoading.value = false;
              //     },
              //     style: ElevatedButton.styleFrom(
              //       backgroundColor: Colors.blueAccent,
              //       shape: RoundedRectangleBorder(
              //         borderRadius: BorderRadius.circular(12),
              //       ),
              //     ),
              //     icon: const Icon(Icons.admin_panel_settings_rounded, color: Colors.white),
              //     label: const Text(
              //       "تعيين مشرف",
              //       style: TextStyle(color: Colors.white),
              //     ),
              //   ),
          ],
        ),
      ),
    );
  }
}
