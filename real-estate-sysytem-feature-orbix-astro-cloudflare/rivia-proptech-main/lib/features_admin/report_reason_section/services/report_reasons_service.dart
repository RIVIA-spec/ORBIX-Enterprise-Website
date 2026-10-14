// lib/services/report_reasons_service.dart

import 'package:cloud_firestore/cloud_firestore.dart';

class ReportReasonsService {
  final FirebaseFirestore firestore = FirebaseFirestore.instance;
  final String collectionPath = 'report_reasons';

  // جلب مرة واحدة
  Future<List<Map<String, dynamic>>> getAllReasonsOnce() async {
    final snapshot = await firestore.collection(collectionPath).get();
    return snapshot.docs.map((doc) {
      final data = doc.data();
      return {
        'id': doc.id,
        'reason': data['reason'] ?? 'غير محدد',
      };
    }).toList();
  }

  // إضافة سبب جديد (مع ID تلقائي من Firebase)
  Future<String> addReason(String reasonText) async {
    final trimmed = reasonText.trim();
    if (trimmed.isEmpty) throw Exception("السبب لا يمكن أن يكون فارغًا");

    final docRef = firestore.collection(collectionPath).doc(); // يولد ID تلقائيًا
    await docRef.set({
      'reason': trimmed,
      'created_at': FieldValue.serverTimestamp(),
    });

    return docRef.id; // نُرجع الـ ID الجديد
  }

  // تعديل سبب
  Future<void> updateReason(String id, String newReason) async {
    final trimmed = newReason.trim();
    if (trimmed.isEmpty) throw Exception("السبب لا يمكن أن يكون فارغًا");

    await firestore.collection(collectionPath).doc(id).update({
      'reason': trimmed,
    });
  }

  // حذف سبب
  Future<void> deleteReason(String id) async {
    await firestore.collection(collectionPath).doc(id).delete();
  }

  // إعادة تعيين الأسباب الافتراضية (مع ID تلقائي)
  Future<void> seedReportReasons() async {
    final defaultReasons = [
      'احتيال أو خداع',
      'معلومات خاطئة أو مضللة',
      'صور غير لائقة',
      'تم البيع أو الإيجار بالفعل',
      'إعلان مزعج أو مكرر',
      'سبب آخر',
    ];

    final batch = firestore.batch();

    // حذف الكل أولاً
    final existing = await firestore.collection(collectionPath).get();
    for (var doc in existing.docs) {
      batch.delete(doc.reference);
    }

    // إضافة الجديدة بـ ID تلقائي
    for (var reason in defaultReasons) {
      final docRef = firestore.collection(collectionPath).doc(); // ID تلقائي
      batch.set(docRef, {
        'reason': reason,
        'created_at': FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    print("تم إعادة تعيين الأسباب الافتراضية بنجاح!");
  }
}