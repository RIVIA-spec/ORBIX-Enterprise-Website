// lib/features/features/services/features_service.dart

import 'package:cloud_firestore/cloud_firestore.dart';

class FeaturesService {
  final FirebaseFirestore firestore = FirebaseFirestore.instance;
  final String docPath = 'features/global/';

  // جلب كل المميزات مرة واحدة
  Future<List<String>> getAllFeatures() async {
    final doc = await firestore.doc(docPath).get();
    if (!doc.exists) return [];
    final data = doc.data() as Map<String, dynamic>?;
    final List<dynamic> list = data?['list'] ?? [];
    return list.cast<String>();
  }

  // إضافة ميزة جديدة
  Future<void> addFeature(String title) async {
    final trimmed = title.trim();
    if (trimmed.isEmpty) throw Exception("اسم الميزة لا يمكن أن يكون فارغًا");

    await firestore.doc(docPath).set({
      'list': FieldValue.arrayUnion([trimmed])
    }, SetOptions(merge: true));
  }

  // تعديل ميزة (نحذف القديمة ونضيف الجديدة)
  Future<void> updateFeature(String oldTitle, String newTitle) async {
    final oldTrimmed = oldTitle.trim();
    final newTrimmed = newTitle.trim();
    if (newTrimmed.isEmpty) throw Exception("اسم الميزة لا يمكن أن يكون فارغًا");

    final batch = firestore.batch();
    final docRef = firestore.doc(docPath);

    batch.update(docRef, {
      'list': FieldValue.arrayRemove([oldTrimmed])
    });
    batch.update(docRef, {
      'list': FieldValue.arrayUnion([newTrimmed])
    });

    await batch.commit();
  }

  // حذف ميزة
  Future<void> deleteFeature(String title) async {
    final trimmed = title.trim();
    await firestore.doc(docPath).update({
      'list': FieldValue.arrayRemove([trimmed])
    });
  }
}