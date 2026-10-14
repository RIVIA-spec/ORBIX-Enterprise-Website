// lib/features/user/my_property/controller/pending_property_requests_controller.dart
import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:get/get.dart';

class PendingPropertyRequestsController extends GetxController {
  final userId = FirebaseAuth.instance.currentUser!.uid;

  var requests = <Map<String, dynamic>>[].obs;
  var isLoading = true.obs;

  @override
  void onInit() {
    super.onInit();
    loadPendingRequests();
  }

  Future<void> loadPendingRequests() async {
    isLoading.value = true;
    try {
      final snap = await FirebaseFirestore.instance
          .collection('property_requests')
          .where('ownerId', isEqualTo: userId)
          .where('status', isEqualTo: 'pending')
          .get();

      requests.value = snap.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return data;
      }).toList();
    } catch (e, s) {
      log("خطأ في جلب الطلبات المعلقة", error: e, stackTrace: s);
      requests.clear();
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> refreshData() => loadPendingRequests();
}