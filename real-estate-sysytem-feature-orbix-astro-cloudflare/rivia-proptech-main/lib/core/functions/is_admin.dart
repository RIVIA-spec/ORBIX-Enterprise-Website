import 'package:cloud_firestore/cloud_firestore.dart';

Future<Map<String, dynamic>> getUserStatus(String uid) async {
  final doc = await FirebaseFirestore.instance
      .collection('users')
      .doc(uid)
      .get();
  final data = doc.data() ?? {};
  return {
    'isOwner': data['role'] == 'owner',
    'isAdmin': data['role'] == 'admin',
    'isActive': data['isActive'] ?? false,
    'deactivation_reason': data['deactivation_reason'] ?? 'غير محدد',
  };
}