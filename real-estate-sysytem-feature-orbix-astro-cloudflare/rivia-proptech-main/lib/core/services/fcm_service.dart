import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

// Handler للإشعارات عندما يكون التطبيق في الخلفية
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint("Handling a background message: ${message.messageId}");
  debugPrint("Title: ${message.notification?.title}");
  debugPrint("Body: ${message.notification?.body}");
}

class FCMService {
  static final FCMService _instance = FCMService._internal();
  factory FCMService() => _instance;
  FCMService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  String? _fcmToken;
  StreamSubscription<String>? _tokenSubscription;

  // الحصول على FCM token
  String? get fcmToken => _fcmToken;

  // تهيئة FCM
  Future<void> initialize() async {
    try {
      // طلب صلاحيات الإشعارات
      NotificationSettings settings = await _messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        debugPrint('✅ User granted notification permission');
      } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
        debugPrint('⚠️ User granted provisional notification permission');
      } else {
        debugPrint('❌ User declined or has not accepted notification permission');
        debugPrint('Authorization status: ${settings.authorizationStatus}');
        return;
      }

      // تسجيل handler للإشعارات في الخلفية
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      // الحصول على token الحالي
      _fcmToken = await _messaging.getToken();
      if (_fcmToken != null) {
        final tokenPreview = _fcmToken!.length > 20 
            ? '${_fcmToken!.substring(0, 20)}...' 
            : _fcmToken!;
        debugPrint('✅ FCM Token obtained: $_fcmToken');
      } else {
        debugPrint('❌ Failed to get FCM token');
      }

      // الاستماع لتغييرات token
      _tokenSubscription = _messaging.onTokenRefresh.listen((newToken) {
        _fcmToken = newToken;
        debugPrint('FCM Token refreshed: $newToken');
        _saveTokenToFirestore(newToken);
      });

      // حفظ token في Firestore إذا كان المستخدم مسجل دخول
      if (_auth.currentUser != null && _fcmToken != null) {
        await _saveTokenToFirestore(_fcmToken!);
      }

      // معالجة الإشعارات عندما يكون التطبيق مفتوحاً
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('Got a message whilst in the foreground!');
        debugPrint('Message data: ${message.data}');
        if (message.notification != null) {
          debugPrint('Message also contained a notification: ${message.notification}');
        }
      });

      // معالجة النقر على الإشعار عندما يكون التطبيق في الخلفية
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('A new onMessageOpenedApp event was published!');
        debugPrint('Message data: ${message.data}');
        if (message.notification != null) {
          debugPrint('Message notification: ${message.notification}');
        }
      });

      // التحقق من وجود إشعار عند فتح التطبيق
      RemoteMessage? initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        debugPrint('App opened from notification: ${initialMessage.data}');
      }
    } catch (e) {
      debugPrint('Error initializing FCM: $e');
    }
  }

  // حفظ FCM token في Firestore
  Future<void> _saveTokenToFirestore(String token) async {
    try {
      final userId = _auth.currentUser?.uid;
      if (userId == null) return;

      await _firestore.collection('users').doc(userId).update({
        'fcm_token': token,
        'fcm_token_updated_at': FieldValue.serverTimestamp(),
      });
      debugPrint('✅ FCM token saved to Firestore for user: $userId');
    } catch (e) {
      debugPrint('Error saving FCM token: $e');
    }
  }

  // حفظ FCM token للمستخدم الحالي
  Future<void> saveTokenForCurrentUser() async {
    try {
      if (_fcmToken == null) {
        _fcmToken = await _messaging.getToken();
      }
      
      if (_fcmToken != null) {
        await _saveTokenToFirestore(_fcmToken!);
      }
    } catch (e) {
      debugPrint('Error saving FCM token for current user: $e');
    }
  }

  // حذف FCM token عند تسجيل الخروج
  Future<void> deleteToken() async {
    try {
      final userId = _auth.currentUser?.uid;
      if (userId != null) {
        await _firestore.collection('users').doc(userId).update({
          'fcm_token': FieldValue.delete(),
        });
      }
      await _messaging.deleteToken();
      _fcmToken = null;
      debugPrint('FCM token deleted');
    } catch (e) {
      debugPrint('Error deleting FCM token: $e');
    }
  }

  // إلغاء الاشتراك
  void dispose() {
    _tokenSubscription?.cancel();
  }
}

