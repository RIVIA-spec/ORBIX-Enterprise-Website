// lib/features_admin/admin_notifications_section/controller/admin_notifications_controller.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:get/get.dart';

class AdminNotificationsController extends GetxController {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  var users = <Map<String, dynamic>>[].obs;
  var userIds = <String>[].obs;

  var filteredUsers = <Map<String, dynamic>>[].obs;
  var filteredUserIds = <String>[].obs;

  var selectedUserIds = <String>[].obs; // المستخدمون المحددون
  var isSelectAll = false.obs; // حالة تحديد الكل

  var isLoading = false.obs;
  var isSending = false.obs;

  final searchController = TextEditingController();
  var searchQuery = ''.obs;

  // حقول الإشعار
  final titleController = TextEditingController();
  final messageController = TextEditingController();

  @override
  void onInit() {
    super.onInit();
    loadUsers();
    searchController.addListener(() {
      search(searchController.text);
    });
  }

  @override
  void onClose() {
    searchController.dispose();
    titleController.dispose();
    messageController.dispose();
    super.onClose();
  }

  // ========= تحميل المستخدمين =========
  Future<void> loadUsers() async {
    try {
      isLoading.value = true;

      final snapshot = await _firestore.collection('users').get();

      final List<Map<String, dynamic>> tempUsers = [];
      final List<String> tempIds = [];

      for (final doc in snapshot.docs) {
        final data = doc.data();
        data['id'] = doc.id;
        // استبعاد صاحب التطبيق (owner)
        if (data['role'] == "owner") {
          continue;
        }
        tempUsers.add(Map<String, dynamic>.from(data));
        tempIds.add(doc.id);
      }

      users.assignAll(tempUsers);
      userIds.assignAll(tempIds);

      filteredUsers.assignAll(tempUsers);
      filteredUserIds.assignAll(tempIds);
    } catch (e) {
      showSnackBar(
        "خطأ",
        "فشل تحميل المستخدمين: $e",
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    } finally {
      isLoading.value = false;
    }
  }

  // ========= البحث =========
  void search(String query) {
    searchQuery.value = query.trim();

    if (query.isEmpty) {
      filteredUsers.assignAll(users);
      filteredUserIds.assignAll(userIds);
    } else {
      final q = query.toLowerCase();
      final List<Map<String, dynamic>> filtered = [];
      final List<String> filteredIds = [];

      for (int i = 0; i < users.length; i++) {
        final u = users[i];

        final username = u['username']?.toString().toLowerCase() ?? '';
        final email = u['email']?.toString().toLowerCase() ?? '';

        if (username.contains(q) || email.contains(q)) {
          filtered.add(u);
          filteredIds.add(userIds[i]);
        }
      }

      filteredUsers.assignAll(filtered);
      filteredUserIds.assignAll(filteredIds);
    }

    // إعادة تعيين حالة تحديد الكل بعد البحث
    updateSelectAllState();
    
    // إزالة المستخدمين المحددين الذين لم يعودوا في النتائج
    selectedUserIds.removeWhere((userId) => !filteredUserIds.contains(userId));
  }

  // ========= تحديد/إلغاء تحديد مستخدم =========
  void toggleUserSelection(String userId) {
    if (selectedUserIds.contains(userId)) {
      selectedUserIds.remove(userId);
    } else {
      selectedUserIds.add(userId);
    }
    // تحديث حالة تحديد الكل
    updateSelectAllState();
  }

  // ========= تحديد الكل / إلغاء تحديد الكل =========
  void toggleSelectAll() {
    if (isSelectAll.value) {
      // إلغاء تحديد الكل
      selectedUserIds.clear();
      isSelectAll.value = false;
    } else {
      // تحديد الكل
      selectedUserIds.assignAll(filteredUserIds);
      isSelectAll.value = true;
    }
  }

  // ========= تحديث حالة تحديد الكل =========
  void updateSelectAllState() {
    if (filteredUserIds.isEmpty) {
      isSelectAll.value = false;
      return;
    }
    isSelectAll.value = selectedUserIds.length == filteredUserIds.length;
  }

  // ========= إرسال الإشعار =========
  Future<void> sendNotifications() async {
    // التحقق من البيانات
    if (titleController.text.trim().isEmpty) {
      showSnackBar("مطلوب", "يرجى إدخال عنوان الإشعار",
          backgroundColor: Colors.orange, colorText: Colors.white);
      return;
    }

    if (messageController.text.trim().isEmpty) {
      showSnackBar("مطلوب", "يرجى إدخال نص الإشعار",
          backgroundColor: Colors.orange, colorText: Colors.white);
      return;
    }

    // تحديد المستخدمين المستهدفين
    List<String> targetUserIds;
    if (isSelectAll.value || selectedUserIds.isEmpty) {
      // إرسال لجميع المستخدمين
      targetUserIds = filteredUserIds.toList();
    } else {
      // إرسال للمستخدمين المحددين فقط
      targetUserIds = selectedUserIds.toList();
    }

    if (targetUserIds.isEmpty) {
      showSnackBar("تحذير", "لم يتم تحديد أي مستخدم",
          backgroundColor: Colors.orange, colorText: Colors.white);
      return;
    }

    try {
      isSending.value = true;

      final batch = _firestore.batch();
      final timestamp = FieldValue.serverTimestamp();

      for (final userId in targetUserIds) {
        final notificationRef = _firestore
            .collection('users')
            .doc(userId)
            .collection('notifications')
            .doc();

        batch.set(notificationRef, {
          'id': notificationRef.id,
          'title': titleController.text.trim(),
          'message': messageController.text.trim(),
          'type': 'custom', // نوع الإشعار المخصص
          'read': false,
          'created_at': timestamp,
        });
      }

      await batch.commit();

      // إرسال إشعارات FCM خارج التطبيق
      final fcmResult = await _sendFCMNotifications(targetUserIds);
      
      // مسح الحقول والمحددات
      titleController.clear();
      messageController.clear();
      selectedUserIds.clear();
      isSelectAll.value = false;

      // رسالة نجاح مع معلومات FCM
      String successMessage = "تم إرسال الإشعار لـ ${targetUserIds.length} مستخدم";
      if (fcmResult['tokens_found'] > 0) {
        successMessage += "\nتم إرسال إشعارات FCM لـ ${fcmResult['tokens_found']} جهاز";
      } else {
        successMessage += "\n⚠️ لم يتم العثور على FCM tokens للمستخدمين";
      }

      showSnackBar(
        "تم بنجاح!",
        successMessage,
        backgroundColor: Colors.green,
        colorText: Colors.white,
        duration: const Duration(seconds: 4),
      );
    } catch (e) {
      showSnackBar(
        "خطأ",
        "فشل إرسال الإشعارات: $e",
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    } finally {
      isSending.value = false;
    }
  }

  // ========= إرسال إشعارات FCM =========
  Future<Map<String, dynamic>> _sendFCMNotifications(List<String> userIds) async {
    int tokensFound = 0;
    int requestsCreated = 0;
    
    try {
      debugPrint('🔔 Starting FCM notification process for ${userIds.length} users');
      
      // جلب FCM tokens للمستخدمين
      final List<String> fcmTokens = [];
      
      for (final userId in userIds) {
        try {
          final userDoc = await _firestore.collection('users').doc(userId).get();
          if (userDoc.exists) {
            final userData = userDoc.data();
            final fcmToken = userData?['fcm_token'] as String?;
            if (fcmToken != null && fcmToken.isNotEmpty) {
              fcmTokens.add(fcmToken);
              debugPrint('✅ Found FCM token for user: $userId');
            } else {
              debugPrint('⚠️ No FCM token found for user: $userId');
            }
          } else {
            debugPrint('⚠️ User document not found: $userId');
          }
        } catch (e) {
          debugPrint('❌ Error getting FCM token for user $userId: $e');
        }
      }

      tokensFound = fcmTokens.length;

      if (fcmTokens.isEmpty) {
        debugPrint('❌ No FCM tokens found for any of the selected users');
        return {
          'success': false,
          'tokens_found': 0,
          'requests_created': 0,
          'error': 'No FCM tokens found',
        };
      }

      debugPrint('✅ Found ${fcmTokens.length} FCM tokens out of ${userIds.length} users');

      final title = titleController.text.trim();
      final message = messageController.text.trim();

      // التحقق من صلاحيات المستخدم قبل إرسال FCM
      try {
        final currentUser = FirebaseAuth.instance.currentUser;
        if (currentUser == null) {
          throw Exception('المستخدم غير مسجل دخول');
        }
        
        debugPrint('👤 Current user UID: ${currentUser.uid}');
        
        final userDoc = await _firestore.collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists) {
          debugPrint('❌ User document does not exist in Firestore');
          throw Exception('مستند المستخدم غير موجود في Firestore. UID: ${currentUser.uid}');
        }
        
        final userData = userDoc.data();
        final userRole = userData?['role'] as String?;
        debugPrint('👤 Current user role: $userRole');
        debugPrint('👤 User data: ${userData?.toString()}');
        
        if (userRole != 'admin' && userRole != 'owner') {
          debugPrint('❌ User does not have required role. Current role: $userRole');
          throw Exception('المستخدم ليس لديه صلاحية لإرسال إشعارات FCM. Role الحالي: ${userRole ?? "غير محدد"}. يجب أن يكون admin أو owner');
        }
        
        debugPrint('✅ Permission check passed. User has role: $userRole');
      } catch (e) {
        debugPrint('❌ Permission check failed: $e');
        debugPrint('❌ Stack trace: ${StackTrace.current}');
        throw Exception('فشل التحقق من الصلاحيات: $e');
      }

      // إرسال إشعار FCM عبر Cloud Functions
      // الطريقة الآمنة: إنشاء مستند في Firestore
      // Cloud Function سيراقب هذا المستند ويرسل الإشعارات
      try {
        // تقسيم tokens إلى مجموعات (FCM يدعم حتى 500 token في الطلب الواحد)
        const int batchSize = 500;
        for (int i = 0; i < fcmTokens.length; i += batchSize) {
          final batchTokens = fcmTokens.skip(i).take(batchSize).toList();
          
          debugPrint('📤 Creating FCM notification request for batch ${(i ~/ batchSize) + 1} (${batchTokens.length} tokens)');
          
          // إنشاء مستند في collection لإرسال الإشعارات
          // إضافة معلومات المستخدم الحالي للمساعدة في التشخيص
          final currentUser = FirebaseAuth.instance.currentUser;
          final userDoc = await _firestore.collection('users').doc(currentUser!.uid).get();
          final userRole = userDoc.data()?['role'] as String?;
          
          debugPrint('📝 Creating FCM request document with user role: $userRole');
          
          await _firestore.collection('fcm_notification_requests').add({
            'tokens': batchTokens,
            'title': title,
            'body': message,
            'type': 'custom',
            'created_at': FieldValue.serverTimestamp(),
            'status': 'pending',
            'created_by': currentUser.uid, // للمساعدة في التشخيص
            'created_by_role': userRole, // للمساعدة في التشخيص
          });
          
          debugPrint('✅ FCM request document created successfully');
          
          requestsCreated++;
          debugPrint('✅ FCM notification request created successfully');
        }

        debugPrint('✅ Successfully created $requestsCreated FCM notification request(s) for ${fcmTokens.length} devices');
        
        // التحقق من حالة الإشعارات بعد 3 ثوانٍ
        Future.delayed(const Duration(seconds: 3), () async {
          await _checkNotificationStatus();
        });
        
        return {
          'success': true,
          'tokens_found': tokensFound,
          'requests_created': requestsCreated,
        };
      } catch (e, stackTrace) {
        debugPrint('❌ Error creating FCM notification request: $e');
        debugPrint('Stack trace: $stackTrace');
        
        // تحديد نوع الخطأ وإظهار رسالة مناسبة
        String errorMessage = "تم حفظ الإشعارات في قاعدة البيانات، لكن فشل إرسال إشعارات FCM";
        
        if (e.toString().contains('permission-denied')) {
          final currentUser = FirebaseAuth.instance.currentUser;
          if (currentUser != null) {
            try {
              final userDoc = await _firestore.collection('users').doc(currentUser.uid).get();
              final userRole = userDoc.data()?['role'] as String?;
              errorMessage += "\n\nخطأ في الصلاحيات: المستخدم الحالي لديه role: '${userRole ?? "غير محدد"}'";
              errorMessage += "\nيجب أن يكون role: 'admin' أو 'owner' في Firestore";
              errorMessage += "\n\nملاحظة: هذا الخطأ ليس له علاقة بفتح التطبيق. FCM يعمل حتى لو كان التطبيق مغلقاً.";
            } catch (checkError) {
              errorMessage += "\n\nخطأ في الصلاحيات: فشل التحقق من role المستخدم";
            }
          } else {
            errorMessage += "\n\nخطأ: المستخدم غير مسجل دخول";
          }
        } else {
          errorMessage += ": $e";
        }
        
        // إظهار خطأ واضح للمستخدم
        showSnackBar(
          "تحذير",
          errorMessage,
          backgroundColor: Colors.orange,
          colorText: Colors.white,
          duration: const Duration(seconds: 5),
        );
        
        return {
          'success': false,
          'tokens_found': tokensFound,
          'requests_created': requestsCreated,
          'error': e.toString(),
        };
      }
      
    } catch (e, stackTrace) {
      debugPrint('❌ Error in _sendFCMNotifications: $e');
      debugPrint('Stack trace: $stackTrace');
      
      return {
        'success': false,
        'tokens_found': tokensFound,
        'requests_created': requestsCreated,
        'error': e.toString(),
      };
    }
  }

  // ========= التحقق من حالة الإشعارات =========
  Future<void> _checkNotificationStatus() async {
    try {
      // البحث عن آخر مستند تم إنشاؤه
      final snapshot = await _firestore
          .collection('fcm_notification_requests')
          .orderBy('created_at', descending: true)
          .limit(1)
          .get();

      if (snapshot.docs.isEmpty) {
        debugPrint('⚠️ No FCM notification requests found');
        return;
      }

      final doc = snapshot.docs.first;
      final data = doc.data();
      final status = data['status'] as String?;

      debugPrint('📊 FCM Notification Status: $status');

      if (status == 'pending') {
        debugPrint('⚠️ Cloud Function may not be deployed or not working');
        debugPrint('💡 Please check Firebase Console > Functions > Logs');
      } else if (status == 'completed') {
        final successCount = data['success_count'] as int? ?? 0;
        final failureCount = data['failure_count'] as int? ?? 0;
        debugPrint('✅ FCM notifications sent: $successCount success, $failureCount failed');
      } else if (status == 'failed') {
        final error = data['error'] as String? ?? 'Unknown error';
        debugPrint('❌ FCM notification failed: $error');
      }
    } catch (e) {
      debugPrint('❌ Error checking notification status: $e');
    }
  }
}

