// lib/features/admin/users/widgets/user_card.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/features_admin/admin_users_section/controller/admin_users_controller.dart';

class AdminUserCard extends StatelessWidget {
  final Map<String, dynamic> user;
  final String uid;
  final Function(String, bool) onToggleActive;
  final bool isLoadingToggle;

  const AdminUserCard({
    super.key,
    required this.user,
    required this.uid,
    required this.onToggleActive,
    required this.isLoadingToggle,
  });

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<AdminUsersController>();
    final String username = user['username'] ?? 'بدون اسم';
    final String email = user['email'] ?? 'بدون إيميل';
    final bool isActive = user['isActive'] == true;
    final bool isVerified = user['isVerified'] ?? false;
    final String role = user['role'] ?? '';
    final bool isAdmin = role == 'admin';

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 4,
      color: isAdmin ? Colors.blue.shade100 : null,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _showUserDetailsBottomSheet(),
        child: Row(
          children: [
            // === زر التفعيل/إلغاء التفعيل (يسار) ===
            Obx(
              () {
                final isLoading = controller.getLoadingState(uid).value;
                final isActive = user['isActive'] == true;
                
                return SizedBox(
                  width: Get.width * 0.165,
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: isLoading
                        ? LoadingThreeArchedCircle(
                            size: 28,
                            color: isActive ? Colors.red : Colors.green,
                          )
                        : IconButton(
                            icon: Icon(
                              isActive ? Icons.check_circle : Icons.cancel,
                              color: isActive ? Colors.green : Colors.red,
                              size: 28,
                            ),
                            onPressed: () => onToggleActive(uid, !isActive),
                          ),
                  ),
                );
              },
            ),

            // === المعلومات ===
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          username,
                          style: GoogleFonts.cairo(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (isAdmin) ...[
                          const SizedBox(width: 8),
                          Text(
                            "مشرف",
                            style: GoogleFonts.cairo(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: Colors.blue.shade900,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      email,
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: isActive ? Colors.green.shade100 : Colors.red.shade100,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            isActive ? "مفعل" : "غير مفعل",
                            style: TextStyle(
                              color: isActive ? Colors.green.shade700 : Colors.red.shade700,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: isVerified ? Colors.blue.shade100 : Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            isVerified ? "مُحقق" : "غير مُحقق",
                            style: TextStyle(
                              color: isVerified ? Colors.blue.shade700 : Colors.grey.shade700,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showUserDetailsBottomSheet() {
    Get.bottomSheet(
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      Container(
        height: Get.height * 0.85,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))
          // borderRadius: BorderRadius(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // شريط السحب + زر الإغلاق
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 50,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    "تفاصيل المستخدم",
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  IconButton(
                    onPressed: () => safeBack(),
                    icon: const Icon(Icons.close, color: Colors.grey),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),

            // محتوى قابل للتمرير
            Expanded(
              child: FutureBuilder<QuerySnapshot>(
                future: FirebaseFirestore.instance
                    .collection('users')
                    .doc(uid)
                    .collection('user_bookings')
                    .orderBy('created_at', descending: true)
                    .get(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  final bookings = snapshot.data?.docs ?? [];

                  return ListView(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                    children: [
                      // === بطاقة معلومات المستخدم ===
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Colors.blue.shade50, Colors.indigo.shade50],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.blue.shade100),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 32,
                                  backgroundColor: Colors.blue.shade100,
                                  child: Text(
                                    (user['username'] ?? '?').substring(0, 1).toUpperCase(),
                                    style: TextStyle(
                                      fontSize: 28,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.blue.shade800,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        user['username'] ?? 'غير محدد',
                                        style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Text(
                                        user['email'] ?? 'لا يوجد بريد',
                                        style: TextStyle(color: Colors.grey[700], fontSize: 14),
                                      ),
                                    ],
                                  ),
                                ),
                                // حالة التفعيل
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: (user['isActive'] == true)
                                        ? Colors.green.shade100
                                        : Colors.red.shade100,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    user['isActive'] == true ? "مفعل" : "معطل",
                                    style: TextStyle(
                                      color: user['isActive'] == true
                                          ? Colors.green.shade800
                                          : Colors.red.shade800,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),

                            // معلومات إضافية
                            _infoTile("رقم المستخدم (UID)", uid, copyable: true),
                            _infoTile("التحقق من الهوية", user['isVerified'] == true ? "نعم" : "لا"),
                            _infoTile(
                              "تاريخ الإنشاء",
                              user['created_at'] != null
                                  ? (user['created_at'] as Timestamp)
                                      .toDate()
                                      .toString()
                                      .split('.')
                                      .first
                                  : "غير معروف",
                            ),
                            if (user['deactivation_reason'] != null)
                              _infoTile(
                                "سبب الإلغاء",
                                user['deactivation_reason'],
                                isWarning: true,
                              ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      // === قسم الحجوزات ===
                      Row(
                        children: [
                          const Icon(Icons.book_online, color: Colors.indigo),
                          const SizedBox(width: 8),
                          Text(
                            "الحجوزات (${bookings.length})",
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      if (bookings.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            color: Colors.grey[50],
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Center(
                            child: Column(
                              children: [
                                Icon(Icons.event_busy, size: 48, color: Colors.grey[400]),
                                const SizedBox(height: 12),
                                Text("لا توجد حجوزات بعد", style: TextStyle(color: Colors.grey[600])),
                              ],
                            ),
                          ),
                        )
                      else
                        ...bookings.map((doc) {
                          final data = doc.data() as Map<String, dynamic>;
                          final propertyTitle = data['property_title'] ?? 'عقار غير محدد';
                          final checkIn = data['check_in'] ?? '?';
                          final checkOut = data['check_out'] ?? '?';
                          final status = data['status'] ?? 'غير معروف';

                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            elevation: 2,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(16),
                              leading: Container(
                                width: 50,
                                height: 50,
                                decoration: BoxDecoration(
                                  color: _getStatusColor(status).withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(
                                  Icons.home,
                                  color: _getStatusColor(status),
                                ),
                              ),
                              title: Text(
                                propertyTitle,
                                style: const TextStyle(fontWeight: FontWeight.bold),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text("من: $checkIn  •  إلى: $checkOut"),
                                  const SizedBox(height: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(status).withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      _getStatusText(status),
                                      style: TextStyle(
                                        color: _getStatusColor(status),
                                        fontWeight: FontWeight.bold,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                              onTap: () {
                                // يمكنك الانتقال إلى تفاصيل الحجز لاحقًا
                              },
                            ),
                          );
                        }).toList(),

                      const SizedBox(height: 20),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  // دوال مساعدة
  Widget _infoTile(String label, String value, {bool copyable = false, bool isWarning = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(
              "$label:",
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: isWarning ? Colors.red.shade700 : Colors.grey[700],
              ),
            ),
          ),
          Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    value,
                    style: TextStyle(
                      color: isWarning ? Colors.red.shade800 : Colors.black87,
                      fontWeight: isWarning ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                ),
                if (copyable)
                  IconButton(
                    icon: const Icon(Icons.copy, size: 18, color: Colors.grey),
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: value));
                      showSnackBar("تم النسخ", "تم نسخ $label إلى الحافظة", backgroundColor: Colors.green);
                    },
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'confirmed':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return "مكتمل";
      case 'confirmed':
        return "مؤكد";
      case 'pending':
        return "معلق";
      case 'cancelled':
        return "ملغى";
      default:
        return status;
    }
  }
}