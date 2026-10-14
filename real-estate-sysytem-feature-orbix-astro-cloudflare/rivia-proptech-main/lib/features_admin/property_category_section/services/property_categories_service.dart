// lib/features/property_categories/services/property_categories_service.dart

import 'package:cloud_firestore/cloud_firestore.dart';

class PropertyCategoriesService {
  final FirebaseFirestore firestore = FirebaseFirestore.instance;
  final String collectionPath = 'property_category';

  // جلب كل الفئات مرة واحدة
  Future<List<Map<String, dynamic>>> getAllCategoriesOnce() async {
    final snapshot = await firestore.collection(collectionPath).get();
    return snapshot.docs.map((doc) {
      final data = doc.data();
      return {
        'id': doc.id,
        'title': data['title'] ?? 'غير محدد',
      };
    }).toList();
  }

  // إضافة فئة جديدة
  Future<String> addCategory(String title) async {
    final trimmed = title.trim();
    if (trimmed.isEmpty) throw Exception("اسم الفئة لا يمكن أن يكون فارغًا");

    final docRef = firestore.collection(collectionPath).doc();
    await docRef.set({
      'title': trimmed,
      'created_at': FieldValue.serverTimestamp(),
    });

    return docRef.id;
  }

  // تعديل فئة
  Future<void> updateCategory(String id, String newTitle) async {
    final trimmed = newTitle.trim();
    if (trimmed.isEmpty) throw Exception("اسم الفئة لا يمكن أن يكون فارغًا");

    await firestore.collection(collectionPath).doc(id).update({
      'title': trimmed,
    });
  }

  // حذف فئة
  Future<void> deleteCategory(String id) async {
    await firestore.collection(collectionPath).doc(id).delete();
  }

  // إعادة تعيين الفئات الافتراضية
  Future<void> seedDefaultCategories() async {
    final defaultCategories = [
      'منزل',
      'شاليه',
      'مزرعة',
      'فيلا',
      'شقة',
      'أرض',
      'محل تجاري',
      'مكتب',
      'مستودع',
    ];

    final batch = firestore.batch();
    final existing = await firestore.collection(collectionPath).get();

    for (var doc in existing.docs) {
      batch.delete(doc.reference);
    }

    for (var title in defaultCategories) {
      final docRef = firestore.collection(collectionPath).doc();
      batch.set(docRef, {
        'title': title,
        'created_at': FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
  }
}