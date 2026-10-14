import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/features_admin/ads_section/view/ads_management_screen.dart';
import 'package:real_estate_app/features_admin/add_admin_section/view/add_admin_screen.dart';
import 'package:real_estate_app/features_admin/add_distinct_property/view/add_distinct_property_screen.dart';
import 'package:real_estate_app/features_admin/control_panel_section/controller/control_panel_controller.dart';
import 'package:real_estate_app/features_admin/control_panel_section/widget/build_action_card.dart';
import 'package:real_estate_app/features_admin/control_panel_section/widget/build_status_section.dart';
import 'package:real_estate_app/features_admin/properties_visibility_section/view/visibility_screen.dart';
import 'package:real_estate_app/features_admin/property_category_section/view/property_categories_screen.dart';
import 'package:real_estate_app/features_admin/property_features_section/view/property_features_screen.dart';
import 'package:real_estate_app/features_admin/report_reason_section/view/report_reasons_screen.dart';
import 'package:real_estate_app/features_admin/whatsapp_contact_section/view/whatsapp_contact_page.dart';
import 'package:real_estate_app/features_admin/admin_notifications_section/view/admin_notifications_screen.dart';
import 'package:real_estate_app/features/contracts_section/view/contracts_page.dart';
import 'package:real_estate_app/features/contracts_section/view/transactions_page.dart';

class ControlPanelScreen extends StatelessWidget {
  final ControlPanelController ctrl = Get.put(ControlPanelController());
  final UserController userCtr = Get.put(UserController());

  ControlPanelScreen({super.key});

  // مؤشر التبويب
  final RxInt selectedTab = 2.obs; // 1 = إدارة العقارات | 2 = الإحصائيات

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: "لوحة تحكم الأدمن"),
      body: RefreshIndicator(
        onRefresh: ()  async {
            ctrl.refreshData();
        },
        child: SingleChildScrollView(
            physics: AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
          
                // ============================
                //  🔵 الأزرار العلوية (Tab Bar)
                // ============================
                Row(
                  children: [
                    _buildTopTab(
                      index: 1,
                      icon: Icons.home_repair_service,
                      text: "إدارة التطبيق",
                      color: Colors.blue,
                    ),
                    const SizedBox(width: 12),
                    _buildTopTab(
                      index: 2,
                      icon: Icons.analytics,
                      text: "الإحصائيات والطلبات",
                      color: Colors.green,
                    ),
                  ],
                ),
          
                const SizedBox(height: 24),
          
                // ============================
                //  🔵 محتوى التبويب المختار
                // ============================
                Obx(() {
                  if (selectedTab.value == 1) {
                    // -----------------------------
                    //   📌 تبويب إدارة العقارات
                    // -----------------------------
                    return Column(
                      children: [
                        BuildActionCard(
                          title: "إضافة عقار/فندق مميز",
                          icon: Icons.star,
                          color: Colors.amber.shade700,
                          onTap: () => Get.to(() => AddDistinctPropertyScreen()),
                        ),
                        const SizedBox(height: 12),
                        if(userCtr.isOwner.value)
                        ...[
                          BuildActionCard(
                            title: "إخفاء / إظهار العقارات",
                            icon: Icons.visibility,
                            color: Colors.green.shade600,
                            onTap: () => Get.to(() => VisibilityScreen()),
                          ),
                          const SizedBox(height: 12),
                        ],
                        // if(userCtr.isOwner.value || userCtr.isAdmin.value)
                        ...[
                          BuildActionCard(
                            title: "إدارة الإعلانات",
                            icon: Icons.campaign_rounded,         // أيقونة مكبر صوت إعلاني – مثالية للإعلانات!
                            color: Colors.deepPurple.shade600,     // لون أرجواني غامق أنيق يميز الإعلانات
                            onTap: () => Get.to(() => AdsManagementScreen()),
                          ),
                          const SizedBox(height: 12),
                        ],
                        BuildActionCard(
                          title: "تغيير المميزات الخاصة بالعقارات",
                          icon: Icons.settings,
                          color: Colors.purple.shade700,
                          onTap: () => Get.to(() => PropertyFeaturesScreen()),
                        ),
                        const SizedBox(height: 12),
                        BuildActionCard(
                          title: "تغيير أنوع العقارات",
                          icon: Icons.category_rounded,
                          color: Colors.teal.shade700,
                          onTap: () => Get.to(() => PropertyCategoriesScreen()),
                        ),
                        const SizedBox(height: 12),
                        BuildActionCard(
                          title: "تغيير أسباب الإبلاغ",
                          icon: Icons.report_problem_rounded,
                          color: Colors.red.shade700,
                          onTap: () => Get.to(() => ReportReasonsScreen()),
                        ),
                        const SizedBox(height: 12),
                        if(userCtr.isOwner.value)
                        ...[
                          BuildActionCard(
                            title: "تعديل بيانات التواصل مع الأدمن",
                            icon: Icons.phone_in_talk_rounded,
                            color: Colors.green.shade300,
                            onTap: () => Get.to(() => WhatsAppContactScreen()),
                          ),
                          const SizedBox(height: 12),
                        ],
                        if(userCtr.isOwner.value)
                        ...[
                          BuildActionCard(
                            title: "إضافة مشرفين",
                            icon: Icons.admin_panel_settings,
                            color: Colors.indigo.shade700,
                            onTap: () => Get.to(() => AddAdminScreen()),
                          ),
                          const SizedBox(height: 12),
                        ],
                        BuildActionCard(
                          title: "إرسال إشعارات للمستخدمين",
                          icon: Icons.notifications_active_rounded,
                          color: Colors.orange.shade700,
                          onTap: () => Get.to(() => const AdminNotificationsScreen()),
                        ),
                        const SizedBox(height: 12),
                        BuildActionCard(
                          title: "العقود المتعلقة بي",
                          icon: Icons.assignment_outlined,
                          color: Colors.blueGrey.shade700,
                          onTap: () => Get.to(() => ContractsPage(partnerView: true)),
                        ),
                        const SizedBox(height: 12),
                        BuildActionCard(
                          title: "المعاملات المتعلقة بي",
                          icon: Icons.receipt_long_outlined,
                          color: Colors.teal.shade700,
                          onTap: () => Get.to(() => TransactionsPage()),
                        ),
                      ],
                    );
                  }
          
                  // -----------------------------
                  //   📌 تبويب الإحصائيات
                  // -----------------------------
                  return Column(
                    children: [
                      BuildStatusSection(),
                    ],
                  );
                }),
              ],
            ),
          ),
      ),
    );
  }

  // ============================
  //  🔵 تصميم زر التبويب العلوي
  // ============================
  Widget _buildTopTab({
    required int index,
    required IconData icon,
    required String text,
    required Color color,
  }) {
    return Expanded(
      child: Obx(() {
        final bool active = selectedTab.value == index;

        return GestureDetector(
          onTap: () => selectedTab.value = index,
          child: AnimatedContainer(
            duration: Duration(milliseconds: 250),
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              color: active ? color.withOpacity(0.15) : Colors.grey.shade200,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: active ? color : Colors.grey.shade300,
                width: active ? 2 : 1,
              ),
            ),
            child: Column(
              children: [
                Icon(icon, size: 28, color: active ? color : Colors.grey.shade600),
                const SizedBox(height: 6),
                Text(
                  text,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: active ? color : Colors.grey.shade700,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      }),
    );
  }
}
