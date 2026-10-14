import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/features_admin/admin_booking_section/view/admin_pending_bookings_screen.dart';
import 'package:real_estate_app/features_admin/admin_pending_properties_section/view/admin_pending_property_requests_screen.dart';
import 'package:real_estate_app/features_admin/admin_users_section/view/admin_users_screen.dart';
import 'package:real_estate_app/features_admin/control_panel_section/controller/control_panel_controller.dart';
import 'package:real_estate_app/features_admin/identifiy_verfication_request_section/view/identity_verification_requests_screen.dart';
import 'package:real_estate_app/features_admin/report_section/view/report_screen.dart';
import 'package:real_estate_app/features_admin/whatsapp_contact_section/view/whatsapp_contact_page.dart';

class BuildStatusSection extends StatelessWidget {
  BuildStatusSection({super.key});

  final UserController userCtr = Get.put(UserController());

  @override
  Widget build(BuildContext context) {
    final ctrl = Get.find<ControlPanelController>();

    return Obx(() {
      if (ctrl.isLoading.value) {
        return LoadingDiscreteCircular(margin: EdgeInsets.only(top: Get.height * 0.25));
      }

      return GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: NeverScrollableScrollPhysics(),
        mainAxisSpacing: 16,
        crossAxisSpacing: 14,
        childAspectRatio: 0.8,
        children: [
          _StatCard(
            label: "طلبات تحقق من الهوية",
            value: ctrl.pendingVerifications.value,
            icon: Icons.pending_actions,
            onTap: () => Get.to(() => IdentityVerificationRequestsScreen()),
          ),
          _StatCard(
            label: "طلبات نشر/تعديل عقارات معلقة",
            value: ctrl.pendingProperties.value,
            icon: Icons.approval_rounded,
            onTap: () => Get.to(() => AdminPendingPropertyRequestsScreen()),
          ),
          _StatCard(
            label: "طلبات حجز معلقة",
            value: ctrl.pendingBookingsCount.value,
            icon: Icons.hourglass_bottom_rounded,
            onTap: () => Get.to(() => AdminPendingBookingsScreen()),
          ),
          _StatCard(
            label: "الإبلاغات",
            value: ctrl.reportsCount.value,
            icon: Icons.report_gmailerrorred_rounded,
            onTap: () => Get.to(() => ReportScreen()),
          ),
          if(userCtr.isOwner.value)
          ...[
            _StatCard(label: "إجمالي المستخدمين", value: ctrl.totalUsers.value, icon: Icons.people_alt_rounded,
              onTap: () => Get.to(() => AdminUsersScreen()),
            ),
            _StatCard(label: "مستخدمون متحققون", value: ctrl.verifiedUsers.value, icon: Icons.verified),
          ],
          _StatCard(label: "إجمالي العقارات", value: ctrl.totalProperties.value, icon: Icons.home_work_rounded),
        ],
      );
    });
  }
}

class _StatCard extends StatefulWidget {
  final String label;
  final int value;
  final bool showValue;
  final IconData icon;
  final Function()? onTap;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    this.onTap,
    this.showValue = true,
  });

  @override
  State<_StatCard> createState() => _StatCardState();
}

class _StatCardState extends State<_StatCard> with SingleTickerProviderStateMixin {
  double scale = 1.0;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => scale = 0.97),
      onTapUp: (_) => setState(() => scale = 1.0),
      onTapCancel: () => setState(() => scale = 1.0),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: scale,
        duration: Duration(milliseconds: 120),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: Colors.black12,
                blurRadius: 8,
                spreadRadius: 1,
                offset: Offset(1, 3),
              )
            ],
          ),
          padding: EdgeInsets.symmetric(vertical: 22, horizontal: 10),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // دائرة الأيقونة
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [
                      Colors.blue.shade400,
                      Colors.blue.shade600,
                    ],
                  ),
                ),
                child: Icon(widget.icon, size: 26, color: Colors.white),
              ),

              SizedBox(height: 12),

              if (widget.showValue)
                Text(
                  widget.value.toString(),
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),

              SizedBox(height: 4),

              Text(
                widget.label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  height: 1.3,
                  color: Colors.black54,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
