import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/features_admin/admin_notifications_section/controller/admin_notifications_controller.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class AdminNotificationsScreen extends StatelessWidget {
  const AdminNotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(AdminNotificationsController());

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: const CustomAppBar(title: "إرسال إشعارات"),
        body: Obx(
          () => controller.isLoading.value
              ? const LoadingDiscreteCircular()
              : Column(
                  children: [
                    // === قسم البحث ===
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 10,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: TextField(
                          controller: controller.searchController,
                          decoration: InputDecoration(
                            hintText: "ابحث عن مستخدم (اسم أو إيميل)",
                            prefixIcon: const Icon(Icons.search, color: Colors.grey),
                            suffixIcon: controller.searchQuery.value.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear, color: Colors.grey),
                                    onPressed: () {
                                      controller.searchController.clear();
                                    },
                                  )
                                : null,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide.none,
                            ),
                            filled: true,
                            fillColor: Colors.grey[50],
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 12,
                            ),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // === قسم تحديد الكل ===
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        children: [
                          Expanded(
                            child: Obx(
                              () => CheckboxListTile(
                                value: controller.isSelectAll.value,
                                onChanged: (value) {
                                  controller.toggleSelectAll();
                                },
                                title: Text(
                                  "تحديد الكل",
                                  style: GoogleFonts.cairo(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                subtitle: Text(
                                  "${controller.filteredUsers.length} مستخدم",
                                  style: GoogleFonts.cairo(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                  ),
                                ),
                                activeColor: Colors.blue,
                                controlAffinity: ListTileControlAffinity.leading,
                                contentPadding: EdgeInsets.zero,
                              ),
                            ),
                          ),
                          Obx(
                            () => Text(
                              "المحدد: ${controller.selectedUserIds.length}",
                              style: GoogleFonts.cairo(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Colors.blue[700],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 8),

                    // === قائمة المستخدمين ===
                    Expanded(
                      child: Obx(
                        () => controller.filteredUsers.isEmpty
                            ? Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.people_outline,
                                      size: 64,
                                      color: Colors.grey[400],
                                    ),
                                    const SizedBox(height: 16),
                                    Text(
                                      controller.searchQuery.value.isNotEmpty
                                          ? "لا توجد نتائج للبحث"
                                          : "لا يوجد مستخدمين",
                                      style: GoogleFonts.cairo(
                                        fontSize: 16,
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                  ],
                                ),
                              )
                            : ListView.builder(
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                itemCount: controller.filteredUsers.length,
                                itemBuilder: (context, index) {
                                  final user = controller.filteredUsers[index];
                                  final userId = controller.filteredUserIds[index];
                                  return Obx( 
                                    ()=> Card(
                                      margin: const EdgeInsets.only(bottom: 8),
                                      elevation: 2,
                                       shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        side: BorderSide(
                                          color: controller.selectedUserIds.contains(userId)
                                              ? Colors.blue
                                              : Colors.transparent,
                                          width: 2,
                                        ),
                                      ),
                                      child: Obx(
                                        ()=> CheckboxListTile(
                                          value: controller.selectedUserIds.contains(userId),
                                          onChanged: (value) {
                                            controller.toggleUserSelection(userId);
                                          },
                                          title: Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                user['username'] ?? 'غير محدد',
                                                style: GoogleFonts.cairo(
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                              if (user['role'] != null)
                                                Container(
                                                  margin: const EdgeInsets.only(top: 4),
                                                  padding: const EdgeInsets.symmetric(
                                                    horizontal: 8,
                                                    vertical: 2,
                                                  ),
                                                  decoration: BoxDecoration(
                                                    color: user['role'] == 'admin'
                                                        ? Colors.purple.shade50
                                                        : Colors.green.shade50,
                                                    borderRadius: BorderRadius.circular(8),
                                                  ),
                                                  child: Text(
                                                    user['role'] == 'admin' ? 'أدمن' : 'مستخدم',
                                                    style: GoogleFonts.cairo(
                                                      fontSize: 11,
                                                      color: user['role'] == 'admin'
                                                          ? Colors.purple.shade700
                                                          : Colors.green.shade700,
                                                      fontWeight: FontWeight.w600,
                                                    ),
                                                  ),
                                                ),
                                            ],
                                          ),
                                          subtitle: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              const SizedBox(height: 4),
                                              Text(
                                                user['email'] ?? 'غير محدد',
                                                style: GoogleFonts.cairo(
                                                  fontSize: 13,
                                                  color: Colors.grey[600],
                                                ),
                                              ),
                                              
                                            ],
                                          ),
                                          
                                          activeColor: Colors.blue,
                                          controlAffinity: ListTileControlAffinity.leading,
                                          contentPadding: const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 8,
                                          ),
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                      ),
                    ),

                    // === زر الإرسال (يظهر فقط عند تحديد مستخدمين) ===
                    Obx(
                      () => (controller.isSelectAll.value ||
                              controller.selectedUserIds.isNotEmpty)
                          ? Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.05),
                                    blurRadius: 10,
                                    offset: const Offset(0, -2),
                                  ),
                                ],
                              ),
                              child: CustomButton(
                                text: "إرسال إشعار",
                                onPressed: () {
                                  _showNotificationBottomSheet(controller);
                                },
                                backgroundColor: Colors.blue,
                                foregroundColor: Colors.white,
                                leadingIcon: Icons.send,
                                height: 56,
                                borderRadius: 12,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            )
                          : const SizedBox.shrink(),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  void _showNotificationBottomSheet(AdminNotificationsController controller) {
    Get.bottomSheet(
      Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(Get.context!).viewInsets.bottom,
          left: 20,
          right: 20,
          top: 20,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 50,
                  height: 5,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),

              // العنوان
              Text(
                "إرسال إشعار",
                style: GoogleFonts.cairo(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800],
                ),
              ),

              const SizedBox(height: 8),

              // عدد المستخدمين المحددين
              Obx(
                () => Text(
                  controller.isSelectAll.value ||
                          controller.selectedUserIds.isEmpty
                      ? "سيتم إرسال الإشعار لجميع المستخدمين (${controller.filteredUsers.length})"
                      : "سيتم إرسال الإشعار لـ ${controller.selectedUserIds.length} مستخدم",
                  style: GoogleFonts.cairo(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // حقل عنوان الإشعار
              CustomTextFormField(
                label: "عنوان الإشعار",
                hint: "أدخل عنوان الإشعار",
                prefixIcon: const Icon(Icons.title, color: Colors.blue),
                controller: controller.titleController,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return "هذا الحقل مطلوب";
                  }
                  return null;
                },
              ),

              const SizedBox(height: 16),

              // حقل نص الإشعار
              CustomTextFormField(
                label: "نص الإشعار",
                hint: "أدخل نص الإشعار",
                prefixIcon: const Icon(Icons.message, color: Colors.blue),
                controller: controller.messageController,
                maxLines: 4,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return "هذا الحقل مطلوب";
                  }
                  return null;
                },
              ),

              const SizedBox(height: 24),

              // أزرار الإجراءات
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => safeBack(),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: BorderSide(color: Colors.grey[300]!),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        "إلغاء",
                        style: GoogleFonts.cairo(
                          fontSize: 16,
                          color: Colors.grey[700],
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Obx(
                      () => ElevatedButton(
                        onPressed: controller.isSending.value
                            ? null
                            : () {
                                // التحقق من البيانات
                                if (controller.titleController.text.trim().isEmpty) {
                                  showSnackBar(
                                    "مطلوب",
                                    "يرجى إدخال عنوان الإشعار",
                                    backgroundColor: Colors.orange,
                                    colorText: Colors.white,
                                  );
                                  return;
                                }

                                if (controller.messageController.text.trim().isEmpty) {
                                  showSnackBar(
                                    "مطلوب",
                                    "يرجى إدخال نص الإشعار",
                                    backgroundColor: Colors.orange,
                                    colorText: Colors.white,
                                  );
                                  return;
                                }

                                // تأكيد الإرسال
                                Get.dialog(
                                  AlertDialog(
                                    title: Text(
                                      "تأكيد الإرسال",
                                      style: GoogleFonts.cairo(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    content: Text(
                                      controller.isSelectAll.value ||
                                              controller.selectedUserIds.isEmpty
                                          ? "هل تريد إرسال الإشعار لجميع المستخدمين (${controller.filteredUsers.length})؟"
                                          : "هل تريد إرسال الإشعار لـ ${controller.selectedUserIds.length} مستخدم؟",
                                      style: GoogleFonts.cairo(),
                                    ),
                                    actions: [
                                      TextButton(
                                        onPressed: () => safeBack(),
                                        child: Text(
                                          "إلغاء",
                                          style: GoogleFonts.cairo(
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ),
                                      TextButton(
                                        onPressed: () {
                                          safeBack(); // إغلاق dialog التأكيد
                                          safeBack(); // إغلاق bottomSheet
                                          controller.sendNotifications();
                                        },
                                        child: Text(
                                          "إرسال",
                                          style: GoogleFonts.cairo(
                                            color: Colors.blue,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: controller.isSending.value
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : Text(
                                "إرسال",
                                style: GoogleFonts.cairo(
                                  fontSize: 16,
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
    );
  }
}

