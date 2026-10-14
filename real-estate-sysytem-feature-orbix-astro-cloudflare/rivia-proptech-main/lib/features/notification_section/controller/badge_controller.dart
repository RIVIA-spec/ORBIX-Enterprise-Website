import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/features/notification_section/view/notifications_screen.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';

class BadgeController extends GetxController {
  var unreadCount = 0.obs;
  StreamSubscription? _notificationSubscription;
  StreamSubscription? _newNotificationsSubscription;
  
  // تتبع الإشعارات المعروضة لتجنب عرض نفس الإشعار مرتين
  final Set<String> _shownNotificationIds = <String>{};
  
  // وقت فتح التطبيق (لتجنب عرض الإشعارات القديمة)
  DateTime? _appStartTime;

  @override
  void onInit() {
    super.onInit();
    _appStartTime = DateTime.now();
    _listenToUnreadCount();
    _listenToNewNotifications();
  }

  @override
  void onClose() {
    cancelAllListeners();
    super.onClose();
  }

  // دالة لإلغاء جميع الـ listeners (يمكن استدعاؤها يدوياً)
  void cancelAllListeners() {
    _notificationSubscription?.cancel();
    _newNotificationsSubscription?.cancel();
    _notificationSubscription = null;
    _newNotificationsSubscription = null;
  }

  void _listenToUnreadCount() {
    // إلغاء الاشتراك السابق إن وجد
    _notificationSubscription?.cancel();

    final userId = FirebaseAuth.instance.currentUser?.uid;
    
    // إذا لم يكن هناك مستخدم مسجل دخول، لا نبدأ الاستماع
    if (userId == null) {
      unreadCount.value = 0;
      return;
    }

    _notificationSubscription = FirebaseFirestore.instance
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .where('read', isEqualTo: false)
        .snapshots()
        .listen(
      (snapshot) {
        // التحقق من أن المستخدم ما زال مسجل دخول
        if (FirebaseAuth.instance.currentUser?.uid != userId) {
          _notificationSubscription?.cancel();
          return;
        }
        unreadCount.value = snapshot.docs.length;
      },
      onError: (error) {
        // تجاهل أخطاء PERMISSION_DENIED عند تسجيل الخروج
        if (error.toString().contains('PERMISSION_DENIED')) {
          _notificationSubscription?.cancel();
          unreadCount.value = 0;
          return;
        }
        debugPrint('خطأ في الاستماع للإشعارات: $error');
      },
    );
  }

  // الاستماع للإشعارات الجديدة لعرضها كـ bottom sheet
  void _listenToNewNotifications() async {
    _newNotificationsSubscription?.cancel();

    final userId = FirebaseAuth.instance.currentUser?.uid;
    
    if (userId == null) {
      return;
    }

    // تحميل جميع الإشعارات الحالية ووضعها في القائمة لتجنب عرضها
    try {
      final currentNotifications = await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .collection('notifications')
          .get();
      
      // إضافة جميع الإشعارات الحالية إلى القائمة
      for (var doc in currentNotifications.docs) {
        _shownNotificationIds.add(doc.id);
      }
    } catch (e) {
      // تجاهل الخطأ
    }

    // الآن الاستماع للإشعارات الجديدة فقط
    _newNotificationsSubscription = FirebaseFirestore.instance
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .orderBy('created_at', descending: true)
        .snapshots()
        .listen(
      (snapshot) {
        // التحقق من أن المستخدم ما زال مسجل دخول
        if (FirebaseAuth.instance.currentUser?.uid != userId) {
          _newNotificationsSubscription?.cancel();
          return;
        }
        
        // التحقق من التغييرات الجديدة فقط
        for (var change in snapshot.docChanges) {
          // عرض الإشعار فقط إذا كان جديداً (added) وليس موجوداً في القائمة
          if (change.type == DocumentChangeType.added) {
            final notificationId = change.doc.id;
            final notificationData = change.doc.data();

            // التحقق من وجود البيانات
            if (notificationData == null) continue;

            // التحقق من وقت إنشاء الإشعار (عرض الإشعارات التي تم إنشاؤها بعد فتح التطبيق)
            final createdAt = notificationData['created_at'] as Timestamp?;
            if (createdAt != null && _appStartTime != null) {
              final notificationTime = createdAt.toDate();
              // إذا كان الإشعار أقدم من وقت فتح التطبيق، تجاهله
              if (notificationTime.isBefore(_appStartTime!)) {
                _shownNotificationIds.add(notificationId); // إضافته للقائمة لتجنب عرضه لاحقاً
                continue;
              }
            }

            // التحقق من أن الإشعار جديد ولم يتم عرضه من قبل
            if (!_shownNotificationIds.contains(notificationId)) {
              // التحقق من أن الإشعار غير مقروء
              if (notificationData['read'] != true) {
                _shownNotificationIds.add(notificationId);
                _showNotificationBottomSheet(notificationData);
              }
            }
          }
        }
      },
      onError: (error) {
        // تجاهل أخطاء PERMISSION_DENIED عند تسجيل الخروج
        if (error.toString().contains('PERMISSION_DENIED')) {
          _newNotificationsSubscription?.cancel();
          return;
        }
        debugPrint('خطأ في الاستماع للإشعارات الجديدة: $error');
      },
    );
  }

  // عرض الإشعار كـ bottom sheet
  void _showNotificationBottomSheet(Map<String, dynamic> notificationData) {
    // التأكد من وجود context
    if (Get.context == null) return;

    // تجنب عرض bottom sheet إذا كان هناك واحد مفتوح بالفعل
    if (Get.isBottomSheetOpen == true) return;

    final title = notificationData['title'] ?? 'إشعار جديد';
    final message = notificationData['message'] ?? '';
    final type = notificationData['type'] ?? 'custom';

    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 50,
                height: 5,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),

            // أيقونة الإشعار
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _getAccentColor(type).withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _getIcon(type),
                    color: _getAccentColor(type),
                    size: 28,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.cairo(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey[800],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'الآن',
                        style: GoogleFonts.cairo(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.grey),
                  onPressed: () => safeBack(),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // نص الإشعار
            if (message.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  message,
                  style: GoogleFonts.cairo(
                    fontSize: 14,
                    color: Colors.grey[700],
                    height: 1.5,
                  ),
                ),
              ),

            const SizedBox(height: 16),

            // زر الإجراء
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  safeBack();
                  // التنقل إلى صفحة الإشعارات
                  Get.to(() => const NotificationsScreen());
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: _getAccentColor(type),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  'عرض التفاصيل',
                  style: GoogleFonts.cairo(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      isScrollControlled: true,
      enableDrag: true,
      isDismissible: true,
    );
  }

  Color _getAccentColor(String type) {
    switch (type) {
      case 'accept':
        return Colors.green;
      case 'reject':
        return Colors.red;
      case 'warning':
        return Colors.orange;
      case 'custom':
        return Colors.blue;
      default:
        return Colors.blue;
    }
  }

  IconData _getIcon(String type) {
    switch (type) {
      case 'accept':
        return Icons.check_circle;
      case 'reject':
        return Icons.cancel;
      case 'warning':
        return Icons.warning_rounded;
      case 'custom':
        return Icons.notifications_active;
      default:
        return Icons.notifications;
    }
  }

  // دالة لإعادة تهيئة الاستماع (مفيدة بعد تسجيل الدخول)
  void refreshNotifications() {
    _appStartTime = DateTime.now(); // تحديث وقت فتح التطبيق
    _shownNotificationIds.clear(); // مسح الإشعارات المعروضة
    _listenToUnreadCount();
    _listenToNewNotifications();
  }
}